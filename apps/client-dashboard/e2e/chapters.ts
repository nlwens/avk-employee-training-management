import { expect, type Page } from "@playwright/test";

const uuidPattern =
  "[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";

export const courseIdFromUrl = (url: string) =>
  url.match(new RegExp(`/courses/(${uuidPattern})`))?.[1];

export const chapterIdFromUrl = (url: string) =>
  url.match(new RegExp(`/chapters/(${uuidPattern})`))?.[1];

export const contentLanguageSwitch = (page: Page) =>
  page.getByRole("switch", { name: "Switch course content language" });

export async function setContentLanguage(page: Page, locale: "en" | "nl") {
  const languageSwitch = contentLanguageSwitch(page);
  const isDutch =
    (await languageSwitch.getAttribute("aria-checked")) === "true";

  if (locale === "en" && isDutch) {
    await languageSwitch.click();
  }

  if (locale === "nl" && !isDutch) {
    await languageSwitch.click();
  }
}

export async function waitForChapterSaveSuccess(page: Page) {
  await expect(
    page.getByText("Chapter was updated successfully!", { exact: true }),
  ).toBeVisible();
}

export async function expectChapterImageSegmentVisible(page: Page) {
  await expect(page).toHaveURL(/\/chapters\/[^/]+$/);
  await expect(page.locator('main img[src*="data-storage"]')).toBeVisible();
}

/**
 * Creates a chapter and its segments through the UI against the real API.
 */
export async function createChapterAndSegmentsThroughUI(
  page: Page,
  courseId: string,
) {
  const { chapterId, chapterTitle, dutchChapterTitle } =
    await createChapterThroughUI(page, courseId);

  await page.getByRole("button", { name: "Edit chapter" }).click();

  await expect(page).toHaveURL(
    new RegExp(`/courses/${courseId}/chapters/${chapterId}/edit`),
  );

  await page.getByRole("button", { name: "Add", exact: true }).click();
  await page.getByRole("button", { name: "Text" }).click();

  const textSegment = "This is the chapter content for E2E test.";

  await setContentLanguage(page, "en");
  const textAreaEn = page.getByPlaceholder("Write chapter text here...");
  await textAreaEn.fill(textSegment);

  await page.getByRole("button", { name: "Add", exact: true }).click();
  await page.getByRole("button", { name: "Image" }).click();

  await expect(
    page.getByText("Select file to upload", { exact: true }),
  ).toBeVisible();

  const fileInput = page.locator('input[type="file"]');
  await expect(fileInput).toHaveAttribute("accept", "image/*");

  await fileInput.setInputFiles({
    name: "test-image.png",
    mimeType: "image/png",
    buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  });

  await expect(page.getByText("test-image.png")).toBeVisible();

  await setContentLanguage(page, "nl");
  await page
    .getByPlaceholder("Write chapter text here...")
    .first()
    .fill("This is the chapter content for E2E test in Dutch.");

  await page.getByRole("button", { name: "Save" }).click();

  await expect(page).toHaveURL(
    new RegExp(`/courses/${courseId}/chapters/${uuidPattern}`),
  );

  await expect(page.getByText(chapterTitle, { exact: true })).toBeVisible();

  await expect(
    page.getByText(textSegment, {
      exact: true,
    }),
  ).toBeVisible();

  await expectChapterImageSegmentVisible(page);

  return {
    chapterId,
    chapterTitle,
    dutchChapterTitle,
    textSegment,
  };
}

/**
 * Creates a chapter through the UI against the real API.
 */
export async function createChapterThroughUI(page: Page, courseId: string) {
  const chapterTitle = `E2E Chapter ${Date.now()}`;
  const dutchChapterTitle = `E2E Hoofdstuk ${Date.now()}`;

  await page.goto(`/courses/${courseId}/chapters/create`);

  await page.getByText("Add chapter", { exact: true }).click();

  const titleInput = page.getByPlaceholder("Add a title...", {
    exact: true,
  });

  await setContentLanguage(page, "en");
  await titleInput.fill(chapterTitle);

  await setContentLanguage(page, "nl");
  await titleInput.fill(dutchChapterTitle);

  await page.getByRole("button", { name: "Save" }).click();

  await expect(page).toHaveURL(
    new RegExp(`/courses/${courseId}/chapters/${uuidPattern}`),
  );

  const chapterId = chapterIdFromUrl(page.url());
  expect(chapterId).toBeTruthy();

  return {
    chapterId: chapterId!,
    chapterTitle,
    dutchChapterTitle,
  };
}

export async function confirmChapterDelete(page: Page) {
  await page.getByRole("button", { name: "Delete", exact: true }).click();

  await expect(page.getByText("Delete chapter?")).toBeVisible();
  await page.getByLabel("Type 'delete' to confirm").fill("delete");
  await page
    .getByRole("button", { name: "Delete", exact: true })
    .last()
    .click();
}

export async function getSidebarChapterTitles(page: Page) {
  const chapterLinks = page.locator(
    'aside ul a[href*="/chapters/"]:not([href*="/create"])',
  );

  await expect(chapterLinks.first()).toBeVisible();

  return chapterLinks.allTextContents();
}

export async function dragSidebarChapter(
  page: Page,
  fromIndex: number,
  toIndex: number,
) {
  const dragHandles = page.getByRole("button", {
    name: "Drag chapter",
    exact: true,
  });

  const source = dragHandles.nth(fromIndex);
  const target = dragHandles.nth(toIndex);

  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();

  if (!sourceBox || !targetBox) {
    throw new Error("Could not resolve drag handle positions.");
  }

  await page.mouse.move(
    sourceBox.x + sourceBox.width / 2,
    sourceBox.y + sourceBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    targetBox.x + targetBox.width / 2,
    targetBox.y + targetBox.height / 2,
    { steps: 15 },
  );
  await page.mouse.up();
}
