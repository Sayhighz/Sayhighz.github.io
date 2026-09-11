"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Reads the user's motion preference without breaking hydration.
 *
 * Motion's own `useReducedMotion` evaluates the media query during the first
 * client render, so a user with the preference set hydrates a different tree
 * than the server sent and React discards the whole subtree. Going through an
 * external store keeps the server snapshot and the first client render in
 * agreement (`false`), then re-renders once with the real value.
 */
export function usePrefersReducedMotion() {
  return useSyncExternalStore(
    (notify) => {
      const mql = window.matchMedia(QUERY);
      mql.addEventListener("change", notify);
      return () => mql.removeEventListener("change", notify);
    },
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
