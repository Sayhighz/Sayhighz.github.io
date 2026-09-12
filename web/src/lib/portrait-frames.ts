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
 * How far from the live scrub target a frame is still worth decoding, which
 * keeps a background warm-up from evicting the frames on screen. It stays below
 * `MAX_BITMAPS` so frames decoded for the current scrub are not evicted by
 * their own neighbours before being drawn; the frame the scrub is actually
 * waiting on bypasses the window entirely, and the pinned stride covers
 * anything further out.
 */
const DECODE_WINDOW = 20;
/**
 * Ceiling on how far ahead a fast scrub may queue. Past this the frames would
 * arrive after the scroll has already gone by, and the requests would only
 * compete with the ones due now.
 */
const MAX_REACH = 48;
/**
 * Decoded frames held. Each is an uncompressed 960x540 bitmap (~2MB), so this
 * is the memory-heavy cache and the number is a deliberate ceiling rather than
 * a comfort margin. With the pinned stride below, the two together come to
 * ~123MB on desktop and ~54MB on mobile; doubling either is the difference
 * between a page that holds its frames and one that holds a quarter of a
 * gigabyte. The compressed blobs (`MAX_BLOBS`) let an evicted frame come back
 * without touching the network.
 */
const MAX_BITMAPS = 32;

/**
 * Stride for the idle-time decode pass. A decode costs ~6.4ms, so only about
 * three fit in a 60fps frame — a fast scrub crossing twenty frames a tick can
 * never decode what it needs on demand. Decoding every Nth frame ahead of time
 * instead means such a scrub is never more than four frames from something
 * already decoded, which `nearest` draws immediately — indistinguishable at
 * that speed. The frames in between still decode on demand when the scrub is
 * slow enough to show them.
 */
const PREDECODE_STRIDE = 8;
export const frameUrl = (index: number, sequence: PortraitSequence, size: FrameSize) =>
  `/portrait/${sequence}/${size}/${String(index).padStart(3, "0")}.webp`;

/** Compressed blobs support reverse scrubbing; decoded bitmaps are bounded LRU. */
export class PortraitFrames {
  private bitmaps = new Map<number, ImageBitmap>();
  /**
   * Frames decoded during idle and held for the life of the sequence, on a
   * fixed stride across the whole range. They are the floor `nearest` falls
   * back to: however fast the scrub runs, it is never more than half a stride
   * from a frame that is already drawable. Kept out of the LRU because the
   * scrub would otherwise evict exactly the frames that make it smooth.
   */
  private pinned = new Map<number, ImageBitmap>();
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
    const previous = this.target;
    this.target = Math.min(frameCount - 1, Math.max(0, Math.round(frame)));

    /**
     * How far the playhead moved since the last request. A slow read advances a
     * frame or two per tick; a fast flick can cross twenty or more, and the
     * frames in between are the ones the canvas would otherwise sit on while
     * the scroll runs away from it.
     */
    const velocity = Math.abs(this.target - previous);
    const direction = this.target >= previous ? 1 : -1;

    // Ask for the span actually crossed, not a fixed neighbourhood: at speed
    // that span is what the next few ticks will draw. Ordered outward from the
    // target so the frame due now is fetched first, and biased along the
    // direction of travel, which is where the scrub is heading next.
    const reach = Math.min(MAX_REACH, Math.max(6, velocity * 2));
    const candidates = [this.target];
    for (let offset = 1; offset <= reach; offset++) {
      candidates.push(this.target + offset * direction, this.target - offset * direction);
    }
    const urgent = candidates.filter((n) => n >= 0 && n < frameCount &&
      !this.bitmaps.has(n) && !this.pinned.has(n) && !this.pending.has(n) && !this.failed.has(n));
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

  /**
   * Decodes a stride of frames across the whole sequence and holds them, so a
   * scrub of any speed always has something near at hand to draw.
   *
   * Runs one frame at a time and yields between each: a decode is ~6.4ms, and
   * doing 60 of them in a row would block the main thread for nearly half a
   * second — visible as a stall in the idle loop that is playing while this
   * work happens. `requestIdleCallback` hands the work to the gaps between
   * frames where it is free; the timeout keeps it progressing on a busy page,
   * and the setTimeout fallback covers Safari, which has no idle callback.
   */
  async predecode() {
    const frameCount = FRAME_COUNTS[this.sequence];
    const idle = (): Promise<void> =>
      new Promise((resolve) => {
        const ric = (globalThis as { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number })
          .requestIdleCallback;
        if (ric) ric(() => resolve(), { timeout: 200 });
        else setTimeout(resolve, 16);
      });

    for (let frame = 0; frame < frameCount; frame += PREDECODE_STRIDE) {
      if (this.controller.signal.aborted) return;
      if (this.pinned.has(frame)) continue;
      const blob = this.blobs.get(frame);
      // The warm-up fetches in parallel with this pass, so a frame may not have
      // arrived yet. Skipping it is right: the stride is a safety net, not a
      // requirement, and a later pass or the scrub itself will pick it up.
      if (!blob) continue;
      try {
        const bitmap = await createImageBitmap(blob);
        if (this.controller.signal.aborted) { bitmap.close(); return; }
        this.pinned.set(frame, bitmap);
        this.ready();
      } catch {
        // A frame that will not decode is not worth retrying here; the scrub
        // path reports decode failures where they are actionable.
      }
      await idle();
    }
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
    return bitmap ?? this.pinned.get(frame);
  }

  /**
   * The decoded frame closest to `frame`, within `limit`.
   *
   * A fast scrub asks for frames faster than they can be decoded, and the exact
   * one is often a tick or two away. Holding the last drawn frame until it
   * arrives is what reads as a freeze — the playhead may have moved thirty
   * frames on by then. Drawing the nearest decoded neighbour instead keeps the
   * portrait moving with the scroll; at speed the difference between adjacent
   * frames is not perceptible, and the exact frame lands as soon as the scrub
   * settles.
   */
  nearest(frame: number, limit = 12): { bitmap: ImageBitmap; frame: number } | undefined {
    const exact = this.get(frame);
    if (exact) return { bitmap: exact, frame };
    // A frame that failed to load is a real failure, not a frame running late.
    // Substituting a neighbour would hide it behind an image that looks right,
    // leaving the reader with a portrait quietly stuck on the wrong frame and
    // no way to retry; the poster and its error notice are the honest result.
    if (this.failed.has(frame)) return undefined;
    for (let offset = 1; offset <= limit; offset++) {
      for (const candidate of [frame - offset, frame + offset]) {
        const cached = this.bitmaps.get(candidate);
        if (cached) {
          this.bitmaps.delete(candidate); this.bitmaps.set(candidate, cached);
          return { bitmap: cached, frame: candidate };
        }
        const held = this.pinned.get(candidate);
        if (held) return { bitmap: held, frame: candidate };
      }
    }
    return undefined;
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
      // Decode only what the scrub can still reach, so a background warm-up
      // does not evict the frames on screen from a 40-entry bitmap cache. The
      // frame the scrub is actually waiting on is never subject to this: a fast
      // scroll moves the target several frames per tick, and dropping the
      // decode for a frame that has just become the target is what leaves the
      // canvas holding one image while the scroll runs on.
      if (frame !== this.target && Math.abs(frame - this.target) > DECODE_WINDOW) return;
      const bitmap = await createImageBitmap(blob);
      if (this.controller.signal.aborted) { bitmap.close(); return; }
      this.bitmaps.set(frame, bitmap);
      while (this.bitmaps.size > MAX_BITMAPS) {
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
    this.pinned.forEach((bitmap) => bitmap.close());
    this.pinned.clear();
    this.blobs.clear();
  }
}
