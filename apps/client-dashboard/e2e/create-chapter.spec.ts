import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "./auth";
import { createCourseThroughUI } from "./courses";

const uuidPattern =
  "[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";

test.describe("Create chapter page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("creates a chapter and redirects to the chapter details page", async ({
    page,
  }) => {
    // first, go to the course creation page, fill in inputs, then create a course
    await createCourseThroughUI(page);

    await expect(page).toHaveURL(new RegExp(`/courses/${uuidPattern}`));

    // we need to get an ID so that we could later create a new course chapter
    const courseId = page
      .url()
      .match(
        /\/courses\/([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})/,
      )?.[1];

    expect(courseId).toBeTruthy();

    // now, go to the chapter's edit page and fill in localized title input
    await page.goto(`/courses/${courseId}/chapters/create`);

    await page.getByText("Add chapter", { exact: true }).click();

    const titleInput = page.getByPlaceholder("Add a title...", {
      exact: true,
    });
    await titleInput.fill("E2E Chapter Three");

    // add TEXT segment (English)
    await page.getByRole("button", { name: "Add", exact: true }).click();
    await page.getByRole("button", { name: "Text" }).click();

    const textAreaEn = page.getByPlaceholder("Write chapter text here...");
    await textAreaEn.fill("This is the chapter content for E2E test.");

    // add IMAGE segment (English)
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

    // switch locale
    await page
      .getByRole("switch", { name: "Switch course content language" })
      .click();

    await titleInput.fill("Hoofdstuk Titel");

    // TEXT segment (Dutch)
    await page.getByPlaceholder("Write chapter text here...").click();
    await page
      .getByPlaceholder("Write chapter text here...")
      .fill("This is the chapter content for E2E test in Dutch.");

    // create a new chapter
    await page.getByRole("button", { name: "Save" }).click();

    await expect(page).toHaveURL(
      new RegExp(`/courses/${courseId}/chapters/${uuidPattern}`),
    );

    await expect(
      page.locator("span.text-lg.font-medium", {
        hasText: "E2E Chapter Three",
      }),
    ).toBeVisible();

    // see if english segment appeared
    await expect(
      page.getByText("This is the chapter content for E2E test.", {
        exact: true,
      }),
    ).toBeVisible();

    // see if IMAGE english segment appeared
    await page.locator('input[type="file"]').isVisible();
  });
});
