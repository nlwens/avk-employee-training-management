import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "./auth";

test.describe("Segments", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("chapter displays text segment content", async ({ page }) => {
    await page.goto("/");

    const firstCourse = page.locator("a[href^='/courses/'][href*='-']").first();
    await firstCourse.click();

    const startLearning = page.getByRole("link", { name: "Start learning" });
    await expect(startLearning).toBeVisible({ timeout: 15_000 });
    await startLearning.click();
    await expect(page).toHaveURL(/\/courses\/[a-f0-9-]+\/chapters\/[a-f0-9-]+/);

    await page.waitForLoadState("networkidle");

    const chapterTitle = page.locator("h2");
    await expect(chapterTitle).toBeVisible({ timeout: 10_000 });

    const textSegment = page.locator("div.reading-text p");
    await expect(textSegment.first()).toBeVisible({ timeout: 10_000 });
    const text = await textSegment.first().textContent();
    expect(text!.trim().length).toBeGreaterThan(0);
  });

  test("segments change when navigating to a different chapter", async ({
    page,
  }) => {
    await page.goto("/");

    const firstCourse = page.locator("a[href^='/courses/'][href*='-']").first();
    await firstCourse.click();

    const startLearning = page.getByRole("link", { name: "Start learning" });
    await expect(startLearning).toBeVisible({ timeout: 15_000 });
    await startLearning.click();
    await expect(page).toHaveURL(/\/courses\/[a-f0-9-]+\/chapters\/[a-f0-9-]+/);

    await page.waitForLoadState("networkidle");

    const chapterTitle = page.locator("h2");
    await expect(chapterTitle).toBeVisible({ timeout: 10_000 });
    const titleBefore = (await chapterTitle.textContent())!.trim();

    // Navigate to chapter 2 via the stepper.
    const chapterSteps = page.locator('[role="list"] [role="listitem"]');
    await expect(chapterSteps.first()).toBeVisible({ timeout: 10_000 });
    expect(await chapterSteps.count()).toBeGreaterThan(1);
    await chapterSteps.nth(1).click();

    await expect(page).toHaveURL(/\/courses\/[a-f0-9-]+\/chapters\/[a-f0-9-]+/);
    await page.waitForLoadState("networkidle");

    await expect(chapterTitle).not.toHaveText(titleBefore, { timeout: 10_000 });
  });
});
