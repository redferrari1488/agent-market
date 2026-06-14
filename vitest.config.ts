import { defineConfig } from "vitest/config";
import path from "node:path";

// Юнит-тесты чистых функций (деньги, шифрование, валидация, IP-whitelist,
// telegram-HMAC, reconciler-решение). Без БД/Docker/сети — всё, что требует
// инфраструктуры, тестируется как чистая логика. См. drafts/audit-2026-06-10.md (T2).
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    setupFiles: ["./src/test/setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
