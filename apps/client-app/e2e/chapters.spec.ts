import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "./auth";

test.describe("Course learning flow", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("user starts a course, progresses through chapters, and reaches the quiz", async ({
    page,
  }) => {
    await page.goto("/");

    const firstCourse = page.locator("a[href^='/courses/'][href*='-']").first();
    await firstCourse.click();
    await expect(page).toHaveURL(/\/courses\/[a-f0-9-]+/);

    const startLearning = page.getByRole("link", { name: "Start learning" });
    await expect(startLearning).toBeVisible({ timeout: 15_000 });
    await startLearning.click();
    await expect(page).toHaveURL(/\/courses\/[a-f0-9-]+\/chapters\/[a-f0-9-]+/);

    const steps = page.locator('[role="list"] [role="listitem"]');
    await expect(steps.first()).toBeVisible({ timeout: 10_000 });
    expect(await steps.count()).toBeGreaterThanOrEqual(3);

    const totalSteps = await steps.count();
    await steps.nth(totalSteps - 1).click();
    await page.waitForLoadState("networkidle");

    const quizLink = page.locator("a[href$='/quiz']");
    await expect(quizLink).toBeVisible({ timeout: 10_000 });
    await quizLink.click();
  });
});
