# Project Context

## Current Goal
AI Agent Marketplace — маркетплейс готовых AI-агентов, работающих в Docker-контейнерах 24/7. Подробная архитектура в `CLAUDE.md`.

## Current Status (2026-04-07)

**Завершённые дни:**
- Day 1–4: лендинг, каталог, карточка агента, дашборд покупателя, Setup Wizard, AES-256-GCM шифрование, email OTP, отзывы, Header с user-меню, seed.sql с 3 агентами.

**Миграция на self-hosted (выполнено 2026-04-07):**
- Supabase полностью удалён (@supabase/ssr, @supabase/supabase-js, stripe).
- Установлены: drizzle-orm, drizzle-kit, pg, better-auth.
- Создана Drizzle-схема (src/lib/db/schema.ts) — все таблицы из CLAUDE.md.
- Создан Drizzle-клиент (src/lib/db.ts).
- BetterAuth настроен (src/lib/auth.ts) — Google OAuth, GitHub OAuth, email/password.
- BetterAuth API route (src/app/api/auth/[...all]/route.ts).
- Auth client (src/lib/auth-client.ts) — signIn, signUp, signOut, useSession.
- Auth server helper (src/lib/auth-server.ts) — getSession(), getUser().
- Все pages и API routes переписаны: supabase.from() → Drizzle запросы.
- middleware.ts переписан: BetterAuth session cookie вместо Supabase.
- LoginForm: email/password вместо OTP.
- OAuthButtons: BetterAuth signIn.social() вместо Supabase signInWithOAuth().
- TelegramLoginButton: убран Supabase verifyOtp, прямой вызов /api/auth/telegram.
- /auth/callback удалён (BetterAuth обрабатывает OAuth сам).
- Миграция SQL без RLS (db/migration.sql) — BetterAuth таблицы + бизнес-таблицы.
- seed.sql скопирован в db/seed.sql.
- Dockerfile (multi-stage, standalone Next.js).
- docker-compose.yml (postgres + app + nginx).
- nginx.conf (reverse proxy).
- next.config.ts: output: "standalone".
- drizzle.config.ts создан.
- npm run build — проходит успешно.

## Active Decisions

### Архитектура
- **Self-hosted:** BetterAuth + Drizzle ORM + PostgreSQL в Docker. Supabase полностью удалён.
- **Auth:** BetterAuth (Google OAuth, GitHub OAuth, email/password, Telegram Login Widget).
- **ORM:** Drizzle ORM с node-postgres (pg).
- **БД:** PostgreSQL 16 в Docker, volume для данных, порт только localhost.
- **Деплой:** Docker Compose (postgres + next.js + nginx), всё на одном VPS.
- **RLS убран** — проверка прав в API routes через getUser() + db query.
- **Комиссия платформы:** 15%.
- **Цены в БД:** копейки RUB.

### VPS
- IP: 78.17.150.12 (AdminVPS, Германия, Ubuntu 24.04)
- SSH: openssh-server установлен и запущен через VNC-консоль.
- **Проблема SSH:** порт 22 не доступен извне (провайдер или iptables). Нужно проверить iptables -L -n и/или связаться с AdminVPS поддержкой.
- Логин: root, пароль: в панели AdminVPS.

### Telegram Bot для Login Widget
- Бот создан: @agentmarket0_bot
- /setdomain не установлен (нужен домен/деплой)

## Next Tasks (в порядке приоритета)

1. **SSH доступ к VPS** — решить проблему с портом 22 (iptables или поддержка AdminVPS).
2. **Деплой на VPS:** git clone → docker-compose up → проверить http://78.17.150.12
3. **Env файл на VPS:** DATABASE_URL, BETTER_AUTH_SECRET, ENCRYPTION_KEY, OAuth credentials.
4. **Day 5:** lib/docker.ts (dockerode), подключение к API start/stop/restart/logs, LogViewer.
5. **Day 6:** Docker-образы для 3 стартовых агентов.
6. **Day 7:** Панель продавца.
7. **Day 8:** Админка.
8. **Day 9:** E2E, error states, SEO.
9. **Day 10:** Домен, SSL (Let's Encrypt + Nginx).
10. **После Day 10:** Платежи (YooKassa + Cryptomus).

## Blockers

- SSH к VPS не работает извне (порт 22 заблокирован на уровне провайдера или iptables). Нужно проверить.
- YooKassa Маркетплейс: заявка не подана.
- Домен не куплен — без него нет SSL и Telegram Login.

## Current Workflow
- Start work inside the project directory with `startproj`.
- End work inside the project directory with `endproj`.
- Sync between Windows and MacBook happens through normal git push/pull.

## Important Files
- `CLAUDE.md` — полная архитектура, схема БД, стек, флоу, стиль кода.
- `PROJECT_CONTEXT.md` — текущий статус, решения, блокеры (этот файл).
- `db/migration.sql` — каноническая схема БД (self-hosted, без RLS).
- `db/seed.sql` — 3 стартовых агента.
- `src/lib/db/schema.ts` — Drizzle ORM схема.
- `src/lib/auth.ts` — BetterAuth конфигурация.
- `docker-compose.yml` — Postgres + Next.js + Nginx.

## Notes For Claude And Codex
- Read `CLAUDE.md` and `PROJECT_CONTEXT.md` before making important changes.
- Supabase полностью удалён. Не используй @supabase/* пакеты.
- Auth: BetterAuth (src/lib/auth.ts). Сессии через getUser() из src/lib/auth-server.ts.
- БД: Drizzle ORM (src/lib/db.ts). Схема в src/lib/db/schema.ts.
- profiles.id — text (не uuid), ссылается на BetterAuth user.id.
