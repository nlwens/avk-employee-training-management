import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "./auth";

test.describe("Courses", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("displays published courses on the home page", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "All courses" }),
    ).toBeVisible();

    await expect(
      page.getByText(/\d+ \/ \d+ chapters completed/).first(),
    ).toBeVisible();
  });

  test("navigates to a course detail page when clicking a course", async ({
    page,
  }) => {
    await page.goto("/");

    const firstCourse = page.locator("a[href^='/courses/'][href*='-']").first();
    await firstCourse.click();

    await expect(page).toHaveURL(/\/courses\/[a-f0-9-]+/);
    await expect(
      page.getByRole("link", { name: "Start learning" }),
    ).toBeVisible();
  });
});
