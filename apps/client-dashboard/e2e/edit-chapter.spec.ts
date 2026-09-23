import { expect, test, type Page } from "@playwright/test";
import { loginAsAdmin } from "./auth";
import { createCourseThroughUI } from "./courses";
import {
  createChapterThroughUI,
  dragSidebarChapter,
  getSidebarChapterTitles,
} from "./chapters";

const chapterTitleHeading = (page: Page) =>
  page.locator("main span.text-lg.font-medium");

test.describe("Edit chapter", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("updates chapter titles on the edit chapter page", async ({ page }) => {
    const { courseId } = await createCourseThroughUI(page);
    const { chapterId, chapterTitle } = await createChapterThroughUI(
      page,
      courseId,
    );

    const updatedEnglishTitle = `Edit page EN ${Date.now()}`;
    const updatedDutchTitle = `Edit page NL ${Date.now()}`;

    await page.getByRole("button", { name: "Edit chapter" }).click();
    await expect(page).toHaveURL(
      `/courses/${courseId}/chapters/${chapterId}/edit`,
    );

    const titleInput = page.getByPlaceholder("Add a title...", { exact: true });
    await expect(titleInput).toHaveValue(chapterTitle);
    await titleInput.fill(updatedEnglishTitle);

    await page
      .getByRole("switch", { name: "Switch course content language" })
      .click();
    await titleInput.fill(updatedDutchTitle);

    await page.getByRole("button", { name: "Save", exact: true }).click();

    await expect(page).toHaveURL(`/courses/${courseId}/chapters/${chapterId}`);
    await expect(
      page.getByText("Chapter was updated successfully!", { exact: true }),
    ).toBeVisible();
    await expect(chapterTitleHeading(page)).toHaveText(updatedEnglishTitle);

    await page.getByRole("radio", { name: "Toggle Dutch" }).click();
    await expect(chapterTitleHeading(page)).toHaveText(updatedDutchTitle);
  });

  test("reorders chapters in the sidebar and persists after reload", async ({
    page,
  }) => {
    const { courseId } = await createCourseThroughUI(page);
    const firstChapter = await createChapterThroughUI(page, courseId);
    const secondChapter = await createChapterThroughUI(page, courseId);

    await page.goto(`/courses/${courseId}/overview`);

    await expect(await getSidebarChapterTitles(page)).toEqual([
      firstChapter.chapterTitle,
      secondChapter.chapterTitle,
    ]);

    await dragSidebarChapter(page, 1, 0);

    await expect(
      page.getByText("Chapter order was saved successfully!", { exact: true }),
    ).toBeVisible();

    await expect
      .poll(async () => getSidebarChapterTitles(page))
      .toEqual([secondChapter.chapterTitle, firstChapter.chapterTitle]);

    await page.reload();

    await expect(await getSidebarChapterTitles(page)).toEqual([
      secondChapter.chapterTitle,
      firstChapter.chapterTitle,
    ]);
  });
});
