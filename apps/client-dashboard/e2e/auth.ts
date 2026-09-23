import { expect, type APIRequestContext, type Page } from "@playwright/test";

const API_URL = process.env.VITE_API_URL ?? "http://localhost:3000";

/**
 * Obtains a raw JWT token via the API.
 */
export async function getAdminToken(
  request: APIRequestContext,
): Promise<string> {
  const res = await request.post(`${API_URL}/tokens`, {
    data: {
      email: process.env.ADMIN_EMAIL!,
      password: process.env.ADMIN_PASSWORD!,
    },
  });
  return (await res.json()).accessToken;
}

export async function loginAsAdmin(page: Page, newPassword?: string) {
  await page.goto("/login");

  await page.evaluate(() => {
    localStorage.clear();
  });

  await page
    .getByPlaceholder("Enter your email...")
    .fill(process.env.ADMIN_EMAIL!);
  await page
    .getByPlaceholder("Enter your password...")
    .fill(newPassword || process.env.ADMIN_PASSWORD!);

  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL("/", { timeout: 10000 });
}
