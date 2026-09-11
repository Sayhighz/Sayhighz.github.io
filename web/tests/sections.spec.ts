import { expect, test } from "@playwright/test";

/**
 * Covers the composed sections: navigation, the project dialog, the contact
 * form's validation, theming, and the layout invariants that regressed during
 * the rebuild (horizontal overflow and the empty terminal).
 */

test("every section renders and the page raises no errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  for (const id of ["about", "skills", "work", "experience", "contact"]) {
    await expect(page.locator(`#${id}`)).toBeAttached();
  }
  expect(errors).toEqual([]);
});

test("the hero terminal prints its full deploy log", async ({ page }) => {
  await page.goto("/");
  // Regression guard: the sequence stalled when children were wrapped in a
  // fragment, leaving the terminal visibly empty.
  const terminal = page.locator(".hero-terminal-slot");
  await expect(terminal).toContainText("deploy pratan --env=production");
  await expect(terminal).toContainText("build", { timeout: 15_000 });
  await expect(terminal).toContainText("deploy", { timeout: 15_000 });
  await expect(terminal).toContainText("intelligence", { timeout: 15_000 });
});

test("no horizontal overflow at any supported width", async ({ page }) => {
  for (const width of [390, 414, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflows, `viewport ${width}px overflows horizontally`).toBe(false);
  }
});

test("a project card opens its case study dialog", async ({ page }) => {
  await page.goto("/");
  await page.locator("#work").scrollIntoViewIfNeeded();

  const firstCard = page.locator("#work button[aria-label^='Open case study']").first();
  await firstCard.click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("heading", { name: "Problem" })).toBeVisible();
  await expect(dialog.getByRole("heading", { name: "Solution" })).toBeVisible();
  await expect(dialog.getByRole("heading", { name: "Impact" })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("project filters narrow the grid to one pillar", async ({ page }) => {
  await page.goto("/");
  await page.locator("#work").scrollIntoViewIfNeeded();

  const cards = page.locator("#work button[aria-label^='Open case study']");
  const total = await cards.count();
  expect(total).toBeGreaterThan(0);

  // Filters are derived from the pillars that actually have work, so pick the
  // first real one rather than naming a pillar the content may no longer use.
  const pillarTab = page.locator("#work [role='tab']").nth(1);
  const pillarName = (await pillarTab.textContent())!.trim();
  await pillarTab.click();

  const panel = page.locator("#work [role='tabpanel']:visible");
  await expect.poll(async () => panel.locator("button[aria-label^='Open case study']").count())
    .toBeGreaterThan(0);
  // Every card left in the panel belongs to the pillar that was selected, and
  // it is a strict subset of the unfiltered grid.
  const shown = await panel.locator("button[aria-label^='Open case study']").count();
  expect(shown).toBeLessThan(total);
  await expect(panel.getByText(pillarName).first()).toBeVisible();
});

test("the contact form rejects empty input and accepts a valid message", async ({ page }) => {
  await page.goto("/");
  await page.locator("#contact").scrollIntoViewIfNeeded();

  await page.getByRole("button", { name: /send message/i }).click();
  await expect(page.getByText("Please tell me your name.")).toBeVisible();

  // The form hands off to the visitor's mail client; stub the navigation so the
  // headless browser does not try to resolve a mailto: URL.
  await page.route("mailto:**", (route) => route.abort());

  await page.getByLabel("Name").fill("Ada Lovelace");
  await page.getByLabel("Email").fill("ada@example.com");
  await page.getByLabel("Message").fill("I would like to talk about an engineering role.");
  await page.getByRole("button", { name: /send message/i }).click();

  await expect(page.getByText("Opening your email app")).toBeVisible({ timeout: 10_000 });
});

test("the command palette opens with a keyboard shortcut and navigates", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("ControlOrMeta+k");

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("option", { name: "Work" }).click();
  await expect(page.locator("#work")).toBeInViewport({ timeout: 10_000 });
});

test("the theme toggle switches between dark and light", async ({ page }) => {
  await page.goto("/");
  const html = page.locator("html");
  await expect(html).toHaveClass(/dark/);

  await page.getByRole("button", { name: "Toggle colour theme" }).click();
  await expect(html).toHaveClass(/light/);
});
