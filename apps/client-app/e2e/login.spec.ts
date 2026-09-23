import { expect, test } from "@playwright/test";

test.describe("Login Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("displays the login form", async ({ page }) => {
    await expect(page.locator("text=Login to account")).toBeVisible();
    await expect(page.getByPlaceholder("Enter your email...")).toBeVisible();
    await expect(page.getByPlaceholder("Enter your password...")).toBeVisible();
    await expect(page.getByRole("button", { name: "Log in" })).toBeVisible();
  });

  test("shows validation errors on empty submission", async ({ page }) => {
    await page.getByRole("button", { name: "Log in" }).click();

    await expect(page.getByText("Invalid email address")).toBeVisible();
    await expect(page.getByText("Password is required")).toBeVisible();
  });

  test("can type in email and password", async ({ page }) => {
    const emailInput = page.getByPlaceholder("Enter your email...");
    const passwordInput = page.getByPlaceholder("Enter your password...");

    await emailInput.fill("test@example.com");
    await passwordInput.fill("password123");

    await expect(emailInput).toHaveValue("test@example.com");
    await expect(passwordInput).toHaveValue("password123");
  });

  test("toggles password visibility", async ({ page }) => {
    const passwordInput = page.getByPlaceholder("Enter your password...");
    const toggleButton = page.locator("button").filter({
      has: page.locator("svg"),
    });

    await expect(passwordInput).toHaveAttribute("type", "password");

    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute("type", "text");

    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute("type", "password");
  });

  test("successfully logs in with admin credentials", async ({ page }) => {
    await page
      .getByPlaceholder("Enter your email...")
      .fill(process.env.ADMIN_EMAIL!);
    await page
      .getByPlaceholder("Enter your password...")
      .fill(process.env.ADMIN_PASSWORD!);

    await page.getByRole("button", { name: "Log in" }).click();

    await expect(page).toHaveURL("/", { timeout: 10000 });
  });

  test("shows error message with invalid credentials", async ({ page }) => {
    await page
      .getByPlaceholder("Enter your email...")
      .fill("wrong@example.com");
    await page
      .getByPlaceholder("Enter your password...")
      .fill("wrong_password");

    await page.getByRole("button", { name: "Log in" }).click();

    await expect(
      page.getByText("The email or password is incorrect."),
    ).toBeVisible();
  });
});
