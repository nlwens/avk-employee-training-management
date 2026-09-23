import { expect, type APIRequestContext, type Page } from "@playwright/test";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const API_URL = process.env.VITE_API_URL ?? "http://localhost:3000";

/** Shared lock for settings tests that change the admin password. */
const ADMIN_PASSWORD_LOCK_FILE = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  ".settings-test.lock",
);

/** Password set by the "change password successfully" E2E test. */
export const E2E_CHANGED_PASSWORD = "newpassword";

export async function loginAsAdmin(
  page: Page,
  password?: string,
  options?: { skipLock?: boolean },
) {
  const shouldLock = !password && !options?.skipLock;

  if (shouldLock) {
    await acquireAdminPasswordLock();
  }

  try {
    if (!password) {
      await resetAdminPassword(page.request);
    }

    await page.goto("/login");

    await page.evaluate(() => {
      localStorage.clear();
    });

    await page
      .getByPlaceholder("Enter your email...")
      .fill(process.env.ADMIN_EMAIL!);
    await page
      .getByPlaceholder("Enter your password...")
      .fill(password ?? process.env.ADMIN_PASSWORD!);

    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page).toHaveURL("/", { timeout: 10_000 });
  } finally {
    if (shouldLock) {
      await releaseAdminPasswordLock();
    }
  }
}

/**
 * Logs out through the UI so caches are cleared.
 */
export async function logout(page: Page) {
  await page
    .getByRole("button", { name: "Open navigation menu" })
    .first()
    .click();
  await page.getByRole("button", { name: "Logout" }).click();
  await expect(page).toHaveURL("/login");
}

export async function getAdminToken(
  request: APIRequestContext,
  password = process.env.ADMIN_PASSWORD!,
): Promise<string> {
  const res = await request.post(`${API_URL}/tokens`, {
    data: {
      email: process.env.ADMIN_EMAIL!,
      password,
    },
  });

  if (!res.ok()) {
    throw new Error("Failed to obtain admin token");
  }

  return (await res.json()).accessToken;
}

export function getUserIdFromToken(token: string): string {
  const payload = JSON.parse(
    Buffer.from(token.split(".")[1], "base64").toString(),
  ) as { sub: string };

  return payload.sub;
}

export async function resetAdminPassword(
  request: APIRequestContext,
  currentPassword = E2E_CHANGED_PASSWORD,
): Promise<void> {
  const targetPassword = process.env.ADMIN_PASSWORD!;

  try {
    await getAdminToken(request, targetPassword);
    return;
  } catch {
    // Password was left as currentPassword by a previous run.
  }

  const token = await getAdminToken(request, currentPassword);

  const res = await request.patch(`${API_URL}/users/@me`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      currentPassword,
      password: targetPassword,
    },
  });

  if (!res.ok()) {
    throw new Error(`Failed to reset admin password: ${res.status()}`);
  }
}

export async function acquireAdminPasswordLock(): Promise<void> {
  const maxWaitMs = 120_000;
  const start = Date.now();

  while (Date.now() - start < maxWaitMs) {
    try {
      await fs.writeFile(ADMIN_PASSWORD_LOCK_FILE, `${process.pid}`, {
        flag: "wx",
      });
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  throw new Error("Timed out waiting for admin password lock");
}

export async function releaseAdminPasswordLock(): Promise<void> {
  try {
    await fs.unlink(ADMIN_PASSWORD_LOCK_FILE);
  } catch {
    // Lock may already have been released.
  }
}
