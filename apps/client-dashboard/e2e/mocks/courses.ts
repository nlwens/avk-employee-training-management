import type { Page, Route } from "@playwright/test";

export const mockCourseStats = {
  questionsCount: 3,
  averageScore: 72,
};

export const mockCourses = [
  {
    id: "e2e-course-1",
    published: false,
    priority: 1,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    translations: [
      { localeCode: "en", title: "E2E Alpha Course", content: null },
    ],
    chaptersCount: 0,
    completedChaptersCount: 0,
    groups: [],
  },
  {
    id: "e2e-course-2",
    published: false,
    priority: 2,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    translations: [
      {
        localeCode: "en",
        title: "E2E Beta Course",
        content:
          "A refresher course for forklift operators covering risks, inspections, safe driving, and warehouse procedures.",
      },
    ],
    chaptersCount: 0,
    completedChaptersCount: 0,
    groups: [],
  },
];

const isCoursesApiRequest = (route: Route) => {
  const url = route.request().url();
  const isCoursesUrl = url.includes("/courses");
  const method = route.request().method();
  const resourceType = route.request().resourceType();

  return (
    (resourceType === "fetch" || resourceType === "xhr") &&
    method === "GET" &&
    isCoursesUrl
  );
};

export const mockCourse = mockCourses[1];

export async function mockCoursesApi(page: Page) {
  await page.route("**/courses", async (route) => {
    if (!isCoursesApiRequest(route)) {
      await route.continue();
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: mockCourses,
        total: mockCourses.length,
        page: 1,
        limit: 100,
        pages: 1,
      }),
    });
  });

  await page.route("**/courses/*", async (route) => {
    if (!isCoursesApiRequest(route)) {
      await route.continue();
      return;
    }

    const url = new URL(route.request().url());
    const courseId = url.pathname.split("/").pop();
    const course = mockCourses.find((c) => c.id === courseId);

    await route.fulfill({
      status: course ? 200 : 404,
      contentType: "application/json",
      body: JSON.stringify(course ?? { message: "Not found" }),
    });
  });
}

const courseDetailPath = `/courses/${mockCourse.id}`;
const courseStatsPath = `${courseDetailPath}/stats`;

export async function mockCourseApi(page: Page) {
  await page.route(`**/**/courses/${mockCourse.id}**`, async (route) => {
    const method = route.request().method();
    const resourceType = route.request().resourceType();
    const pathname = new URL(route.request().url()).pathname.replace(/\/$/, "");

    if (resourceType !== "fetch" && resourceType !== "xhr") {
      await route.continue();
      return;
    }

    if (pathname !== courseDetailPath && pathname !== courseStatsPath) {
      await route.continue();
      return;
    }

    if (method === "GET" && isCoursesApiRequest(route)) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          pathname === courseStatsPath ? mockCourseStats : mockCourse,
        ),
      });
      return;
    }

    if (method === "DELETE") {
      await route.fulfill({
        status: 204,
        body: "",
      });
      return;
    }

    await route.continue();
  });
}
