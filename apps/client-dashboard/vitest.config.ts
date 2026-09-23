import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: "jsdom",
      setupFiles: "./component-test/setup.ts",
      include: ["component-test/**/*.{test,spec}.{ts,tsx}"],
      exclude: ["e2e/**"],
      reporters: ["default", "junit"],
      outputFile: {
        junit: "./test-results/component-junit.xml",
      },
      coverage: {
        provider: "v8",
        reporter: ["text", "html", "lcov"],
        reportsDirectory: "./coverage",
      },
    },
  }),
);
