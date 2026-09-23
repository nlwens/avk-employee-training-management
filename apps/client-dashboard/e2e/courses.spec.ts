import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "./auth";
import { courseListLink, createCourseThroughUI } from "./courses";

test.describe("All courses page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("renders course cards fetched from the API", async ({ page }) => {
    const { courseTitle, courseId } = await createCourseThroughUI(page);

    await page.goto("/courses");

    await expect(
      page.getByRole("heading", { name: /Drafts \(\d+\)/ }),
    ).toBeVisible();
    await expect(page.getByRole("article").first()).toBeVisible();

    await page.goto(`/courses/${courseId}/overview`);
    await expect(
      page.getByRole("heading", { level: 2, name: courseTitle }),
    ).toBeVisible();
  });

  test("navigates to course detail page when a course is clicked", async ({
    page,
  }) => {
    const { courseTitle, courseId } = await createCourseThroughUI(page);

    await page.getByRole("button", { name: "Publish" }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Publish" }).last().click();
    await expect(page.getByRole("button", { name: "Archive" })).toBeVisible();

    await page.getByRole("link", { name: "Courses" }).click();
    await expect(page).toHaveURL("/courses");

    const courseLink = courseListLink(page, courseId);
    await expect(courseLink).toBeVisible();
    await expect(courseLink).toHaveAttribute(
      "aria-label",
      `Open ${courseTitle}`,
    );

    await courseLink.click();

    await expect(page).toHaveURL(`/courses/${courseId}/overview`);
    await expect(
      page.getByRole("heading", { level: 2, name: courseTitle }),
    ).toBeVisible();
  });

  test("filters courses by search input", async ({ page }) => {
    const { courseTitle } = await createCourseThroughUI(page);

    await page.goto("/courses");

    await expect(
      page.getByRole("heading", { name: /Drafts \(\d+\)/ }),
    ).toBeVisible();

    const searchInput = page.getByRole("searchbox", { name: "Search courses" });
    await searchInput.fill(courseTitle);

    await expect(page).toHaveURL(
      `/courses?search=${encodeURIComponent(courseTitle)}`,
    );

    await expect(page.getByText(courseTitle, { exact: true })).toBeVisible();

    await searchInput.fill("unknown course");

    // Published courses check
    await expect(
      page.getByText("No courses match your search.").nth(0),
    ).toBeVisible();

    // Draft courses check
    await expect(
      page.getByText("No courses match your search.").nth(1),
    ).toBeVisible();
  });
});
