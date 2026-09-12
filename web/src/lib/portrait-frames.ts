export const FRAME_COUNTS = { idle: 96, transform: 240 } as const;
export type PortraitSequence = keyof typeof FRAME_COUNTS;
export type FrameSize = "desktop" | "mobile";
/**
 * Frames in flight at once. On a local dev server one request is enough to keep
 * ahead of any scrub, but over a real network each frame costs a round trip and
 * the scrub outruns the loader — the canvas then holds the last decoded frame
 * and the transform visibly steps. HTTP/2 multiplexes these onto one connection,
 * so the ceiling is bandwidth rather than sockets.
 */
const MAX_IN_FLIGHT = 8;
/** Compressed frames retained. 320 covers the longest sequence (240) with room to spare. */
const MAX_BLOBS = 320;
/**
 * How far from the live scrub target a frame is still worth decoding. Sized to
 * sit inside the 40-frame bitmap cache so a decode is not immediately undone by
 * its own eviction.
 */
const DECODE_WINDOW = 16;
export const frameUrl = (index: number, sequence: PortraitSequence, size: FrameSize) =>
  `/portrait/${sequence}/${size}/${String(index).padStart(3, "0")}.webp`;

/** Compressed blobs support reverse scrubbing; decoded bitmaps are bounded LRU. */
export class PortraitFrames {
  private bitmaps = new Map<number, ImageBitmap>();
  private blobs = new Map<number, Blob>();
  private pending = new Set<number>();
  private failed = new Set<number>();
  private queue: number[] = [];
  private controller = new AbortController();
  private target = 0;

  constructor(
    private sequence: PortraitSequence,
    private size: FrameSize,
    private ready: () => void,
    private error: () => void,
  ) {}

  request(frame: number) {
    const frameCount = FRAME_COUNTS[this.sequence];
    this.target = Math.min(frameCount - 1, Math.max(0, Math.round(frame)));
    const candidates = [this.target];
    for (let offset = 1; offset <= 6; offset++) candidates.push(this.target + offset, this.target - offset);
    const urgent = candidates.filter((n) => n >= 0 && n < frameCount &&
      !this.bitmaps.has(n) && !this.pending.has(n) && !this.failed.has(n));
    // The scrub window goes to the front, but whatever was already queued stays
    // behind it rather than being dropped. The queue holds the background
    // warm-up of the full sequence, and replacing it wholesale — as this once
    // did — meant the first scrub threw that work away and put the loader back
    // to fetching one round trip at a time.
    const urgentSet = new Set(urgent);
    this.queue = [...urgent, ...this.queue.filter((n) => !urgentSet.has(n))];
    if (this.failed.has(this.target)) this.error();
    this.pump();
    return this.get(this.target);
  }

  /** Appends frames to the load queue without disturbing the current scrub target's priority. */
  preload(frames: number[]) {
    const frameCount = FRAME_COUNTS[this.sequence];
    for (const frame of frames) {
      if (frame >= 0 && frame < frameCount && !this.bitmaps.has(frame) &&
        !this.pending.has(frame) && !this.failed.has(frame) && !this.queue.includes(frame)) {
        this.queue.push(frame);
      }
    }
    this.pump();
  }

  get(frame: number) {
    const bitmap = this.bitmaps.get(frame);
    if (bitmap) { this.bitmaps.delete(frame); this.bitmaps.set(frame, bitmap); }
    return bitmap;
  }

  private pump() {
    while (!this.controller.signal.aborted && this.pending.size < MAX_IN_FLIGHT && this.queue.length) {
      const frame = this.queue.shift()!;
      this.pending.add(frame);
      void this.load(frame);
    }
  }

  private async load(frame: number) {
    try {
      let blob = this.blobs.get(frame);
      if (blob) { this.blobs.delete(frame); this.blobs.set(frame, blob); }
      if (!blob) {
        const response = await fetch(frameUrl(frame, this.sequence, this.size), { signal: this.controller.signal });
        if (!response.ok) throw new Error(`Portrait frame ${frame}: ${response.status}`);
        blob = await response.blob();
        this.blobs.set(frame, blob);
        // Compressed frames are cheap to hold (~57KB each) and are what make
        // reverse scrubbing free, but a full preload would otherwise retain
        // every frame of the sequence for the life of the page. Evicting the
        // least recently touched keeps a whole 240-frame transform resident at
        // typical sizes while still bounding anything larger.
        while (this.blobs.size > MAX_BLOBS) {
          const oldest = this.blobs.keys().next().value!;
          if (oldest === frame) break;
          this.blobs.delete(oldest);
        }
      }
      // Decode only what the scrub can actually reach. The bitmap cache holds 40
      // frames, so decoding a warm-up frame 200 away would evict a frame near
      // the playhead and be evicted itself long before it is drawn — paying the
      // decode cost twice and stealing the cache from the frames on screen. The
      // blob is kept either way, which is the expensive half to fetch; decoding
      // it later is fast and local.
      if (Math.abs(frame - this.target) > DECODE_WINDOW) return;
      const bitmap = await createImageBitmap(blob);
      if (this.controller.signal.aborted) { bitmap.close(); return; }
      this.bitmaps.set(frame, bitmap);
      while (this.bitmaps.size > 40) {
        const oldest = this.bitmaps.keys().next().value!;
        this.bitmaps.get(oldest)!.close();
        this.bitmaps.delete(oldest);
      }
      this.ready();
    } catch (error) {
      if (!this.controller.signal.aborted) {
        console.warn("Portrait animation could not load a frame", error);
        this.failed.add(frame);
        if (frame === this.target) this.error();
      }
    } finally {
      this.pending.delete(frame);
      this.pump();
    }
  }

  dispose() {
    this.controller.abort();
    this.queue = [];
    this.bitmaps.forEach((bitmap) => bitmap.close());
    this.bitmaps.clear();
    this.blobs.clear();
  }
}
