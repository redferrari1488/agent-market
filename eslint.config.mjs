import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Не код приложения: drafts/ — исходники для рендера launch-картинок,
    // output/ — сгенерированные артефакты. Линтить их незачем, а их шум
    // (десятки jsx-no-undef) маскировал реальные ошибки в src/.
    "drafts/**",
    "output/**",
  ]),
  // Подчёркивание = намеренно неиспользуемое (отброшенный параметр, rest-sibling
  // при omit ключа). Конвенция уже используется в коде — учим линтер её уважать.
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
    },
  },
]);

export default eslintConfig;
