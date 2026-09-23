import { expect, test } from "@playwright/test";

import { loginAsAdmin } from "./auth";
import {
  createEmployeeThroughUI,
  employeeIdFromUrl,
  openEmployeeDetailsFromList,
} from "./employees";

test.describe("Employee detail page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("renders employee details", async ({ page }) => {
    const { fullName, uniqueEmail, viewDetailsButtonName } =
      await createEmployeeThroughUI(page);

    await expect(page.getByRole("cell", { name: uniqueEmail })).toBeVisible();

    await openEmployeeDetailsFromList(page, viewDetailsButtonName);

    const employeeId = employeeIdFromUrl(page.url());
    expect(employeeId).toBeTruthy();

    await expect(page.getByRole("status", { name: "Loading" })).toBeHidden();

    await expect(page.getByText(fullName, { exact: true })).toBeVisible();
    await expect(page.getByText(uniqueEmail, { exact: true })).toBeVisible();

    await expect(page.getByText("Course name", { exact: true })).toBeVisible();
    await expect(page.getByText("Status", { exact: true })).toBeVisible();
    await expect(page.getByText("Score", { exact: true })).toBeVisible();

    await expect(
      page.getByText(
        /^(The employee hasn't completed any courses\.|Select a course to view submission details\.)$/,
      ),
    ).toBeVisible();
  });
});
