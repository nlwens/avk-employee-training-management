import { defineConfig, devices } from "@playwright/test";
import * as dotenv from "dotenv";

dotenv.config();

const BACKEND_PORT = 3000;
const FRONTEND_HOST = "127.0.0.1";
const FRONTEND_PORT = 4173;
const FRONTEND_URL = `http://${FRONTEND_HOST}:${FRONTEND_PORT}`;
const BACKEND_URL = `http://${FRONTEND_HOST}:${BACKEND_PORT}`;

process.env.PLAYWRIGHT_BACKEND_URL = BACKEND_URL;
process.env.PLAYWRIGHT_FRONTEND_URL = FRONTEND_URL;

const backendCommand = process.env.CI
  ? "npm run seed && npm run start"
  : "npm run start";

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
    serviceWorkers: "block",
  },

  webServer: [
    {
      name: "backend",
      cwd: "../server",
      command: backendCommand,
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
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "mobile-safari",
      use: { ...devices["iPhone 12"] },
    },
  ],
});
