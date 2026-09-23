import { expect, test, type Page } from "@playwright/test";
import { loginAsAdmin } from "./auth";
import { createCourseThroughUI } from "./courses";
import {
  courseIdFromUrl,
  createChapterAndSegmentsThroughUI,
  expectChapterImageSegmentVisible,
  setContentLanguage,
  waitForChapterSaveSuccess,
} from "./chapters";

test.describe("Create, update, delete segments in chapter page", () => {
  let page: Page;
  let createdCourseId: string;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();

    await loginAsAdmin(page);

    await createCourseThroughUI(page);

    const courseId = courseIdFromUrl(page.url());
    expect(courseId).toBeTruthy();

    createdCourseId = courseId!;
  });

  test.beforeEach(async () => {
    await page.goto(`/courses/${createdCourseId}/overview`);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test("opens chapter edit page, adds a new text segment and removes the old one", async () => {
    const { chapterId, dutchChapterTitle } =
      await createChapterAndSegmentsThroughUI(page, createdCourseId);

    await page.getByRole("button", { name: "Edit chapter" }).click();

    await expect(page).toHaveURL(
      `/courses/${createdCourseId}/chapters/${chapterId}/edit`,
    );

    await expect(
      page.getByText("Chapter content", { exact: true }),
    ).toBeVisible();

    // Add one more text segment
    await page.getByRole("button", { name: "Add", exact: true }).click();
    await page.getByRole("button", { name: "Text", exact: true }).click();

    const textSegmentEn = "New test segment";
    const textSegmentNl = "Nieuw testsegment";

    await setContentLanguage(page, "en");
    await page
      .getByPlaceholder("Write chapter text here...")
      .nth(1)
      .fill(textSegmentEn);

    await setContentLanguage(page, "nl");
    await page
      .getByPlaceholder("Write chapter text here...")
      .nth(1)
      .fill(textSegmentNl);

    // Remove first segment
    await page.locator("[aria-label='Delete content block']").nth(0).click();

    await expect(
      page.getByText(dutchChapterTitle, { exact: true }),
    ).not.toBeVisible();

    await page.getByRole("button", { name: "Save" }).click();
    await waitForChapterSaveSuccess(page);

    await expect(page).toHaveURL(
      `/courses/${createdCourseId}/chapters/${chapterId}`,
    );

    await page.waitForLoadState("networkidle");

    // Verify that newly added text segment and image are still present
    await expectChapterImageSegmentVisible(page);
    await expect(page.getByText(textSegmentEn, { exact: true })).toBeVisible();
  });

  test("opens chapter edit page and updates an existing text segment", async () => {
    const { chapterId } = await createChapterAndSegmentsThroughUI(
      page,
      createdCourseId,
    );

    await page.getByRole("button", { name: "Edit chapter" }).click();

    await expect(page).toHaveURL(
      `/courses/${createdCourseId}/chapters/${chapterId}/edit`,
    );

    await expect(
      page.getByText("Chapter content", { exact: true }),
    ).toBeVisible();

    const updatedTextSegmentEn = "Updated existing test segment";
    const updatedTextSegmentNl = "Bijgewerkt bestaand testsegment";

    await setContentLanguage(page, "en");
    await page
      .getByPlaceholder("Write chapter text here...")
      .first()
      .fill(updatedTextSegmentEn);

    await setContentLanguage(page, "nl");
    await page
      .getByPlaceholder("Write chapter text here...")
      .first()
      .fill(updatedTextSegmentNl);

    await page.getByRole("button", { name: "Save" }).click();
    await waitForChapterSaveSuccess(page);

    await expect(page).toHaveURL(
      `/courses/${createdCourseId}/chapters/${chapterId}`,
    );

    // Verify updated text segment
    await expect(
      page.getByText(updatedTextSegmentEn, { exact: true }),
    ).toBeVisible();
  });

  test("opens chapter edit page and updates an existing file segment", async () => {
    const { chapterId } = await createChapterAndSegmentsThroughUI(
      page,
      createdCourseId,
    );

    await page.getByRole("button", { name: "Edit chapter" }).click();

    await expect(page).toHaveURL(
      `/courses/${createdCourseId}/chapters/${chapterId}/edit`,
    );

    await expect(
      page.getByText("Chapter content", { exact: true }),
    ).toBeVisible();

    await setContentLanguage(page, "en");
    const fileInput = page.locator('input[type="file"]');

    await fileInput.setInputFiles({
      name: "updated-test-file.png",
      mimeType: "image/png",
      buffer: Buffer.from("Updated image segment"),
    });

    await page.getByRole("button", { name: "Save" }).click();
    await waitForChapterSaveSuccess(page);

    await expect(page).toHaveURL(
      `/courses/${createdCourseId}/chapters/${chapterId}`,
    );

    // Verify updated image segment is still present on the chapter page
    await expectChapterImageSegmentVisible(page);
  });
});
