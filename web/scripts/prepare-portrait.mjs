import { mkdir, readdir, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const ffmpeg = process.env.PORTRAIT_FFMPEG || "ffmpeg";
const sources = [
  ["idle", "hero-idle.mp4", 96],
  ["transform", "hero-transform.mp4", 240],
];
const sizes = [["desktop", "960:540", "84"], ["mobile", "640:360", "82"]];
const keyFilter = "chromakey=0x00FF00:0.16:0.06,format=rgba,despill=type=green:mix=0.5:expand=0:alpha=0";

for (const [sequence, filename, expectedFrames] of sources) {
  const input = path.resolve(root, "../output/hero-video", filename);
  for (const [size, dimensions, quality] of sizes) {
    const directory = path.join(root, "public/portrait", sequence, size);
    await rm(directory, { recursive: true, force: true });
    await mkdir(directory, { recursive: true });
    const result = spawnSync(ffmpeg, ["-hide_banner", "-loglevel", "error", "-i", input, "-an",
      "-vf", `${keyFilter},scale=${dimensions},format=rgba`,
      "-fps_mode", "passthrough", "-c:v", "libwebp", "-quality", quality,
      "-start_number", "0", "-y", path.join(directory, "%03d.webp")], { stdio: "inherit" });
    if (result.error || result.status !== 0) {
      throw result.error || new Error(`FFmpeg failed for ${sequence}/${size}`);
    }
    const frames = (await readdir(directory)).filter((name) => /^\d{3}\.webp$/.test(name));
    if (frames.length !== expectedFrames) {
      throw new Error(`Expected ${expectedFrames} frames for ${sequence}/${size}, got ${frames.length}`);
    }
    console.log(`${sequence}/${size}: ${frames.length} frames generated`);
  }
}
