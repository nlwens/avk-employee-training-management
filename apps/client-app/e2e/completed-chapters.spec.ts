import { expect, test, type Page } from "@playwright/test";
import {
  deleteE2ECompletionCourse,
  prepareCompletionCourse,
  type E2ECompletionCourse,
} from "./completed-chapters-setup";
import { getAdminToken, loginAsAdmin, logout } from "./auth";

const COMPLETION_SETTLE_MS = 5_000;

function chapterCheckmarkOnDetailPage(page: Page, chapterTitle: string) {
  return page.getByRole("link", { name: chapterTitle }).locator("svg");
}

async function openChapter(page: Page, courseId: string, chapterId: string) {
  await page.goto(`/courses/${courseId}/chapters/${chapterId}`);
  await expect(page).toHaveURL(
    new RegExp(`/courses/${courseId}/chapters/${chapterId}`),
  );
  await expect(page.locator("h2")).toBeVisible();

  // Opening a chapter marks it complete asynchronously; give the app time to
  // finish before navigating away.
  await page.waitForTimeout(COMPLETION_SETTLE_MS);
}

async function openCourseDetailPage(page: Page, courseId: string) {
  await page.goto(`/courses/${courseId}`);
  await expect(page).toHaveURL(new RegExp(`/courses/${courseId}$`));
}

test.describe("Chapter completion", () => {
  // Tests share one course; run serially so completion state stays predictable.
  test.describe.configure({ mode: "serial" });

  let completionSetup: E2ECompletionCourse;
  let adminToken: string;

  test.beforeAll(async ({ request }) => {
    test.setTimeout(60_000);

    adminToken = await getAdminToken(request);
    completionSetup = await prepareCompletionCourse(request, adminToken);
  });

  test.afterAll(async ({ request }) => {
    // We reuse the token from beforeAll. A fresh login here can fail when other
    // tests change the admin password on a parallel worker.
    await deleteE2ECompletionCourse(
      request,
      adminToken,
      completionSetup.courseId,
    );
  });

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("marks a chapter as completed when the user opens it", async ({
    page,
  }) => {
    const { courseId, chapterId, chapterTitle } = completionSetup;
    const checkmark = chapterCheckmarkOnDetailPage(page, chapterTitle);

    await openChapter(page, courseId, chapterId);
    await openCourseDetailPage(page, courseId);

    await expect(checkmark).toBeVisible({ timeout: 10_000 });

    // Clear client caches and sign in again to confirm completion was persisted.
    await logout(page);
    await loginAsAdmin(page);
    await openCourseDetailPage(page, courseId);

    await expect(checkmark).toBeVisible();
  });

  test("shows completion checkmarks on the course detail page", async ({
    page,
  }) => {
    const { courseId, chapterId, chapterTitle } = completionSetup;

    await openChapter(page, courseId, chapterId);
    await openCourseDetailPage(page, courseId);

    await expect(chapterCheckmarkOnDetailPage(page, chapterTitle)).toBeVisible({
      timeout: 10_000,
    });
  });
});
