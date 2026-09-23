import { expect, test } from "@playwright/test";
import jwt from "jsonwebtoken";

const createJwt = (
  payload: Record<string, unknown>,
  secret: string = "test-secret",
) => {
  return jwt.sign(payload, secret, {
    algorithm: "HS256",
  });
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let apiContext: any;

test.beforeAll(async ({ playwright }) => {
  apiContext = await playwright.request.newContext({
    baseURL: "http://localhost:3000",
    extraHTTPHeaders: {
      "Content-Type": "application/json",
    },
  });
});

test.afterAll(async () => {
  await apiContext.dispose();
});

test.describe("Administrator login page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("shows an error for invalid administrator credentials", async ({
    page,
  }) => {
    await page.getByPlaceholder("Enter your email...").fill("wrong@avk.nl");
    await page.getByPlaceholder("Enter your password...").fill("wrongpass");

    await page.getByRole("button", { name: "Log in" }).click();

    await expect(
      page.getByText("The email or password is incorrect."),
    ).toBeVisible();
  });

  test("shows an error when a non-admin user tries to log in", async ({
    page,
  }) => {
    await page.route("**/tokens", async (route) => {
      const request = route.request();

      if (request.method() === "POST") {
        const mockPayload = {
          sub: "user123",
          name: "Regular",
          surname: "User",
          admin: false,
        };

        const mockToken = createJwt(mockPayload);

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          json: { accessToken: mockToken },
        });
      } else {
        await route.continue();
      }
    });

    await page.getByPlaceholder("Enter your email...").fill("user@example.com");

    await page.getByPlaceholder("Enter your password...").fill("password123");

    await page.getByRole("button", { name: "Log in" }).click();

    await expect(
      page.getByText("Only administrators can log in"),
    ).toBeVisible();
  });

  test("redirects to dashboard after valid mock administrator login", async ({
    page,
  }) => {
    await page
      .getByPlaceholder("Enter your email...")
      .fill(process.env.ADMIN_EMAIL!);
    await page
      .getByPlaceholder("Enter your password...")
      .fill(process.env.ADMIN_PASSWORD!);

    await page.getByRole("button", { name: "Log in" }).click();

    await expect(page).toHaveURL("/", { timeout: 10000 });
    await expect(page.getByText("Total employees")).toBeVisible();
  });
});
