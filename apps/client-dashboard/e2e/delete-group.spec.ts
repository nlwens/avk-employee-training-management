import { expect, test, type Page } from "@playwright/test";
import { loginAsAdmin } from "./auth";

async function confirmGroupDelete(page: Page, groupName: string) {
  const dialog = page.locator(".fixed").last();
  await expect(
    dialog.getByText(`Are you sure you want to delete group "${groupName}"?`),
  ).toBeVisible();

  await dialog.getByRole("button", { name: "Delete group" }).click();
}

test.describe("Delete group", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("deletes an empty group after confirmation and blocks deletion when employees are assigned", async ({
    page,
  }) => {
    const uniqueName = `G${Date.now()}`;

    // 1. Create an empty group to delete
    await page.goto("/employees/groups/create");
    await page.getByLabel("Group name").fill(uniqueName);
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page).toHaveURL("/employees");

    // 2. Open the delete confirmation dialog
    await page
      .getByRole("button", { name: `Open actions for ${uniqueName}` })
      .click();
    await page.getByRole("menuitem", { name: "Delete group" }).click();

    // 3. Confirm deletion in the dialog
    await confirmGroupDelete(page, uniqueName);

    // 4. Verify success toast and group removal from the sidebar
    await expect(
      page.getByText("Group was deleted successfully!", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: uniqueName, exact: true }),
    ).not.toBeVisible();

    // 5. Create a group with an assigned employee
    const groupWithMembers = `${uniqueName}m`;
    await page.getByRole("button", { name: "Add group" }).click();
    await page.getByLabel("Group name").fill(groupWithMembers);
    await page.locator("tbody input[type='checkbox']").first().check();
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page).toHaveURL("/employees");

    // 6. Attempt to delete the group while it still has members
    await page
      .getByRole("button", { name: `Open actions for ${groupWithMembers}` })
      .click();
    await page.getByRole("menuitem", { name: "Delete group" }).click();
    await confirmGroupDelete(page, groupWithMembers);

    // 7. Verify API error is shown and the group remains in the sidebar
    await expect(
      page
        .getByText(
          "The group must have no employees or courses assigned before it can be deleted.",
        )
        .first(),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: groupWithMembers, exact: true }),
    ).toBeVisible();
  });
});
