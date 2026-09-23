import { expect, test, type Page } from "@playwright/test";
import { getAdminToken, loginAsAdmin } from "./auth";

const API_URL = process.env.VITE_API_URL ?? "http://localhost:3000";

/**
 * We create more courses than the page limit (12) so the drafts section
 * always has at least two pages, regardless of other data in the database.
 */
const COURSES_TO_CREATE = 15;

function sectionOf(heading: ReturnType<Page["getByRole"]>) {
  return heading.locator("xpath=ancestor::section[1]");
}

function paginationNav(section: ReturnType<Page["locator"]>) {
  return section.locator("nav[data-slot='pagination']");
}

test.describe("Courses pagination", () => {
  let adminToken: string;
  const createdCourseIds: string[] = [];

  test.beforeAll(async ({ request }) => {
    test.setTimeout(60_000);

    adminToken = await getAdminToken(request);

    const timestamp = Date.now();
    for (let i = 0; i < COURSES_TO_CREATE; i++) {
      const res = await request.post(`${API_URL}/courses`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: {
          translations: [
            {
              locale: "en",
              title: `E2E Pagination Course ${timestamp}-${i + 1}`,
              content: null,
            },
          ],
        },
      });
      const body = await res.json();
      createdCourseIds.push(body.id);
    }
  });

  test.afterAll(async ({ request }) => {
    test.setTimeout(60_000);

    for (const id of createdCourseIds) {
      await request.delete(`${API_URL}/courses/${id}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
    }
  });

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/courses");
  });

  test("shows pagination controls for multi-page sections", async ({
    page,
  }) => {
    const heading = page.getByRole("heading", { name: /Drafts \(\d+\)/ });
    const section = sectionOf(heading);
    const nav = paginationNav(section);

    await expect(nav).toBeVisible();
    await expect(nav.locator("[aria-label='Page 1']")).toHaveAttribute(
      "data-active",
      "true",
    );
  });

  test("navigates to the next page when Next is clicked", async ({ page }) => {
    const heading = page.getByRole("heading", { name: /Drafts \(\d+\)/ });
    const section = sectionOf(heading);
    const nav = paginationNav(section);

    const firstCourseLink = section.locator("a[href*='/courses/']").first();
    const firstPageLabel = await firstCourseLink.getAttribute("aria-label");

    await nav.locator("[aria-label='Next']").click();

    await expect(nav.locator("[aria-label='Page 2']")).toHaveAttribute(
      "data-active",
      "true",
    );

    const secondPageLabel = await firstCourseLink.getAttribute("aria-label");
    expect(firstPageLabel).not.toEqual(secondPageLabel);
  });

  test("navigates to the previous page when Previous is clicked", async ({
    page,
  }) => {
    const heading = page.getByRole("heading", { name: /Drafts \(\d+\)/ });
    const section = sectionOf(heading);
    const nav = paginationNav(section);

    await nav.locator("[aria-label='Next']").click();
    await expect(nav.locator("[aria-label='Page 2']")).toHaveAttribute(
      "data-active",
      "true",
    );

    await nav.locator("[aria-label='Previous']").click();
    await expect(nav.locator("[aria-label='Page 1']")).toHaveAttribute(
      "data-active",
      "true",
    );
  });

  test("navigates to a specific page when a page number is clicked", async ({
    page,
  }) => {
    const heading = page.getByRole("heading", { name: /Drafts \(\d+\)/ });
    const section = sectionOf(heading);
    const nav = paginationNav(section);

    const firstCourseLink = section.locator("a[href*='/courses/']").first();
    const firstPageLabel = await firstCourseLink.getAttribute("aria-label");

    await nav.locator("[aria-label='Page 2']").click();

    await expect(nav.locator("[aria-label='Page 2']")).toHaveAttribute(
      "data-active",
      "true",
    );

    const secondPageLabel = await firstCourseLink.getAttribute("aria-label");
    expect(firstPageLabel).not.toEqual(secondPageLabel);
  });

  test("disables Previous on the first page and Next on the last page", async ({
    page,
  }) => {
    const heading = page.getByRole("heading", { name: /Drafts \(\d+\)/ });
    const section = sectionOf(heading);
    const nav = paginationNav(section);

    await expect(nav.locator("[aria-label='Previous']")).toHaveAttribute(
      "aria-disabled",
      "true",
    );

    const lastPageLink = nav.locator("[aria-label^='Page ']").last();
    await lastPageLink.click();

    await expect(lastPageLink).toHaveAttribute("data-active", "true");
    await expect(nav.locator("[aria-label='Next']")).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });
});
