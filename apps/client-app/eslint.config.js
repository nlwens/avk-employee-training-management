import { reactConfig } from "@repo/eslint-config/react";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist"]),
  reactConfig({
    tsconfigRootDir: import.meta.dirname,
    project: ["./tsconfig.app.json", "./tsconfig.node.json", "./tsconfig.test.json"],
  }),
]);
