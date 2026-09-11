export const FRAME_COUNTS = { idle: 96, transform: 240 } as const;
export type PortraitSequence = keyof typeof FRAME_COUNTS;
export type FrameSize = "desktop" | "mobile";
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
    this.queue = candidates.filter((n) => n >= 0 && n < frameCount &&
      !this.bitmaps.has(n) && !this.pending.has(n) && !this.failed.has(n));
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
    while (!this.controller.signal.aborted && this.pending.size < 3 && this.queue.length) {
      const frame = this.queue.shift()!;
      this.pending.add(frame);
      void this.load(frame);
    }
  }

  private async load(frame: number) {
    try {
      let blob = this.blobs.get(frame);
      if (!blob) {
        const response = await fetch(frameUrl(frame, this.sequence, this.size), { signal: this.controller.signal });
        if (!response.ok) throw new Error(`Portrait frame ${frame}: ${response.status}`);
        blob = await response.blob();
        this.blobs.set(frame, blob);
      }
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
