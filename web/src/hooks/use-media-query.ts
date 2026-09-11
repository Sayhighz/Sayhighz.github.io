"use client";

import { useSyncExternalStore } from "react";

/**
 * SSR-safe media query subscription. The server snapshot is always `false`, so
 * the first client render matches the server and hydration stays intact; the
 * real value arrives in the render immediately after.
 */
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (notify) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", notify);
      return () => mql.removeEventListener("change", notify);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}
