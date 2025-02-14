import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: true
});

export default [
  {
    ignores: [".next/*", "node_modules/*"]
  },
  ...compat.extends("next/core-web-vitals"),
  {
    files: ["**/*.js", "**/*.mjs", "**/*.jsx"],
    rules: {
      "no-unused-vars": "warn",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn"
    },
    settings: {
      react: {
        version: "detect"
      }
    },
    env: {
      browser: true,
      node: true,
      es6: true
    }
  }
];
