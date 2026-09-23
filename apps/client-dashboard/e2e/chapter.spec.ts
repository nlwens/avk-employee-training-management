import { expect, test, type Page } from "@playwright/test";
import { loginAsAdmin } from "./auth";
import { mockCourse, mockCourseApi } from "./mocks/courses";
import { mockChaptersApi } from "./mocks/chapters";

const getChapterTitlePlaceholder = (page: Page) =>
  page.getByPlaceholder("Add a title...");

test.describe("Chapter form page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await mockCourseApi(page);
    await mockChaptersApi(page);
    await page.goto(`/courses/${mockCourse.id}/chapters/create`);
  });

  test("renders the chapter form", async ({ page }) => {
    await expect(
      page.getByPlaceholder("Add a title...", { exact: true }),
    ).toBeVisible();

    await expect(page.getByText("Chapter content")).toBeVisible();

    await expect(page.getByRole("button", { name: "Save" })).toBeVisible();
  });

  test("creates a chapter end-to-end: add a text block, provide translations and save", async ({
    page,
  }) => {
    const titleInput = getChapterTitlePlaceholder(page);
    await titleInput.fill("E2E Chapter Title");

    await page.getByRole("button", { name: "Add", exact: true }).click();
    await page.getByRole("button", { name: "Text" }).click();

    const textArea = page.getByPlaceholder("Write chapter text here...");
    await textArea.fill("This is the chapter content for E2E test.");

    const languageSwitch = page.getByRole("switch", {
      name: "Switch course content language",
    });
    await languageSwitch.click();

    await titleInput.fill("E2E Hoofdstuk Titel");

    await languageSwitch.click();

    await page.getByRole("button", { name: "Save" }).click();

    await expect(textArea).toBeVisible();
  });

  test("adds an image block and uploads an image file", async ({ page }) => {
    const titleInput = getChapterTitlePlaceholder(page);
    await titleInput.fill("E2E Chapter Image");

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
  });

  test("adds a PDF block and uploads a PDF file", async ({ page }) => {
    const titleInput = getChapterTitlePlaceholder(page);
    await titleInput.fill("E2E Chapter PDF");

    await page.getByRole("button", { name: "Add", exact: true }).click();
    await page.getByRole("button", { name: "PDF" }).click();

    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toHaveAttribute("accept", ".pdf,application/pdf");

    await fileInput.setInputFiles({
      name: "course-material.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4 fake pdf body"),
    });

    await expect(page.getByText("course-material.pdf")).toBeVisible();
  });

  test("adds multiple file blocks, uploads to each, and removes one", async ({
    page,
  }) => {
    const titleInput = getChapterTitlePlaceholder(page);
    await titleInput.fill("Mixed media chapter");

    const addButton = page.getByRole("button", { name: "Add", exact: true });

    await addButton.click();
    await page.getByRole("button", { name: "Image" }).click();

    await addButton.click();
    await page.getByRole("button", { name: "Video" }).click();

    const fileInputs = page.locator('input[type="file"]');
    await expect(fileInputs).toHaveCount(2);
    await expect(fileInputs.nth(0)).toHaveAttribute("accept", "image/*");
    await expect(fileInputs.nth(1)).toHaveAttribute("accept", "video/*");

    await fileInputs.nth(0).setInputFiles({
      name: "diagram.png",
      mimeType: "image/png",
      buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
    });

    await fileInputs.nth(1).setInputFiles({
      name: "intro.mp4",
      mimeType: "video/mp4",
      buffer: Buffer.from("fake video bytes"),
    });

    await expect(page.getByText("diagram.png")).toBeVisible();
    await expect(page.getByText("intro.mp4")).toBeVisible();

    await expect(
      page.getByRole("button", { name: "Drag content block", exact: true }),
    ).toHaveCount(2);

    const deleteButtons = page.getByRole("button", {
      name: "Delete content block",
      exact: true,
    });
    await deleteButtons.nth(0).click();

    await expect(page.getByText("diagram.png")).toHaveCount(0);
    await expect(page.getByText("intro.mp4")).toBeVisible();
    await expect(page.locator('input[type="file"]')).toHaveCount(1);
  });

  test("uploads a file in English and shows an empty file slot in Dutch for the same block", async ({
    page,
  }) => {
    const titleInput = getChapterTitlePlaceholder(page);
    await titleInput.fill("Bilingual chapter");

    await page.getByRole("button", { name: "Add", exact: true }).click();
    await page.getByRole("button", { name: "PowerPoint" }).click();

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "slides-en.pptx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      buffer: Buffer.from("fake pptx bytes"),
    });

    await expect(page.getByText("slides-en.pptx")).toBeVisible();

    const languageSwitch = page.getByRole("switch", {
      name: "Switch course content language",
    });
    await languageSwitch.click();

    await expect(page.getByText("slides-en.pptx")).toHaveCount(0);
    await expect(
      page.getByText("Select file to upload", { exact: true }),
    ).toBeVisible();

    await page.locator('input[type="file"]').setInputFiles({
      name: "slides-nl.pptx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      buffer: Buffer.from("fake nl pptx bytes"),
    });

    await expect(page.getByText("slides-nl.pptx")).toBeVisible();

    await languageSwitch.click();
    await expect(page.getByText("slides-en.pptx")).toBeVisible();
  });
});
