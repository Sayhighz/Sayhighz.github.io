"use client";

import { useEffect } from "react";

/**
 * Registers the frame cache worker (`public/sw.js`).
 *
 * Deliberately mounted without blocking anything: the hero works exactly as it
 * did if registration fails or the browser has no support, since the worker only
 * ever short-circuits a fetch the page would have made anyway.
 */
export function ServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    // Registration competes with the portrait's own frame fetches for the
    // opening moments of the page, and the worker is of no use until the next
    // navigation anyway — so let the load settle first.
    const onLoad = () => {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.warn("Frame cache unavailable", error);
      });
    };
    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad, { once: true });
    return () => window.removeEventListener("load", onLoad);
  }, []);
  return null;
}
