import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // GitHub Pages serves plain files with no Node process, so the site is
  // exported as static HTML at build time.
  output: "export",
  // Pages has no image optimisation endpoint; the portrait frames are already
  // pre-sized webp and the poster is rendered with `unoptimized`.
  images: { unoptimized: true },
  // Directory-style URLs (`/about/index.html`) so paths resolve without the
  // server-side rewrites Pages cannot do.
  trailingSlash: true,
};

export default nextConfig;
