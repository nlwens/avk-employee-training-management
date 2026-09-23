import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "./auth";

test.beforeEach(async ({ page }) => {
  await loginAsAdmin(page);
});

test("employee app loads and shows courses", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "All courses" }),
  ).toBeVisible();

  await expect(
    page.getByText(/\d+ \/ \d+ chapters completed/).first(),
  ).toBeVisible();
});
