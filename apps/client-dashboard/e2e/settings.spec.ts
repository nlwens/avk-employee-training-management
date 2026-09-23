import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "./auth";

test.describe("Change password page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("user changes is own password successfully", async ({ page }) => {
    await page.getByText("Administrator User").click();

    expect(page.getByRole("menu")).toBeVisible();
    await page.getByRole("menuitem", { name: "Settings" }).click();

    await expect(page).toHaveURL("/settings");

    const newPassword = "newpassword";

    await page
      .getByPlaceholder("Enter your current password...", { exact: true })
      .fill(process.env.ADMIN_PASSWORD!);

    await page
      .getByPlaceholder("Enter your password...", { exact: true })
      .fill(newPassword);
    await page
      .getByPlaceholder("Re-enter your password...", { exact: true })
      .fill(newPassword);

    await page.getByRole("button", { name: "Save" }).click();

    await expect(
      page.getByText("Your password has been changed successfully.", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(page).toHaveURL("/login");

    // test if a new password works for login
    await loginAsAdmin(page, newPassword);

    // then immediately change the password back to the original one so it won't block other tests
    await page.getByText("Administrator User").click();
    await page.getByRole("menuitem", { name: "Settings" }).click();
    await page
      .getByPlaceholder("Enter your current password...", { exact: true })
      .fill(newPassword);
    await page
      .getByPlaceholder("Enter your password...", { exact: true })
      .fill(process.env.ADMIN_PASSWORD!);
    await page
      .getByPlaceholder("Re-enter your password...", { exact: true })
      .fill(process.env.ADMIN_PASSWORD!);
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page).toHaveURL("/login");
  });

  test("user fills in incorrect current password", async ({ page }) => {
    await page.getByText("Administrator User").click();

    expect(page.getByRole("menu")).toBeVisible();
    await page.getByRole("menuitem", { name: "Settings" }).click();

    await expect(page).toHaveURL("/settings");

    const newPassword = "newpassword";

    await page
      .getByPlaceholder("Enter your current password...", { exact: true })
      .fill("incorrectpassword");

    await page
      .getByPlaceholder("Enter your password...", { exact: true })
      .fill(newPassword);
    await page
      .getByPlaceholder("Re-enter your password...", { exact: true })
      .fill(newPassword);

    await page.getByRole("button", { name: "Save" }).click();

    await expect(
      page.getByText("The current password is incorrect.", { exact: true }),
    ).toBeVisible();
  });

  test("user's filled in new passwords do not match", async ({ page }) => {
    await page.getByText("Administrator User").click();

    expect(page.getByRole("menu")).toBeVisible();
    await page.getByRole("menuitem", { name: "Settings" }).click();

    await expect(page).toHaveURL("/settings");

    const newPassword = "newpassword";

    await page
      .getByPlaceholder("Enter your current password...", { exact: true })
      .fill(process.env.ADMIN_PASSWORD!);

    await page
      .getByPlaceholder("Enter your password...", { exact: true })
      .fill(newPassword);
    await page
      .getByPlaceholder("Re-enter your password...", { exact: true })
      .fill("differentpassword");

    await page.getByRole("button", { name: "Save" }).click();

    await expect(
      page.getByText("Passwords do not match", { exact: true }),
    ).toBeVisible();
  });
});
