import type { Page, Request } from "@playwright/test";

const isApiRequest = (req: Request) => {
  const t = req.resourceType();
  return t === "fetch" || t === "xhr";
};

import { mockCourse } from "./courses";

export const mockChapters = [
  {
    id: "e2e-chapter-1",
    courseId: mockCourse.id,
    order: 1,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    translations: [
      {
        localeCode: "en",
        title: "E2E Chapter One",
        content: "Chapter one content.",
      },
    ],
  },
  {
    id: "e2e-chapter-2",
    courseId: mockCourse.id,
    order: 2,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    translations: [
      {
        localeCode: "en",
        title: "E2E Chapter Two",
        content: "Chapter two content.",
      },
    ],
  },
];

export async function mockChaptersApi(
  page: Page,
  chapters: typeof mockChapters = mockChapters,
) {
  await page.route(`**/courses/${mockCourse.id}/chapters`, async (route) => {
    if (route.request().method() !== "GET" || !isApiRequest(route.request())) {
      await route.continue();
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(chapters),
    });
  });

  await page.route(`**/courses/${mockCourse.id}/chapters/*`, async (route) => {
    if (route.request().method() !== "GET" || !isApiRequest(route.request())) {
      await route.continue();
      return;
    }

    const url = new URL(route.request().url());
    const chapterId = url.pathname.split("/").pop();
    const chapter = chapters.find((c) => c.id === chapterId);

    await route.fulfill({
      status: chapter ? 200 : 404,
      contentType: "application/json",
      body: JSON.stringify(chapter ?? { message: "Not found" }),
    });
  });
}

export async function mockChaptersApiError(page: Page) {
  await page.route(`**/courses/${mockCourse.id}/chapters`, async (route) => {
    if (route.request().method() !== "GET" || !isApiRequest(route.request())) {
      await route.continue();
      return;
    }

    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ message: "Failed to load chapters" }),
    });
  });
}
