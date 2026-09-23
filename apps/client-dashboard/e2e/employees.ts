import { expect, type Page } from "@playwright/test";

const uuidPattern =
  "[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";

export const employeeIdFromUrl = (url: string) =>
  url.match(new RegExp(`/employees/(${uuidPattern})`))?.[1];

/**
 * Creates an employee through the UI against the real API.
 */
export async function createEmployeeThroughUI(page: Page) {
  const ts = Date.now();
  const firstName = `Employee${ts}`;
  const surname = "Test";
  const uniqueEmail = `employee.${ts}@example.com`;
  const fullName = `${firstName} ${surname}`;
  const editButtonName = `Edit ${fullName}`;
  const viewDetailsButtonName = `View details of ${fullName}`;

  await page.goto("/employees/create");
  await page.getByPlaceholder("e.g., John").fill(firstName);
  await page.getByPlaceholder("e.g., Smith").fill(surname);
  await page.getByPlaceholder("e.g., example@gmail.com").fill(uniqueEmail);
  await page.getByRole("button", { name: "Save" }).click();
  await page.waitForURL("/employees");

  return {
    firstName,
    surname,
    fullName,
    uniqueEmail,
    editButtonName,
    viewDetailsButtonName,
  };
}

export async function openEmployeeDetailsFromList(
  page: Page,
  viewDetailsButtonName: string,
) {
  await page.getByRole("button", { name: viewDetailsButtonName }).click();
  await expect(page).toHaveURL(/\/employees\/[^/]+$/);
}

export function formatCourseStatsDownloadFilename(
  fullName: string,
  locale = "nl",
): string {
  const date = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date())
    .replace(/\//g, "-");

  return `${fullName} ${date}.csv`;
}

export async function confirmEmployeeDelete(page: Page) {
  await page.getByRole("button", { name: "Delete user", exact: true }).click();

  const dialog = page.locator(".fixed").last();
  await expect(
    dialog.getByText(/Are you sure you want to delete user/),
  ).toBeVisible();

  await dialog.getByRole("button", { name: "Delete user" }).click();
}
