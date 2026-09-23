import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "./auth";

// Offline tests use page.context().setOffline(true), Playwright's built-in
// network emulation backed by Chrome DevTools Protocol. Firefox and WebKit do
// not fully support it, so these tests are restricted to Chromium only.
test.describe("Offline experience", () => {
  test.skip(
    ({ browserName }) => browserName !== "chromium",
    "Offline simulation requires Chromium",
  );

  test("shows offline banner when network is lost", async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto("/");
    await expect(
      page.getByText(/\d+ \/ \d+ chapters completed/).first(),
    ).toBeVisible();

    await page.context().setOffline(true);

    await expect(page.getByRole("status")).toBeVisible();
    await expect(page.getByRole("status")).toContainText("offline");
  });

  // This test can be executed only in a PWA (with service workers).
  test.skip("serves cached course data when offline after reload", async ({
    page,
  }) => {
    await loginAsAdmin(page);

    await page.goto("/");
    const courseLink = page.locator("a[href^='/courses/'][href*='-']").first();
    await expect(courseLink).toBeVisible();

    await page.context().setOffline(true);
    await page.reload();

    await expect(courseLink).toBeVisible({ timeout: 15_000 });
  });

  test("shows no-internet message on login page when offline and unauthenticated", async ({
    page,
  }) => {
    await page.goto("/login");
    await expect(page.getByRole("button", { name: "Log in" })).toBeVisible();

    await page.context().setOffline(true);
    await page.waitForTimeout(1000);

    await expect(page.getByText("No internet connection")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Log in" }),
    ).not.toBeVisible();
  });
});
