// Фиктивные секреты для тестового окружения. Нужны модулям, которые читают env
// при импорте (db.ts создаёт Pool, но не коннектится до первого запроса) или в
// чистых функциях (encryption.ts). Значения заведомо тестовые, не настоящие.
process.env.DATABASE_URL ??= "postgres://test:test@localhost:5432/test";
process.env.ENCRYPTION_KEY ??= "0".repeat(64); // 32 байта в hex
process.env.BETTER_AUTH_SECRET ??= "test-secret-not-real";
