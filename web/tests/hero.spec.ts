import { expect, test } from "@playwright/test";

/**
 * Scroll position at which the hero's pin releases — the moment the transform
 * finishes and the flight into the About card is about to begin. The pin-spacer
 * stands in for the pinned hero *plus* its scroll travel, so the travel alone
 * is its height less one viewport.
 */
const pinEnd = (page: import("@playwright/test").Page) =>
  page.evaluate(
    () => document.querySelector(".pin-spacer")!.getBoundingClientRect().height - window.innerHeight,
  );

/**
 * The portrait engine is the one piece of bespoke machinery on the site, so it
 * carries the heaviest coverage: idle playback, scrub direction, breakpoint
 * frame sizes, reduced-motion fallback, and failure recovery.
 *
 * ScrollTrigger arms itself once the page settles at the top, so the tests wait
 * for the pin rather than provoking it. The wheel event is kept as a nudge for
 * the case where the trigger has not come up yet.
 */

/** Waits for the hero's pin to engage, nudging it if it has not armed yet. */
async function armScrollTrigger(page: import("@playwright/test").Page) {
  await page.evaluate(() => window.dispatchEvent(new WheelEvent("wheel", { deltaY: 1 })));
  await expect(page.locator(".pin-spacer")).toHaveCount(1);
}

test("portrait scrubs forward and back, then releases the pin", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");

  const canvas = page.locator("canvas").first();
  await expect(canvas).toHaveAttribute("data-ready", "true");
  await expect(canvas).toHaveAttribute("data-sequence", "idle");
  await armScrollTrigger(page);

  await page.evaluate(() => window.scrollTo(0, 900));
  await expect
    .poll(async () => Number(await canvas.getAttribute("data-frame")))
    .toBeGreaterThan(40);
  await expect(canvas).toHaveAttribute("data-sequence", "transform");
  // While pinned the hero stays glued to the top of the viewport.
  await expect
    .poll(async () => Math.abs((await page.locator(".hero").boundingBox())!.y))
    .toBeLessThan(2);

  await page.evaluate(() => window.scrollTo(0, 1800));
  await expect
    .poll(async () => Number(await canvas.getAttribute("data-frame")), { timeout: 10_000 })
    .toBe(239);

  // Reverse scrubbing must work too — this is what the bitmap cache exists for.
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect
    .poll(async () => Number(await canvas.getAttribute("data-frame")))
    .toBeLessThan(20);

  expect(errors).toEqual([]);
});

test("the left column cross-fades in step with the portrait scrub", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("canvas").first()).toHaveAttribute("data-ready", "true");
  await armScrollTrigger(page);

  const phases = () =>
    page.evaluate(() => ({
      a: Number(getComputedStyle(document.querySelector(".hero-phase-a")!).opacity),
      b: Number(getComputedStyle(document.querySelector(".hero-phase-b")!).opacity),
      // Measured against the hero itself: the pin releases over the last stretch
      // of travel, so viewport coordinates would drift for reasons unrelated to
      // the phase swap.
      actions:
        document.querySelector(".hero-actions")!.getBoundingClientRect().y -
        document.querySelector(".hero")!.getBoundingClientRect().y,
    }));

  const atTop = await phases();
  expect(atTop.a).toBeGreaterThan(0.9);
  expect(atTop.b).toBe(0);

  await page.evaluate(() => window.scrollTo(0, 1790));
  await expect.poll(async () => (await phases()).b).toBeGreaterThan(0.9);
  const atEnd = await phases();
  expect(atEnd.a).toBe(0);
  // The calls to action belong to both phases, so they must not shift as the
  // copy above them swaps.
  expect(atEnd.actions).toBeCloseTo(atTop.actions, 1);

  // Scrubbing back restores the intro copy: both phases stay mounted precisely
  // so this is reversible.
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect.poll(async () => (await phases()).a).toBeGreaterThan(0.9);
});

test("mobile loads the smaller frame set with no horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const canvas = page.locator("canvas").first();
  await expect(canvas).toHaveAttribute("width", "640");
  await expect(canvas).toHaveAttribute("height", "360");
  // Wait for the engine before arming: until it is ready the idle preview tween
  // still owns the playhead, and its frames would be mistaken for scrub output.
  await expect(canvas).toHaveAttribute("data-ready", "true");
  await armScrollTrigger(page);

  // Re-issue the scroll on every attempt. Arming the trigger inserts the
  // pin-spacer and refreshes it, which can reset an in-flight scroll back to 0,
  // so a single scrollTo before the refresh settles is not reliable.
  //
  // The target is the end of the pin, not the end of the document: past the pin
  // the portrait flies into the About card and runs the same frames *backwards*,
  // so the bottom of the page shows frame 0 again, not the transform's last frame.
  await expect
    .poll(
      async () => {
        await page.evaluate((y) => window.scrollTo(0, y), await pinEnd(page));
        return Number(await canvas.getAttribute("data-frame"));
      },
      { timeout: 15_000 },
    )
    .toBe(239);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBe(true);
});

test("the portrait flies into the About card and hands off to it", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");

  const canvas = page.locator("canvas").first();
  await expect(canvas).toHaveAttribute("data-ready", "true");
  await armScrollTrigger(page);

  const state = () =>
    page.evaluate(() => {
      const stage = document.querySelector(".portrait-stage") as HTMLElement;
      const card = document.querySelector("[data-portrait-landing]") as HTMLElement;
      const a = stage.getBoundingClientRect();
      const b = card.getBoundingClientRect();
      return {
        flight: Number(
          getComputedStyle(document.querySelector(".hero") as HTMLElement)
            .getPropertyValue("--hero-flight") || 0,
        ),
        handoff: card.dataset.handoff,
        frame: Number(document.querySelector("canvas")!.getAttribute("data-frame")),
        // All four edges, not just origin and width: the stage and the card
        // have different aspect ratios, so matching one axis proves nothing
        // about the other.
        gap: Math.max(
          Math.abs(a.left - b.left),
          Math.abs(a.top - b.top),
          Math.abs(a.right - b.right),
          Math.abs(a.bottom - b.bottom),
        ),
      };
    });

  // At the end of the pin the transform is complete and nothing is flying yet.
  const pin = await pinEnd(page);
  await page.evaluate((y) => window.scrollTo(0, y), pin);
  await expect.poll(async () => (await state()).frame).toBe(239);
  expect((await state()).flight).toBe(0);
  expect((await state()).handoff).toBe("pending");

  // Scrolling on brings the About card up and the portrait down onto it, with
  // the frames unwinding back to the still the card itself shows.
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect.poll(async () => (await state()).handoff).toBe("done");
  const landed = await state();
  expect(landed.frame).toBe(0);
  // The flying stage must come to rest exactly on the card, or the swap to the
  // card's own image would read as a jump.
  expect(landed.gap).toBeLessThan(2);

  // Reversible: scrubbing back re-opens the flight and hides the card again.
  await page.evaluate((y) => window.scrollTo(0, y), pin);
  await expect.poll(async () => (await state()).handoff).toBe("pending");
  await expect.poll(async () => (await state()).frame).toBe(239);

  expect(errors).toEqual([]);
});

test("reduced motion keeps the poster and never fetches frames", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const frameRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/portrait/")) frameRequests.push(request.url());
  });

  await page.goto("/");
  await expect(page.locator(".hero")).toHaveAttribute("data-motion", "off");
  await expect(page.locator(".portrait-poster")).toBeVisible();
  // Nothing is pinned, so the page scrolls normally.
  await expect(page.locator(".pin-spacer")).toHaveCount(0);
  // There is no flight to wait for, so the About card must never be left
  // hidden behind one.
  await expect(page.locator("[data-portrait-landing]")).toHaveAttribute("data-handoff", "done");

  // idle/desktop/000.webp is the poster itself; no sequence work may run.
  const sequenceFrames = frameRequests.filter(
    (url) => /\/\d{3}\.webp$/.test(url) && !url.endsWith("/idle/desktop/000.webp"),
  );
  expect(sequenceFrames).toEqual([]);
});

test("a failed frame keeps the poster up and retry recovers", async ({ page }) => {
  await page.route("**/portrait/idle/desktop/000.webp", (route) => route.fulfill({ status: 503 }));
  await page.goto("/");

  const status = page.getByRole("status");
  await expect(status).toBeVisible();
  await expect(page.locator("canvas").first()).toHaveAttribute("data-ready", "false");
  await expect(page.locator(".portrait-poster")).toBeVisible();

  await page.unroute("**/portrait/idle/desktop/000.webp");
  await status.getByRole("button", { name: "Retry" }).click();
  await expect(page.locator("canvas").first()).toHaveAttribute("data-ready", "true");
  await expect(status).toHaveCount(0);
});

test("resizing rebuilds exactly one scroll trigger", async ({ page }) => {
  await page.goto("/");
  // The trigger is only built once the engine reports ready, so wait for the
  // canvas before arming it — otherwise the wheel event fires into nothing.
  await expect(page.locator("canvas").first()).toHaveAttribute("data-ready", "true");
  await armScrollTrigger(page);
  await expect(page.locator("canvas").first()).toHaveAttribute("width", "960");
  await expect(page.locator("canvas").first()).toHaveAttribute("height", "540");

  // Each matchMedia context registers its own one-shot scroll listeners, so a
  // rebuilt context has no pin until fresh scroll intent arrives. Re-arming
  // after every resize is what proves exactly one trigger is rebuilt.
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator("canvas").first()).toHaveAttribute("width", "640");
  await expect(page.locator("canvas").first()).toHaveAttribute("height", "360");
  await armScrollTrigger(page);

  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.locator("canvas").first()).toHaveAttribute("width", "960");
  await expect(page.locator("canvas").first()).toHaveAttribute("height", "540");
  await armScrollTrigger(page);
});

test("the skip link is the first tab stop and jumps past the hero", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip introduction" });
  await expect(skip).toBeFocused();
  await skip.press("Enter");
  await expect(page.locator("#about")).toBeInViewport();
});
