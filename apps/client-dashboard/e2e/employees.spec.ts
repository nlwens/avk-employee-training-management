import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "./auth";
import { mockEmployeesApi } from "./mocks/employees";

test.describe("Employees page", () => {
  test.beforeEach(async ({ page }) => {
    await mockEmployeesApi(page);
    await loginAsAdmin(page);
    await page.goto("/employees");
    await expect(
      page.getByRole("cell", { name: "John", exact: true }),
    ).toBeVisible();
  });

  test("filters users when a group is selected", async ({ page }) => {
    await page.getByRole("button", { name: "Group A", exact: true }).click();

    // Group A has John Doe and Alice Black
    await expect(page.getByRole("row")).toHaveCount(3); // 1 header + 2 rows
    await expect(
      page.getByRole("cell", { name: "John", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("cell", { name: "Alice", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("cell", { name: "Jane", exact: true }),
    ).not.toBeVisible();
  });

  test("filters users by search query", async ({ page }) => {
    await page.getByRole("searchbox").fill("john");

    await expect(
      page.getByRole("cell", { name: "John", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("cell", { name: "Jane", exact: true }),
    ).not.toBeVisible();
  });
});

test.describe("Create employee", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("creates a user through validation, success, listing, and duplicate email handling", async ({
    page,
  }) => {
    const uniqueEmail = `employee-${Date.now()}@example.com`;

    await page.goto("/employees");
    await expect(
      page.getByRole("button", { name: "Add", exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Add", exact: true }).click();
    await expect(page).toHaveURL("/employees/create");
    await expect(
      page.getByRole("heading", { name: "Create new user", level: 2 }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Save" }).click();
    await expect(
      page.getByText("Name is required", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Email is required", { exact: true }),
    ).toBeVisible();

    await page.getByPlaceholder("e.g., John").fill("Test");
    await page.getByPlaceholder("e.g., Smith").fill("Employee");
    await page.getByPlaceholder("e.g., example@gmail.com").fill(uniqueEmail);

    await page.getByRole("button", { name: "Save" }).click();

    await expect(
      page.getByText("Employee account has been created successfully.", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(page).toHaveURL("/employees");
    await expect(page.getByRole("cell", { name: uniqueEmail })).toBeVisible();

    await page.getByRole("button", { name: "Add", exact: true }).click();
    await expect(page).toHaveURL("/employees/create");

    await page.getByPlaceholder("e.g., John").fill("Another");
    await page.getByPlaceholder("e.g., Smith").fill("Duplicate");
    await page.getByPlaceholder("e.g., example@gmail.com").fill(uniqueEmail);
    await page.getByRole("button", { name: "Save" }).click();

    await expect(
      page
        .getByText("An employee with this email address already exists.")
        .first(),
    ).toBeVisible();
    await expect(page).toHaveURL("/employees/create");
  });
});
