import { test, expect } from "@playwright/test";

/**
 * Shell behaviour across breakpoints. The signed-in session comes from
 * auth.setup.ts via storageState, so no test here registers an account.
 *
 * Viewport is set per-test rather than per-project so desktop and mobile
 * expectations live side by side and run under one project.
 */

test.describe("desktop shell", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test("persistent sidebar, collapse survives a reload", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page.getByRole("navigation", { name: "Section" })).toBeVisible();

    // Mobile affordances must not be present at this width.
    await expect(
      page.getByRole("button", { name: /open navigation menu/i }),
    ).toBeHidden();
    await expect(page.getByRole("navigation", { name: "Primary" })).toBeHidden();

    const collapse = page.getByRole("button", { name: /collapse/i });
    await expect(collapse).toHaveAttribute("aria-expanded", "true");
    await collapse.click();
    await expect(collapse).toHaveAttribute("aria-expanded", "false");

    // The state lives in a cookie, so the server renders it collapsed on the
    // next request instead of flashing expanded then snapping shut.
    await page.reload();
    await expect(page.getByRole("button", { name: /collapse/i })).toHaveAttribute(
      "aria-expanded",
      "false",
    );

    // Reset via the cookie rather than a second click: Next's dev overlay
    // (<nextjs-portal>) intercepts pointer events over the sidebar footer, so a
    // cleanup click is flaky for reasons that have nothing to do with the shell.
    await page.context().clearCookies({ name: "zj_sidebar" });
  });

  test("marks the current route with aria-current", async ({ page }) => {
    await page.goto("/dashboard");

    // The old shell used NavLink without ever reading isActive, so no page in
    // the app had an active indicator at all.
    const nav = page.getByRole("navigation", { name: "Section" });
    await expect(nav.getByRole("link", { name: "Overview" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    await nav.getByRole("link", { name: "Applications" }).click();
    await expect(page).toHaveURL(/\/dashboard\/applications/);

    await expect(nav.getByRole("link", { name: "Applications" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(nav.getByRole("link", { name: "Overview" })).not.toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});

test.describe("mobile shell", () => {
  // 360px is the low end of Android devices in common use.
  test.use({ viewport: { width: 360, height: 740 } });

  test("drawer nav and bottom tabs replace the sidebar", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();

    const hamburger = page.getByRole("button", { name: /open navigation menu/i });
    await expect(hamburger).toBeVisible();
    await hamburger.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // Radix supplies the focus trap and Escape handling the old hand-rolled
    // overlay never had.
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("closes the drawer after navigating", async ({ page }) => {
    await page.goto("/dashboard");

    await page.getByRole("button", { name: /open navigation menu/i }).click();
    await page.getByRole("dialog").getByRole("link", { name: "Saved jobs" }).click();

    await expect(page).toHaveURL(/\/dashboard\/saved/);
    await expect(page.getByRole("dialog")).toBeHidden();
  });

  test("no horizontal overflow at 360px", async ({ page }) => {
    // The whole point of `min-w-0` on the flex column. Without it a wide
    // descendant pushes the layout past the viewport and the page scrolls
    // sideways — which is how the old app behaved at every mobile width.
    for (const path of [
      "/dashboard",
      "/dashboard/applications",
      "/dashboard/profile",
      "/dashboard/settings",
    ]) {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(
        overflow,
        `${path} overflows horizontally by ${overflow}px`,
      ).toBeLessThanOrEqual(1);
    }
  });

  test("bottom tab targets meet the 44px touch minimum", async ({ page }) => {
    await page.goto("/dashboard");

    const tabs = page.getByRole("navigation", { name: "Primary" }).getByRole("link");
    const count = await tabs.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const box = await tabs.nth(i).boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    }
  });
});

test("theme toggle switches the document theme", async ({ page }) => {
  await page.goto("/dashboard/settings");

  // Two toggles render on this page — one in the topbar, one in the Appearance
  // section — so the locator must be scoped to avoid a strict-mode violation.
  const group = page.locator("#main").getByRole("radiogroup", { name: /colour theme/i });
  await group.getByRole("radio", { name: "Dark" }).click();

  // globals.css keys the dark palette off data-theme, so next-themes must be
  // configured with attribute="data-theme" — a class would do nothing.
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  await group.getByRole("radio", { name: "Light" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});
