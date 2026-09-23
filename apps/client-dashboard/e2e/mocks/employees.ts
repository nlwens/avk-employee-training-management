import type { Page, Route } from "@playwright/test";

export const mockGroups = [
  { id: "group-a", name: "Group A" },
  { id: "group-b", name: "Group B" },
  { id: "group-c", name: "Group C" },
];

export const mockAdminUser = {
  id: "user-admin",
  name: "Admin",
  surname: "User",
  email: "admin.user@example.com",
  admin: true,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  localeCode: "en",
  groups: [],
};

export const mockUsers = [
  {
    id: "user-1",
    name: "John",
    surname: "Doe",
    email: "john.doe@example.com",
    admin: false,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    localeCode: "en",
    groups: [{ id: "group-a", name: "Group A" }],
  },
  {
    id: "user-2",
    name: "Jane",
    surname: "Lee",
    email: "jane.lee@example.com",
    admin: false,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    localeCode: "en",
    groups: [{ id: "group-b", name: "Group B" }],
  },
  {
    id: "user-3",
    name: "Brian",
    surname: "Smith",
    email: "brian.smith@example.com",
    admin: false,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    localeCode: "en",
    groups: [{ id: "group-c", name: "Group C" }],
  },
  {
    id: "user-4",
    name: "Alice",
    surname: "Black",
    email: "alice.black@example.com",
    admin: false,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    localeCode: "en",
    groups: [{ id: "group-a", name: "Group A" }],
  },
  {
    id: "user-5",
    name: "Jason",
    surname: "Brown",
    email: "jason.brown@example.com",
    admin: false,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    localeCode: "en",
    groups: [{ id: "group-b", name: "Group B" }],
  },
  {
    id: "user-6",
    name: "Lily",
    surname: "James",
    email: "lily.james@example.com",
    admin: false,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    localeCode: "en",
    groups: [{ id: "group-c", name: "Group C" }],
  },
  mockAdminUser,
];

const isApiGetRequest = (route: Route, path: string) => {
  const resourceType = route.request().resourceType();

  return (
    (resourceType === "fetch" || resourceType === "xhr") &&
    route.request().method() === "GET" &&
    new URL(route.request().url()).pathname.replace(/\/$/, "") === path
  );
};

export async function mockEmployeesApi(page: Page) {
  await page.route("**/users", async (route) => {
    if (!isApiGetRequest(route, "/users")) {
      await route.continue();
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockUsers),
    });
  });

  await page.route("**/groups", async (route) => {
    if (!isApiGetRequest(route, "/groups")) {
      await route.continue();
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockGroups),
    });
  });
}
