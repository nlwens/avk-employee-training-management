import { expect, type Page } from "@playwright/test";
import { courseIdFromUrl, setContentLanguage } from "./chapters";

/**
 * Helper function to perform a course creation test on a real API.
 *
 * It simplifies course creation UI steps by just using one function call:
 *
 * ```
 * const course = createCourseThroughUI(page);
 * course.courseTitle;
 * course.dutchTitle;
 * ```
 *
 * @returns Created course title (both English and Dutch versions).
 */
export async function createCourseThroughUI(page: Page) {
  await page.goto("/courses/create");

  const courseTitle = `E2E Course ${Date.now()}`;
  const dutchCourseTitle = `E2E Course Dutch ${Date.now()}`;

  await setContentLanguage(page, "en");
  await page.getByLabel("Course title*").fill(courseTitle);
  await page
    .getByLabel("Description")
    .fill("Course created for chapter E2E test.");

  await setContentLanguage(page, "nl");
  await page.getByLabel("Course title*").fill(dutchCourseTitle);

  await page.getByRole("button", { name: "Create" }).click();

  await expect(
    page.getByRole("heading", { level: 2, name: courseTitle }),
  ).toBeVisible();

  const courseId = courseIdFromUrl(page.url());
  expect(courseId).toBeTruthy();

  return {
    courseTitle,
    dutchCourseTitle,
    courseId: courseId!,
  };
}

export function courseListLink(page: Page, courseId: string) {
  return page.locator(`a[href="/courses/${courseId}/overview"]`);
}
