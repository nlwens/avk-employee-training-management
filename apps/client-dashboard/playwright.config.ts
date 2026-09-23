import { defineConfig, devices } from "@playwright/test";
import * as dotenv from "dotenv";

dotenv.config();

const BACKEND_PORT = 3000;
const FRONTEND_HOST = "127.0.0.1";
const FRONTEND_PORT = 4174;
const FRONTEND_URL = `http://${FRONTEND_HOST}:${FRONTEND_PORT}`;

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./test-results",

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 3 : 0,
  workers: process.env.CI ? 1 : 3,

  reporter: [
    ["list"],
    ["html", { outputFolder: "./playwright-report", open: "never" }],
    ["junit", { outputFile: "./test-results/e2e-junit.xml" }],
  ],

  use: {
    baseURL: FRONTEND_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  webServer: [
    {
      name: "backend",
      cwd: "../server",
      command: "npm run start",
      port: BACKEND_PORT,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      name: "frontend",
      command: `npm run preview -- --host ${FRONTEND_HOST} --port ${FRONTEND_PORT}`,
      port: FRONTEND_PORT,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
});
