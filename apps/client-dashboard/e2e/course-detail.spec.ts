import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "./auth";
import { createCourseThroughUI } from "./courses";
import {
  mockChaptersApi,
  mockChaptersApiError,
  mockChapters,
} from "./mocks/chapters";
import { mockCourseApi, mockCourse } from "./mocks/courses";

test.describe("Course publish and archive", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("publishes the course after confirmation", async ({ page }) => {
    // 1. Create a course through the UI (redirects to course overview)
    await createCourseThroughUI(page);

    // 2. Open the publish confirmation popover
    await page.getByRole("button", { name: "Publish" }).click();

    // 3. The course has no groups, so the public-course warning is shown first
    await expect(
      page.getByText(
        "This course has no groups assigned, so it will be accessible to everyone. Are you sure you want to publish it as a public course?",
      ),
    ).toBeVisible();

    // 4. Continue to the regular publish confirmation
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(
      page.getByText("Are you sure you want to publish this course?"),
    ).toBeVisible();

    // 5. Confirm publish and verify the button switches to Archive
    await page.getByRole("button", { name: "Publish" }).last().click();

    await expect(page.getByRole("button", { name: "Archive" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Publish" }),
    ).not.toBeVisible();
  });

  test("archives a published course", async ({ page }) => {
    // 1. Create a course through the UI (redirects to course overview)
    await createCourseThroughUI(page);

    // 2. Publish the course (confirm through the public-course warning)
    await page.getByRole("button", { name: "Publish" }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Publish" }).last().click();
    await expect(page.getByRole("button", { name: "Archive" })).toBeVisible();

    // 3. Archive the course and verify the button switches back to Publish
    await page.getByRole("button", { name: "Archive" }).click();

    await expect(page.getByRole("button", { name: "Publish" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Archive" }),
    ).not.toBeVisible();
  });
});

test.describe("Course detail page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await mockCourseApi(page);
    await mockChaptersApi(page);
    await page.goto(`/courses/${mockCourse.id}/overview`);
    await expect(
      page.getByText(mockCourse.translations[0].title, { exact: true }),
    ).toBeVisible();
  });

  test("renders the course detail page shell", async ({ page }) => {
    // Wait for the mock course title to be visible.
    await expect(
      page.getByText(`${mockCourse.translations[0].title}`, { exact: true }),
    ).toBeVisible();

    await expect(page.getByRole("link", { name: "Courses" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Courses" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    await expect(
      page.getByText("Course information", { exact: true }),
    ).toBeVisible();

    await expect(page.getByRole("button", { name: "Publish" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Publish" })).toBeEnabled();
  });

  test("renders the course detail sidebar navigation", async ({ page }) => {
    await expect(page.getByRole("link", { name: "Overview" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Quiz" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Groups" })).toBeVisible();

    await expect(page.getByText("Table of Contents")).toBeVisible();

    await expect(page.getByText("Add chapter", { exact: true })).toBeVisible();
  });

  test("publish action is available from the course detail page", async ({
    page,
  }) => {
    const publishButton = page.getByRole("button", { name: "Publish" });

    await expect(publishButton).toBeVisible();
    await expect(publishButton).toBeEnabled();
    await expect(
      page.getByRole("button", { name: "Save as draft" }),
    ).not.toBeVisible();
  });

  test("switches course detail page labels from English to Dutch", async ({
    page,
  }) => {
    await page.getByRole("radio", { name: "Toggle Dutch" }).click();

    await expect(page.getByRole("link", { name: "Cursussen" })).toBeVisible();

    await expect(
      page.getByText("Cursusinformatie", { exact: true }),
    ).toBeVisible();

    await expect(page.getByRole("link", { name: "Overzicht" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Quiz" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Groepen" })).toBeVisible();

    await expect(page.getByText("Inhoudsopgave")).toBeVisible();

    await expect(
      page.getByRole("button", { name: "Publiceren" }),
    ).toBeVisible();
  });

  test("shows inline edit form from the course information edit button", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Edit" }).click();

    await expect(page).toHaveURL(`/courses/${mockCourse.id}/edit`);

    await expect(page.getByLabel("Course title*")).toHaveValue(
      mockCourse.translations[0].title,
    );

    await expect(page.getByLabel("Description")).toHaveValue(
      mockCourse.translations[0].content ?? "",
    );

    await expect(page.getByRole("button", { name: "Save" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();
  });
});

test.describe("Course detail page chapters", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await mockCourseApi(page);
  });

  test("displays chapter titles fetched from the API", async ({ page }) => {
    await mockChaptersApi(page);
    await page.goto(`/courses/${mockCourse.id}`);

    await expect(
      page.getByText(mockCourse.translations[0].title, { exact: true }),
    ).toBeVisible();

    for (const chapter of mockChapters) {
      await expect(
        page.getByText(chapter.translations[0].title, { exact: true }),
      ).toBeVisible();
    }
  });

  test("displays an empty state when the course has no chapters", async ({
    page,
  }) => {
    await mockChaptersApi(page, []);
    await page.goto(`/courses/${mockCourse.id}`);

    await expect(
      page.getByText("This course has no chapters available."),
    ).toBeVisible();
  });

  test("displays an error when chapters fail to load", async ({ page }) => {
    await mockChaptersApiError(page);
    await page.goto(`/courses/${mockCourse.id}`);

    await expect(page.getByRole("alert")).toBeVisible();
  });
});
