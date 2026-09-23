import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "./auth";

test.describe("Edit employee", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("updates employee details through the edit form", async ({ page }) => {
    const ts = Date.now();
    const firstName = `Employee${ts}`;
    const uniqueEmail = `employee.${ts}@example.com`;
    const updatedFirstName = `Updated${ts}`;
    const updatedEmail = `updated.${ts}@example.com`;

    // 1. Create an employee to edit
    await page.goto("/employees/create");
    await page.getByPlaceholder("e.g., John").fill(firstName);
    await page.getByPlaceholder("e.g., Smith").fill("Test");
    await page.getByPlaceholder("e.g., example@gmail.com").fill(uniqueEmail);
    await page.getByRole("button", { name: "Save" }).click();
    await page.waitForURL("/employees");

    // 2. Navigate to the edit employee page
    await page.getByRole("button", { name: `Edit ${firstName} Test` }).click();
    await expect(page).toHaveURL(/\/employees\/.*\/edit/);
    await expect(
      page.getByRole("heading", { name: "Edit user" }),
    ).toBeVisible();

    // 3. Verify the form is prefilled with the employee's details
    await expect(page.getByPlaceholder("e.g., John")).toHaveValue(firstName);
    await expect(page.getByPlaceholder("e.g., Smith")).toHaveValue("Test");
    await expect(page.getByPlaceholder("e.g., example@gmail.com")).toHaveValue(
      uniqueEmail,
    );
    await expect(page.getByLabel("Password")).toHaveValue("");

    // 4. Attempt to submit with an empty name to check for error handling
    await page.getByPlaceholder("e.g., John").clear();
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Name is required")).toBeVisible();

    // 5. Attempt to submit with an invalid email to check for error handling
    await page.getByPlaceholder("e.g., John").fill(updatedFirstName);
    await page.getByPlaceholder("e.g., example@gmail.com").fill("not-an-email");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Invalid email address")).toBeVisible();

    // 6. Fix the email, save, and verify success toast, redirect, and updated name in the list
    await page.getByPlaceholder("e.g., example@gmail.com").fill(updatedEmail);
    await page.getByRole("button", { name: "Save" }).click();
    await expect(
      page.getByText("Employee account has been updated successfully.", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(page).toHaveURL("/employees");
    await expect(
      page.getByRole("button", { name: `Edit ${updatedFirstName} Test` }),
    ).toBeVisible();
  });
});
