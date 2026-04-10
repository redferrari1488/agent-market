# Project Context

## Current Goal
AI Agent Marketplace — маркетплейс готовых AI-агентов, работающих в Docker-контейнерах 24/7. Подробная архитектура в `CLAUDE.md`.

## Current Status (2026-04-11, late)

**Phase A Site Polish (в процессе):**
- Dev checkout: `/api/checkout` создаёт subscription в `pending_setup` без реальной оплаты → редирект на `/dashboard/agents/<id>` → Setup Wizard → deploy. Разблокирован end-to-end flow до появления YooKassa/Cryptomus.
- PurchaseButton: `alert()` → fetch + loading/error state + редирект анона на /login.
- Footer: `#` → `/about`, `/privacy`, `/terms` (созданы страницы-черновики).
- Удалён orphan `src/app/page.backup.tsx`.
- `robots.ts` + `sitemap.ts` (динамический — включает published-агентов).
- **Не сделано в этой сессии:** OG-изображение, favicon, реальный тест на VPS, mobile pass.

## Previous Status (2026-04-11)

**Завершённые дни:**
- Day 1–4: лендинг, каталог, карточка агента, дашборд покупателя, Setup Wizard, AES-256-GCM шифрование, email OTP, отзывы, Header с user-меню, seed.sql с 3 агентами.
- Day 5: Docker agent management — src/lib/docker.ts (dockerode), API routes start/stop/restart/logs, LogViewer компонент с автообновлением.
- Day 7: Панель продавца — seller dashboard, AgentForm (create/edit), SetupSchemaBuilder, API CRUD, "стать продавцом", статистика.
- Day 8: Админка — модерация агентов (approve/reject), статистика платформы, API routes.
- Day 9: SEO metadata (все страницы), error/loading/not-found states, OG-теги.
- UI overhaul: глубокая тёмная тема (#06060a), glow-эффекты, glassmorphism, bento-grid лендинг, обновлённые AgentCard/Header/Footer.
- UI polish (2026-04-10): все внутренние страницы приведены к единому стилю deep dark + glow. Обновлены /agents (AgentFilters + hero glow), /agents/[slug] (AgentDetails + PurchaseButton с градиентом), /auth/login (glassmorphism card + gradient button), /dashboard (subscription cards с hover glow), /dashboard/agents/[id] (SetupWizard, ManageView, LogViewer), /seller (StatsCards, список агентов, BecomeSellerPage), /seller/agents/new + edit (AgentForm sections-as-cards, SetupSchemaBuilder), /admin (stats + ModerationCard).
- Auth fix: BetterAuth таблицы (user/session/account/verification) добавлены в Drizzle schema, databaseHooks для авто-создания profile при регистрации.
- **Day 6 стартован и поставлен на паузу (2026-04-11):** создан `agents-src/ai_provider.py` (универсальный переключатель Claude/OpenAI для своих агентов) и скаффолд `agents-src/ai-support-bot/` — обёртка над `father-bot/chatgpt_telegram_bot` (MIT) через clone-at-build подход. Dockerfile + entrypoint.sh (генерит config.yml + config.env из env-переменных, патчит upstream chat_modes.yml) + docker-compose.yml (bot + mongo, 256MB/0.5 CPU на каждый). Протестировано на VPS: билд прошёл, контейнеры стартуют, OpenAI-ключ рабочий, бот отвечает через Telegram. Обёртка функциональна. Дальнейшая работа над ботами приостановлена — решение ниже.

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

**Деплой на VPS (выполнено 2026-04-08):**
- Docker + Docker Compose установлены.
- Репо склонировано в /opt/agent-market.
- .env создан (BETTER_AUTH_SECRET, ENCRYPTION_KEY, POSTGRES_PASSWORD сгенерированы).
- docker compose up -d — postgres + app + nginx работают.
- Сайт доступен по http://77.239.104.149 (публично) и http://100.79.2.56 (Tailscale).

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
- Провайдер: u1host (бывший AdminVPS отменён)
- Публичный IP: 77.239.104.149
- Tailscale IP: 100.79.2.56
- Ubuntu 24.04, kernel 6.8.0-79
- SSH: по ключу через Tailscale (root@100.79.2.56)
- Docker 29.4.0 + Compose 5.1.1
- Проект: /opt/agent-market

### Telegram Bot для Login Widget
- Бот создан: @agentmarket0_bot
- /setdomain не установлен (нужен домен/деплой)

## Active Decision (2026-04-11): сайт → боты, а не наоборот

Приостанавливаем работу над стартовыми ботами (Day 6) до того, как сайт будет **production-ready**. Причина: пустые кнопки, нерабочий OAuth, неотлаженные флоу = маркетплейс на сломанном фундаменте, даже если в бэке 6 идеальных агентов. Приоритет — сначала довести фронт до состояния «юзер может дойти от лендинга до оплаты без единой ошибки», потом уже наполнять каталог ботами.

Скаффолд `ai-support-bot` остаётся на VPS (`docker compose ps` в `/opt/agent-market/agents-src/ai-support-bot/` — бот + mongo работают, ресурсов ест минимум). Возвращаемся к нему после Day 10.

## Next Tasks (в порядке приоритета)

1. ~~SSH доступ к VPS~~ — решено через Tailscale.
2. ~~Деплой на VPS~~ — выполнено.
3. ~~Day 5~~ — docker.ts, API routes, LogViewer.
4. ~~Day 7~~ — панель продавца.
5. ~~Day 8~~ — админка.
6. ~~Day 9~~ — SEO, error/loading states, UI overhaul.
7. ~~UI polish (продолжение)~~ — 2026-04-10.
8. ~~Day 6 start~~ — ai-support-bot scaffold протестирован, поставлен на паузу (2026-04-11).
9. **СЕЙЧАС: Инвентаризация сайта** — пройти все страницы, выписать все пустые кнопки, нерабочие ссылки, недоделанные флоу, визуальные баги. Отдать список пользователю, получить приоритеты.
10. **Site polish:** починить всё из инвентаря.
11. **OAuth creds:** Google + GitHub client_id/secret в .env на VPS.
12. **Day 10:** Домен + SSL (Let's Encrypt + Nginx).
13. **Email verification:** SMTP (Resend) + BetterAuth email verification.
14. **Платежи:** YooKassa + Cryptomus.
15. **Возврат к Day 6:** достроить обёртки #4 Website Monitor, #5 News Digest, свои агенты #2/#3/#6.

## Blockers

- YooKassa Маркетплейс: заявка не подана.
- Домен не куплен — без него нет SSL, Telegram Login и email verification.
- Google/GitHub OAuth credentials не настроены в .env на VPS (сайт работает, но OAuth-кнопки не функциональны).
- Email verification отключена — регистрация без подтверждения. Нужен SMTP (Resend) + домен.
- ~~UI polish не завершён~~ — завершено 2026-04-10, все страницы в едином стиле.

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
