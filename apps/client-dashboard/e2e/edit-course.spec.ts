import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "./auth";
import { createCourseThroughUI } from "./courses";

test.describe("Edit course", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("updates course details through the edit form", async ({ page }) => {
    const updatedTitle = `Updated Course ${Date.now()}`;
    const updatedDescription = "Updated description for E2E edit test.";

    // 1. Create a course through the UI (redirects to course overview)
    const { courseTitle } = await createCourseThroughUI(page);

    // 2. Open the edit page
    await page.getByRole("button", { name: "Edit" }).click();
    await expect(page).toHaveURL(/\/edit$/);
    await expect(
      page.getByRole("heading", { name: "Edit course" }),
    ).toBeVisible();
    await expect(page.getByLabel("Course title*")).toBeVisible();

    // 3. Verify the form is prefilled with the original course title
    await expect(page.getByLabel("Course title*")).toHaveValue(courseTitle);

    // 4. Attempt to submit with empty titles in both languages
    await page.getByLabel("Course title*").fill("");
    await page.getByLabel("Switch course content language").click();
    await page.getByLabel("Course title*").fill("");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByLabel("Course title*")).toHaveAttribute(
      "aria-invalid",
      "true",
    );

    // 5. Fill in the updated course details
    await page.getByLabel("Course title*").fill(updatedTitle);
    await page.getByLabel("Description").fill(updatedDescription);

    // 6. Save and verify success toast, redirect to overview, and updated content
    await page.getByRole("button", { name: "Save" }).click();
    await expect(
      page.getByText("Course was updated successfully!", { exact: true }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/overview$/);
    await expect(page.getByLabel("Course title*")).not.toBeVisible();
    await expect(page.getByText(updatedDescription)).toBeVisible();
  });
});
