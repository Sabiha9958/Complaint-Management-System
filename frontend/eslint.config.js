import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  // Ignore generated build output folders globally
  globalIgnores(["dist", "build", "node_modules"]),

  {
    // Apply to all JS/JSX files
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest", // Latest ECMAScript features
      sourceType: "module",
      ecmaFeatures: { jsx: true }, // JSX support
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    extends: [
      js.configs.recommended, // Standard JS recommended rules
      reactHooks.configs["recommended"], // React hooks linting
      reactRefresh.configs.vite, // Vite React fast-refresh plugin rules
    ],
    rules: {
      // Ignore unused vars starting with uppercase (e.g. React components, constants)
      "no-unused-vars": ["error", { varsIgnorePattern: "^[A-Z_]" }],

      // Additional common React rules can be added here
    },
  },
]);
