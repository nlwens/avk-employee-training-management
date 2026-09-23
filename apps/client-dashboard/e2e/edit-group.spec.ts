import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "./auth";

test.describe("Edit group", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("updates group name and membership through the edit form", async ({
    page,
  }) => {
    const uniqueName = `Group ${Date.now()}`;
    const updatedName = `${uniqueName} updated`;

    // 1. Create a group to edit
    await page.goto("/employees/groups/create");
    await page.getByLabel("Group name").fill(uniqueName);
    await page.getByRole("button", { name: "Save" }).click();
    await page.waitForURL("/employees");

    // 2. Navigate to the edit group page
    await page
      .getByRole("button", { name: `Open actions for ${uniqueName}` })
      .click();
    await page.getByRole("menuitem", { name: "Edit group" }).click();
    await expect(page).toHaveURL(/\/employees\/groups\/.*\/edit/);
    await expect(
      page.getByRole("heading", { name: "Edit group" }),
    ).toBeVisible();

    // 3. Verify the form is prefilled with the group name
    await expect(page.getByLabel("Group name")).toHaveValue(uniqueName);

    // 4. Attempt to submit an empty group name to check for error handling
    await page.getByLabel("Group name").fill("");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(
      page.getByText("Group name is required", { exact: true }),
    ).toBeVisible();

    // 5. Update the group name and assign an employee
    await page.getByLabel("Group name").fill(updatedName);
    await page.locator("tbody input[type='checkbox']").first().check();

    // 6. Save and verify success toast, redirect, and updated sidebar label
    await page.getByRole("button", { name: "Save" }).click();
    await expect(
      page.getByText("Group was updated successfully!", { exact: true }),
    ).toBeVisible();
    await expect(page).toHaveURL("/employees");
    await expect(
      page.getByRole("button", { name: updatedName, exact: true }),
    ).toBeVisible();
  });
});
