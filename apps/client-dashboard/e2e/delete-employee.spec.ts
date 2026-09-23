import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "./auth";
import { confirmEmployeeDelete, createEmployeeThroughUI } from "./employees";

test.describe("Edit employee page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("deletes the employee and navigates to the employees list", async ({
    page,
  }) => {
    const { editButtonName } = await createEmployeeThroughUI(page);

    await page.getByRole("button", { name: editButtonName }).click();
    await expect(page).toHaveURL(/\/employees\/.*\/edit/);

    await confirmEmployeeDelete(page);

    await expect(page).toHaveURL("/employees");

    await expect(
      page.getByText("Employee account has been deleted successfully.", {
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      page.getByRole("button", { name: editButtonName }),
    ).not.toBeVisible();
  });
});
