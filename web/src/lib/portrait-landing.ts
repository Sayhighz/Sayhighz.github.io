/**
 * The handoff contract between the hero's flying canvas and the About card.
 *
 * The hero owns a single canvas for the whole flight; the About card is its
 * landing pad. Rather than couple the two components directly, the card marks
 * its frame with this attribute and the hero measures it. That keeps the card
 * free to move in the layout — the hero re-measures on every refresh.
 */
export const LANDING_ATTR = "data-portrait-landing";

/** Marks the element the hero portrait flies into. Spread onto the frame. */
export const landingTarget = { [LANDING_ATTR]: "" } as const;

/**
 * Reads the landing rect in viewport coordinates, or null when the target is
 * absent (the About section may not be mounted in every context).
 *
 * The card is wrapped in an entry animation that translates it into place as it
 * scrolls into view, and the portrait is flying at exactly that moment. A raw
 * `getBoundingClientRect` would therefore report a resting place the card has
 * not reached yet, and the flight would land a few pixels off and stay there.
 * Discounting the ancestors' transforms yields the settled box instead of the
 * in-flight one, so the two animations stop fighting over the same coordinates.
 */
export function readLandingRect(): DOMRect | null {
  const el = document.querySelector(`[${LANDING_ATTR}]`);
  if (!el) return null;
  const rect = el.getBoundingClientRect();

  let dx = 0;
  let dy = 0;
  for (let node = el.parentElement; node; node = node.parentElement) {
    const transform = getComputedStyle(node).transform;
    if (transform === "none") continue;
    // The pinned hero's own transform is not an entry animation — it is part of
    // the coordinate space both ends of the flight already share.
    if (node.classList.contains("hero")) break;
    const m = new DOMMatrix(transform);
    dx += m.e;
    dy += m.f;
  }
  if (!dx && !dy) return rect;

  return new DOMRect(rect.left - dx, rect.top - dy, rect.width, rect.height);
}
