import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import prettierPlugin from "eslint-plugin-prettier/recommended";

/** @param {{ tsconfigRootDir: string, project: string[] }} options */
export function reactConfig({ tsconfigRootDir, project }) {
  return {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      prettierPlugin,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { project, tsconfigRootDir },
    },
    rules: {
      "react-hooks/exhaustive-deps": "error",
    },
  };
}
