import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";
import prettierPlugin from "eslint-plugin-prettier/recommended";

/** @param {{ tsconfigRootDir?: string, project?: string } | undefined} options */
export function baseConfig({ tsconfigRootDir, project } = {}) {
  return {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      prettierPlugin,
    ],
    languageOptions: {
      globals: { ...globals.browser, React: "readonly", JSX: "readonly" },
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: "module",
        ...(tsconfigRootDir && { tsconfigRootDir }),
        ...(project && { project }),
      },
    },
    rules: {
      "react-hooks/exhaustive-deps": "error",
    },
  };
}
