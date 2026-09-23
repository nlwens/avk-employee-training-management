import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "./auth";

test.describe("Create course page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("navigates from courses page to create course page", async ({
    page,
  }) => {
    await page.goto("/courses");

    await expect(page.getByText("NEDERLAND BV")).toBeVisible();

    await expect(
      page.getByRole("heading", { name: "Published courses" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Add" }).click();

    await expect(page).toHaveURL("/courses/create");

    await expect(
      page.getByRole("heading", { name: "Create new course" }),
    ).toBeVisible();
  });

  test("shows validation error when creating without a title", async ({
    page,
  }) => {
    await page.goto("/courses/create");

    const createButton = page.getByRole("button", { name: "Create" });
    await createButton.click();

    const titleInput = page.getByLabel("Course title*");
    await expect(titleInput).toHaveAttribute("aria-invalid", "true", {
      timeout: 10000,
    });
  });

  test("creates a new course and redirects to courses page", async ({
    page,
  }) => {
    await page.goto("/courses/create");

    const courseTitle = `E2E Course ${Date.now()}`;
    const dutchCourseTitle = `E2E Course Dutch ${Date.now()}`;

    await page.getByLabel("Course title*").fill(courseTitle);
    await page
      .getByLabel("Description")
      .fill("Course created for chapter E2E test.");

    await page.getByLabel("Switch course content language").click();
    await page.getByLabel("Course title*").fill(dutchCourseTitle);

    await page.getByRole("button", { name: "Create" }).click();

    await expect(
      page.getByText("Course was added successfully!", { exact: true }),
    ).toBeVisible();
    await expect(page.getByText(courseTitle)).toBeVisible();
  });
});
