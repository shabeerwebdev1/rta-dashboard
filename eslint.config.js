import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReactConfig from "eslint-plugin-react/configs/recommended.js";
import reactRefresh from "eslint-plugin-react-refresh";
import hooksPlugin from "eslint-plugin-react-hooks";
import prettierConfig from "eslint-config-prettier";

export default [
  { files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"] },
  {
    languageOptions: {
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: { ...globals.browser, ...globals.node },
    },
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ...pluginReactConfig,
    settings: {
      react: { version: "detect" },
    },
    rules: {
      ...pluginReactConfig.rules,
      "react/react-in-jsx-scope": "off",
    },
  },
  {
    plugins: {
      "react-refresh": reactRefresh,
      "react-hooks": hooksPlugin,
    },
    rules: {
      ...hooksPlugin.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "react-hooks/exhaustive-deps": "off",
      "react-refresh/only-export-components": "off",
    },
  },
  prettierConfig, // Add this at the end to disable conflicting rules
  {
    ignores: [
      "node_modules/",
      "dist/",
      "build/",
      ".next/",
      ".nuxt/",
      "**/*.config.js",
      "**/*.config.ts",
      "vite.config.ts",
      ".husky/",
    ],
  },
];
