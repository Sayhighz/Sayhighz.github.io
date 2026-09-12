/**
 * Caches the portrait frame sequences so the hero scrub survives the network.
 *
 * The hero scrubs 240 separate WebP frames against scroll position. GitHub Pages
 * serves every file with a fixed `cache-control: max-age=600` that cannot be
 * configured, so ten minutes on, the browser revalidates each frame and the
 * transform steps again. Holding the frames here puts that policy under our own
 * control: a cached frame is served from disk in about a millisecond, which is
 * what the scrub was tuned against locally, and it persists across visits.
 *
 * Frames are immutable — a new sequence ships under a new build — so a cache hit
 * is served without revalidation and never goes stale in a way that matters.
 */
const CACHE = "portrait-frames-v1";
const FRAME_PATH = "/portrait/";

self.addEventListener("install", (event) => {
  // Take over as soon as this version is installed rather than waiting for every
  // existing tab to close; the cache is additive, so there is no half-updated
  // state for a page to land in.
  self.skipWaiting();
  event.waitUntil(Promise.resolve());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Drop caches from earlier versions of this worker; the frames they hold
      // belong to a build that is no longer deployed.
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name.startsWith("portrait-frames-") && name !== CACHE)
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  // Same-origin frames only. Everything else — documents, scripts, fonts — is
  // left to the browser's own cache, which handles it correctly already.
  if (url.origin !== self.location.origin || !url.pathname.startsWith(FRAME_PATH)) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const hit = await cache.match(request);
      if (hit) return hit;
      const response = await fetch(request);
      // Only complete, successful responses are worth keeping; caching an error
      // or a partial range would pin a broken frame for every later visit.
      if (response.ok && response.status === 200) {
        cache.put(request, response.clone());
      }
      return response;
    })(),
  );
});
