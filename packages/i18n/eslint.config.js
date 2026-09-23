import { baseConfig } from "@repo/eslint-config/base";
import { defineConfig, globalIgnores } from "eslint/config";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig([
  globalIgnores(["eslint.config.js", "dist", "coverage"]),
  baseConfig({
    tsconfigRootDir: __dirname,
    project: "./tsconfig.json",
  }),
  {
    files: ["src/index.ts"],
    rules: {
      "@typescript-eslint/triple-slash-reference": "off",
    },
  },
]);
