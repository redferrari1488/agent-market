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
]);

export default eslintConfig;
