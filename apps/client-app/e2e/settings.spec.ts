import { expect, test } from "@playwright/test";
import {
  acquireAdminPasswordLock,
  E2E_CHANGED_PASSWORD,
  loginAsAdmin,
  releaseAdminPasswordLock,
  resetAdminPassword,
} from "./auth";

test.describe("Change password page", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page, request }) => {
    await acquireAdminPasswordLock();
    await resetAdminPassword(request);
    await loginAsAdmin(page, undefined, { skipLock: true });
  });

  test.afterEach(async ({ request }) => {
    try {
      await resetAdminPassword(request);
    } finally {
      await releaseAdminPasswordLock();
    }
  });

  test("user changes their own password successfully", async ({ page }) => {
    await page
      .getByRole("button", { name: "Open navigation menu" })
      .first()
      .click();

    await page.getByRole("link", { name: "Settings" }).click();

    await expect(page).toHaveURL("/settings");

    await page
      .getByPlaceholder("Enter your current password...", { exact: true })
      .fill(process.env.ADMIN_PASSWORD!);

    await page
      .getByPlaceholder("Enter your password...", { exact: true })
      .fill(E2E_CHANGED_PASSWORD);
    await page
      .getByPlaceholder("Re-enter your password...", { exact: true })
      .fill(E2E_CHANGED_PASSWORD);

    await page.getByRole("button", { name: "Save" }).click();

    await expect(
      page.getByText("Your password has been changed successfully.", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(page).toHaveURL("/login");

    await loginAsAdmin(page, E2E_CHANGED_PASSWORD);
  });

  test("user fills in incorrect current password", async ({ page }) => {
    await page
      .getByRole("button", { name: "Open navigation menu" })
      .first()
      .click();

    await page.getByRole("link", { name: "Settings" }).click();

    await expect(page).toHaveURL("/settings");

    await page
      .getByPlaceholder("Enter your current password...", { exact: true })
      .fill("incorrectpassword");

    await page
      .getByPlaceholder("Enter your password...", { exact: true })
      .fill(E2E_CHANGED_PASSWORD);
    await page
      .getByPlaceholder("Re-enter your password...", { exact: true })
      .fill(E2E_CHANGED_PASSWORD);

    await page.getByRole("button", { name: "Save" }).click();

    await expect(
      page.getByText("The current password is incorrect.", { exact: true }),
    ).toBeVisible();
  });

  test("user's filled in new passwords do not match", async ({ page }) => {
    await page
      .getByRole("button", { name: "Open navigation menu" })
      .first()
      .click();

    await page.getByRole("link", { name: "Settings" }).click();

    await expect(page).toHaveURL("/settings");

    await page
      .getByPlaceholder("Enter your current password...", { exact: true })
      .fill(process.env.ADMIN_PASSWORD!);

    await page
      .getByPlaceholder("Enter your password...", { exact: true })
      .fill(E2E_CHANGED_PASSWORD);
    await page
      .getByPlaceholder("Re-enter your password...", { exact: true })
      .fill("differentpassword");

    await page.getByRole("button", { name: "Save" }).click();

    await expect(
      page.getByText("Passwords do not match", { exact: true }),
    ).toBeVisible();
  });
});
