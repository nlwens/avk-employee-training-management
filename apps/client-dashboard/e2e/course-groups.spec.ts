import { expect, test, type Page } from "@playwright/test";
import { loginAsAdmin } from "./auth";
import { createCourseThroughUI } from "./courses";

const uuidPattern =
  "[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";

async function waitForGroupsAssignmentPage(page: Page) {
  await expect(
    page.getByText("This course is assigned to:", { exact: true }),
  ).toBeVisible();
}

async function expectGroupCheckboxState(
  page: Page,
  groupName: string,
  checked: boolean,
) {
  const checkbox = page.getByRole("checkbox", { name: groupName });
  await expect(checkbox).toBeVisible();
  if (checked) {
    await expect(checkbox).toBeChecked();
  } else {
    await expect(checkbox).not.toBeChecked();
  }
}

async function saveGroupAssignments(page: Page) {
  const saveResponse = page.waitForResponse(
    (response) =>
      response.request().method() === "PATCH" &&
      response.url().includes("/courses/") &&
      response.ok(),
  );

  await page.getByRole("button", { name: "Save" }).click();
  await expect(
    page.getByText("Group assignments were saved successfully.", {
      exact: true,
    }),
  ).toBeVisible();
  await saveResponse;
}

test.describe("Course groups", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("assigns groups to a course and persists the selection", async ({
    page,
  }) => {
    const timestamp = Date.now();
    const groupA = `E2E Group A ${timestamp}`;
    const groupB = `E2E Group B ${timestamp}`;

    // 1. Create the first group to assign
    await page.goto("/employees/groups/create");
    await page.getByLabel("Group name").fill(groupA);
    await page.getByRole("button", { name: "Save" }).click();
    await page.waitForURL("/employees");

    // 2. Create the second group to assign
    await page.goto("/employees/groups/create");
    await page.getByLabel("Group name").fill(groupB);
    await page.getByRole("button", { name: "Save" }).click();
    await page.waitForURL("/employees");

    // 3. Create a course through the UI (redirects to course detail)
    await createCourseThroughUI(page);

    // 4. Navigate to the course groups tab
    await expect(page).toHaveURL(new RegExp(`/courses/${uuidPattern}`));
    await page.getByRole("link", { name: "Groups" }).click();
    await expect(page).toHaveURL(/\/groups$/);

    // 5. Verify the groups assignment UI is visible
    await expect(
      page.locator("section").getByText("Groups", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("This course is assigned to:", { exact: true }),
    ).toBeVisible();

    // 6. Select both groups and save
    const groupACheckbox = page.getByRole("checkbox", { name: groupA });
    const groupBCheckbox = page.getByRole("checkbox", { name: groupB });

    await groupACheckbox.check();
    await expect(groupACheckbox).toBeChecked();
    await groupBCheckbox.check();
    await expect(groupBCheckbox).toBeChecked();
    await saveGroupAssignments(page);

    // 7. Verify persisted selection after reload
    await page.reload();
    await waitForGroupsAssignmentPage(page);
    await expectGroupCheckboxState(page, groupA, true);
    await expectGroupCheckboxState(page, groupB, true);

    // 8. Deselect one group, save again, and verify updated selection after reload
    await page.getByRole("checkbox", { name: groupA }).uncheck();
    await saveGroupAssignments(page);

    await page.reload();
    await waitForGroupsAssignmentPage(page);
    await expectGroupCheckboxState(page, groupA, false);
    await expectGroupCheckboxState(page, groupB, true);
  });

  test("navigates to course overview when cancel is clicked", async ({
    page,
  }) => {
    const groupName = `E2E Group Cancel ${Date.now()}`;

    // 1. Create a group to assign
    await page.goto("/employees/groups/create");
    await page.getByLabel("Group name").fill(groupName);
    await page.getByRole("button", { name: "Save" }).click();
    await page.waitForURL("/employees");

    // 2. Create a course through the UI (redirects to course detail)
    await createCourseThroughUI(page);

    // 3. Navigate to the course groups tab
    await expect(page).toHaveURL(new RegExp(`/courses/${uuidPattern}`));
    await page.getByRole("link", { name: "Groups" }).click();
    await expect(page).toHaveURL(/\/groups$/);

    // 4. Cancel and verify navigation to course overview
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page).toHaveURL(
      new RegExp(`/courses/${uuidPattern}/overview$`),
    );
  });
});
