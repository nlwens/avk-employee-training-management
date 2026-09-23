import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "./auth";

test.describe("Create group", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("creates a group through validation, success, listing, and duplicate name handling", async ({
    page,
  }) => {
    const uniqueName = `Group ${Date.now()}`;

    // 1. Navigate to the create group page
    await page.goto("/employees");
    await page.getByRole("button", { name: "Add group" }).click();
    await expect(page).toHaveURL("/employees/groups/create");
    await expect(
      page.getByRole("heading", { name: "Create new group" }),
    ).toBeVisible();

    // 2. Attempt to submit an empty form to check for error handling
    await page.getByRole("button", { name: "Save" }).click();
    await expect(
      page.getByText("Group name is required", { exact: true }),
    ).toBeVisible();

    // 3. Create a group with a unique name
    await page.getByLabel("Group name").fill(uniqueName);
    await page.getByRole("button", { name: "Save" }).click();

    // 4. Verify success toast, redirect, and group appears in the sidebar
    await expect(
      page.getByText("Group was created successfully!", { exact: true }),
    ).toBeVisible();
    await expect(page).toHaveURL("/employees");
    await expect(
      page.getByRole("button", { name: uniqueName, exact: true }),
    ).toBeVisible();

    // 5. Attempt to create a group with the same name again
    await page.getByRole("button", { name: "Add group" }).click();
    await expect(page).toHaveURL("/employees/groups/create");

    await page.getByLabel("Group name").fill(uniqueName);
    await page.getByRole("button", { name: "Save" }).click();

    // 6. Verify duplicate name error is shown and user stays on the create page
    await expect(
      page.getByText("A group with this name already exists.").first(),
    ).toBeVisible();
    await expect(page).toHaveURL("/employees/groups/create");
  });
});
