import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "./auth";
import { createCourseThroughUI } from "./courses";
import {
  confirmChapterDelete,
  courseIdFromUrl,
  createChapterThroughUI,
} from "./chapters";

test.describe("Edit chapter page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("deletes the chapter and navigates to the course overview", async ({
    page,
  }) => {
    await createCourseThroughUI(page);

    const courseId = courseIdFromUrl(page.url());
    expect(courseId).toBeTruthy();

    const { chapterId, chapterTitle } = await createChapterThroughUI(
      page,
      courseId!,
    );

    await page.goto(`/courses/${courseId}/chapters/${chapterId}/edit`);

    await confirmChapterDelete(page);

    await expect(page).toHaveURL(`/courses/${courseId}/overview`);

    await expect(
      page.getByText("Chapter was deleted successfully!", { exact: true }),
    ).toBeVisible();

    await expect(
      page.getByRole("link", { name: chapterTitle, exact: true }),
    ).not.toBeVisible();
  });
});
