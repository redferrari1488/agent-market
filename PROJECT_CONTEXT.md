# Project Context

## Current Status (2026-05-15 - pre-launch tech audit, block 1)

**Live audit of prod (hireon.agency on commit `136eb72`):**

- OpenRouter live curl: `/api/v1/models` -> HTTP 200 (token valid), `/api/v1/chat/completions` -> HTTP 402 `Insufficient credits. This account never purchased credits.` Это значит цепочка «покупка -> контейнер -> AI-ответ» физически не работает на проде. В БД 0 active подписок (3 paused, 8 pending_setup) -> end-to-end никогда не отрабатывал.
- Single point of failure: `agents-src/ai_provider.py` шлёт один запрос без retry/fallback. Падение OpenRouter -> ложатся все агенты маркетплейса.
- Cost tracking отсутствует: расход AI-токенов нигде не сводится с подпиской.
- Env var на VPS зовётся `OPENROUTER_API_KEY` (не `OPENAI_API_KEY`). Внутри контейнера маппится в `OPENAI_API_KEY` + `OPENAI_BASE_URL=https://openrouter.ai/api/v1` через `src/lib/docker.ts:buildEnv`. Документация в CLAUDE.md/.env.local.example про `OPENAI_API_KEY` устарела.
- YooKassa активна в БОЕВОМ режиме: `YOOKASSA_SHOP_ID` + `YOOKASSA_SECRET_KEY` (`live_*` префикс) в `/opt/agent-market/.env`. Checkout НЕ dev-stub.
- Cryptomus НЕ активирован: `CRYPTOMUS_*` env отсутствует. Webhook 503, payout-retry timer спамит 503 каждые 6 часов (безвредно, но шум).
- Systemd timers все живы: `hireon-db-backup.timer` (03 UTC ежедневно, 7-дневный retention в `/var/backups/hireon/`, последний backup сегодня 17 KB), `hireon-yookassa-recurring.timer` (08 UTC), `hireon-cryptomus-payout-retry.timer` (каждые 6 ч).
- Docker isolation работает: `CapDrop:["ALL"]`, `no-new-privileges:true`, `ReadonlyRootfs` для четырёх Python-агентов, `PidsLimit:512`, swap выключен (`MemorySwap=Memory`), per-class memory/CPU limits.
- Webhook safety: YooKassa IP-whitelist реально блокирует (POST без YooKassa IP -> 403); idempotency-checks в обоих webhook handlers по `providerPaymentId` (+ `expiresAt` для YooKassa).
- Поток покупки: webhook payment.succeeded НЕ деплоит контейнер (статус остаётся `pending_setup`). Контейнер деплоится только из `POST /api/subscriptions/[id]/start` после Setup Wizard. by-design.
- Capacity: load 0, disk 53%, RAM 27% used / 73% free+cache, swap трогается слегка (норма). 37 дней uptime.

**Cleanup в этой же сессии:** удалён сторонний `tracking_bot` (Telegram bot + Postgres) из `/opt/tracking_bot` - контейнеры, volume, image, папка. Освободило ~140 MB RAM.

**План блока 2 (фиксы перед security review):**
1. (P0, действие юзера) Пополнить OpenRouter ($5 для тестов; $20-50 перед рекламой + monthly spend limit + auto top-up).
2. (P0, ~30 строк Python) Fallback в `agents-src/ai_provider.py`: при 5xx/402/429 от OpenRouter -> Anthropic direct API (`anthropic/claude-sonnet-4-6` через `https://api.anthropic.com/v1/messages`). Одинаковая модель, тот же контракт качества.
3. (P1) Минимальный cost tracking: `agent_logs` строка после каждого AI-вызова с `usage.total_tokens` + расчёт стоимости.
4. (P3) Отключить `hireon-cryptomus-payout-retry.timer` пока `CRYPTOMUS_*` пустой (убирает шум 503).
5. (P3) Обновить CLAUDE.md / `.env.local.example`: `OPENROUTER_API_KEY` вместо `OPENAI_API_KEY`.
6. E2E на проде после фиксов: Telegram login -> покупка YooKassa test mode -> Setup Wizard -> старт контейнера -> AI-ответ виден в логах.

## Current Status (2026-04-25 - commission/env cleanup)

**Local cleanup before the next production pass:**
- Commission language is normalized to the current model: platform takes **12%** only from `seller_price`; seller receives **88%** of their own price; `compute_price` stays with the platform as hosting passthrough.
- `docker-compose.yml` now forwards YooKassa and Cryptomus env vars into the `app` container. Payment providers still stay inactive until real credentials are added to `/opt/agent-market/.env` on the VPS.
- Stale auth notes and mojibake in this file were cleaned. Current auth surface is only Telegram, GitHub, and Google; `emailAndPassword.enabled` remains required internally for Telegram login.
- Design work from the hero/process/sidebar pass is intentionally left untouched for now.

## Current Status (2026-04-23 - BetterAuth build warning triage)

**Checked on VPS on 2026-04-23; no runtime auth regression found:**
- Verified `/opt/agent-market/.env` contains a non-default `BETTER_AUTH_SECRET`, and the running `agent-market-app-1` container also has a 64-character non-default `BETTER_AUTH_SECRET` in its runtime environment.
- Verified the live auth stack is responsive at runtime: `GET http://127.0.0.1:3000/api/auth/get-session` on the VPS returns `200`.
- Reproduced the noisy BetterAuth message only during image build on the VPS with `DOCKER_BUILDKIT=0 docker compose build app`: BetterAuth reports "You are using the default secret" while Next is collecting page data in the builder stage.
- Current root cause is build-stage env isolation, not a live runtime misconfiguration: `docker-compose.yml` injects `BETTER_AUTH_SECRET` into the running `app` service, but the Dockerfile builder stage receives only `NEXT_PUBLIC_APP_URL`, so `npm run build` sees no auth secret and BetterAuth falls back to its default during build evaluation.
- Minimal next step if the warning must be silenced later: inject a dedicated non-production build-only secret into the builder stage or guard auth initialization during build. Do **not** pass the real production `BETTER_AUTH_SECRET` into Docker build args just to silence the log.

## Current Status (2026-04-23 - settings/delete UX cleanup)

**Pushed and deployed to VPS on 2026-04-23:**
- Account deletion is no longer exposed on the main `/dashboard`. The destructive flow moved to a dedicated `/dashboard/settings` page with its own "Опасная зона" section.
- Dashboard now links to account settings, and authenticated header menus (desktop + mobile) also expose the new settings page.
- Telegram-only users no longer see synthetic BetterAuth emails like `tg_<id>@telegram.local` in the delete flow. Those accounts now confirm deletion with the phrase `УДАЛИТЬ` plus the existing fresh-session requirement.
- Email/password users keep the stricter path: exact current email confirmation plus password re-auth when applicable.
- Non-blocking auth-page CSP cleanup was included in the same batch: the request nonce from `src/proxy.ts` is now passed into `next-themes` through `src/app/layout.tsx` and `src/components/layout/ThemeProvider.tsx`.
- Post-deploy smoke is green for public routes: `https://hireon.agency/` and `https://hireon.agency/auth/login` return `200`, unauthenticated `https://hireon.agency/dashboard/settings` redirects to `/auth/login?next=%2Fdashboard%2Fsettings`, and Playwright confirms the login page renders without the previous CSP warning. The remaining browser console error is only `404 /favicon.ico`.

## Current Status (2026-04-23 - auth cookie outage hotfix)

**Production outage fixed and deployed (pushed and deployed to VPS on 2026-04-23):**
- Reproduced the prod outage only for requests carrying a BetterAuth session cookie: anonymous `curl` requests still render `200`, but a desktop browser with `__Secure-better-auth.session_token` was receiving a document-level `500` and Next's "This page couldn't load" error UI.
- The most likely prod root cause is schema drift around `profiles.deleted_at`: the latest `getUser()` change queries that column for authenticated requests, so an older VPS database schema can brick all logged-in page renders while guest pages continue to work.
- Added a narrow fallback in `src/lib/auth-server.ts`: if Postgres returns `42703` for `profiles.deleted_at`, `getUser()` now logs the schema gap, temporarily falls back to the session user, and retries the soft-delete guard after a short TTL instead of turning every authenticated request into a `500`.
- Local verification after the hotfix was green: `npx tsc --noEmit` and `npm run build` both passed before deploy.
- The required SQL migration was also applied on the VPS, so soft-deleted accounts are filtered server-side without fallback-only behavior.

## Current Goal
AI Agent Marketplace — маркетплейс готовых AI-агентов, работающих в Docker-контейнерах 24/7. Подробная архитектура в `CLAUDE.md`.

## Current Status (2026-04-22 - Checkout/account hardening)

**Deployed follow-up batch after security closeout (pushed and deployed to VPS on 2026-04-22):**
- Closed the HTTP/IP fallback gap in `infra/nginx/nginx.conf`: plain HTTP on the raw IP now redirects to `https://hireon.agency`, ACME challenge stays reachable over HTTP, and a dedicated `443 default_server` rejects SNI mismatch traffic. Verification is recorded in `infra/security/http-redirect-fix.md`.
- Normalized checkout currency handling across the payment flow: checkout now resolves the real payment currency explicitly, Cryptomus no longer hardcodes RUB, subscription snapshots store amount/sellerPrice/currency in the actual charge currency, legacy subscriptions default to `RUB`, and seller/admin revenue views aggregate by currency instead of mixing RUB and USD.
- Added self-service account deletion: `POST /api/account/delete` now requires re-auth, soft-deletes profiles via `deleted_at`, writes `audit_logs`, cancels the user subscriptions, removes Docker container/volume artifacts, deletes BetterAuth provider accounts/sessions, and exposes the flow in `/dashboard` plus `/privacy`.
- Follow-up review fix before deploy: `src/lib/auth-server.ts` now treats soft-deleted profiles as signed-out for all server routes, and `/api/account/delete` explicitly bypasses BetterAuth cookie cache plus clears auth cookies in the response so deleted accounts cannot linger behind the 5-minute session cache.
- Latest local verification for the account-deletion batch is green: `npx tsc --noEmit` and `npm run build` both pass. The build still needs unrestricted network because `next/font` fetches Google Fonts during production build.
- VPS smoke after deploy: `https://hireon.agency/` and `https://hireon.agency/auth/login` return `200`, raw `http://77.239.104.149/` redirects to `https://hireon.agency/`, and raw `https://77.239.104.149/` is blocked. `GET /api/payments/providers` currently returns `[]`, so payment-provider credentials are still not configured on the VPS.

## Current Status (2026-04-22 - Security closeout)

**Security closeout continuation (local, committed in parts, not pushed):**
- Recorded an internal accepted-risk decision for `ai-support-bot` in `infra/security/trivy-remediation-2026-04-21.md`: the remaining `h11` `CVE-2025-43859` is treated as non-applicable for the current marketplace runtime because the container does not expose an inbound HTTP listener and operates as an outbound client to Telegram + AI APIs.
- Reassessment trigger for that residual finding is explicit: rerun on the next Trivy review or when upstream can move off `python-telegram-bot==20.1` to a dependency chain that permits `httpcore 1.x` / `h11 0.16+`.
- Gate 3 closed: internal `subscriptions.config` metadata now uses the `_meta_` prefix, recurring payment failures moved to `_meta_recurring_failures`, legacy `recurring_failures` stays readable during rollout, and a one-off SQL migration was added under `db/migrations/`.

## Previous Status (2026-04-21 - Security continuation)

**Security continuation after Claude handoff (build-verified, not pushed):**
- Added build-time `NEXT_PUBLIC_APP_URL` propagation in `Dockerfile` / `docker-compose.yml` and removed the unsafe localhost fallback from `src/app/sitemap.ts`; this fixes the prod `sitemap.xml` leak once deployed.
- Adjusted Nginx fallback `limit_req` zones to stay looser than the app-layer proxy limits instead of duplicating them one-to-one.
- Added `infra/fail2ban/jail.local` + README; initial check found `fail2ban.service` missing, and the later install/enable is recorded below.
- Added `infra/security/secrets-check-2026-04-21.md`; checked the VPS and confirmed `BETTER_AUTH_SECRET` exists once and is 64 hex chars.
- Added `infra/security/encryption-key-rotation.md`.
- Added `infra/security/trivy-2026-04-21.md` and `npm run scan:images`; the initial baseline scan found HIGH findings across shipped images and a CRITICAL Python finding (`h11`) in `ai-support-bot-bot:latest`.
- Added `infra/security/trivy-remediation-2026-04-21.md`: rebuilt test images for `content-writer`, `competitor-monitor`, `news-digest-bot`, `review-responder-2gis`, and `website-monitor` scan clean after Dockerfile remediation; `ai-support-bot` keeps one documented accepted-risk residual (`h11`) because upstream still pins the older PTB/httpcore chain.
- Installed and enabled `fail2ban` on the VPS; verification recorded in `infra/security/fail2ban-2026-04-21.md`.
- Fixed `src/lib/docker.ts` so agent deploys decrypt per-key values from `subscriptions.config` and skip internal recurring-failure metadata instead of passing encrypted values through to containers.
- Enabled stricter runtime hardening in `src/lib/docker.ts` for the four shipped single-container Python agents: `User 1000:1000`, `ReadonlyRootfs`, and `Tmpfs /tmp`. `website-monitor` remains the documented exception.
- Verified locally with `npx tsc --noEmit` and `npm run build`.
- Verified on VPS Docker `29.4.0` that `seccomp=default` is invalid (`open default: no such file or directory`), so the code intentionally keeps Docker's default seccomp profile instead of writing a broken explicit option.

## Previous Status (2026-04-21 - earlier session)

**Security wrap-up after 1.x review (build-verified, ready to push/deploy):**
- Security review 1.x закрыт: nginx/CSP/rate-limit headers были смёржены раньше, эта сессия закрыла remaining wrap-up без payment-heavy правок.
- `cryptmus*` typo убран из JS/TS-слоя: `cryptomusWalletAddress` и `cryptomusPlanId` теперь консистентны, без миграции БД и без переименования SQL-колонок.
- Добавлен `.github/dependabot.yml`: weekly updates для npm, github-actions и docker по всем `agents-src/*`; major bumps для `next`, `react`, `react-dom`, `drizzle-orm` игнорируются.
- В `src/lib/docker.ts` явно задокументировано, что используем дефолтный Docker seccomp профиль и намеренно НЕ передаём `seccomp=unconfined`.
- Позже superseded OAuth-only cleanup: публичная email/password форма больше не является текущей auth-поверхностью. `emailAndPassword.enabled` в BetterAuth остаётся только как внутренний механизм для Telegram login.
- Продовый mobile Telegram flow проверен через Playwright mobile emulation: fallback-ссылка ведёт на `oauth.telegram.org` с корректным `return_to=/auth/telegram-callback`. После проверки найдено, что desktop-only widget всё ещё грузился на mobile и ловил CSP errors — это исправлено server-side UA gate, на mobile теперь показывается только fallback-ссылка.

**What still blocks a fully production-ready launch:**
- Нужны реальные `GOOGLE_CLIENT_ID/SECRET` и `GITHUB_CLIENT_ID/SECRET` на VPS, иначе social OAuth остаётся выключенным.
- Нужна ручная проверка на реальном телефоне после деплоя: `oauth.telegram.org` -> `/auth/telegram-callback` -> `/dashboard` с живой Telegram-сессией.
- Платежи для полноценного прода всё ещё зависят от внешних блокеров: реальные OAuth/payment credentials, YooKassa Marketplace approval и финальный E2E checkout/proxy/webhook smoke test на проде.

## Current Status (2026-04-15)

**Design polish pass + safety backup (local, build verified):**
- Создан полный локальный backup проекта до дальнейших правок: `C:\Users\artem\__BACKUPS__\AGENT-MARKET__FULL-BACKUP__2026-04-15__00-22-41`.
- `src/components/dev/PaletteSwitcher.tsx` добавлен как dev-only palette switcher с runtime CSS overrides; монтируется в root layout только при `NODE_ENV === "development"`.
- `src/app/globals.css` поднял контраст dark theme через новые `foreground`, `muted-foreground`, `border` и related foreground tokens.
- `src/components/landing/LandingAnimations.tsx` почищен от buyer-facing tech jargon, убран stale `meta` render bug и leftover glow blob; `npm run build` снова проходит.
- `src/components/agents/AgentCard.tsx` усилен: checklist фич, `Новый` state, more informative footer strip.

**Post-polish hardening (same day, lint/build clean):**
- Полный `npm run lint` стал зелёным: почищены unused imports/vars, legacy warnings и React hook lint errors.
- Theme mount gating переведён на `src/hooks/use-mounted.ts` через `useSyncExternalStore` в `ThemeProvider`/`ThemeToggle`, без `setState` в `useEffect`.
- Next 16 deprecation закрыт: `src/middleware.ts` перенесён в `src/proxy.ts`, export `middleware` -> `proxy`, build warning исчез.
- `src/lib/auth.ts` подключает Google/GitHub providers только когда env credentials заданы, поэтому local build без ложных BetterAuth warnings.
- `.env.local.example` переписан под текущий self-hosted stack (BetterAuth/DB/Docker/YooKassa/Cryptomus), без legacy Supabase/Stripe variables.

**Landing follow-up (same day, targeted redesign + test controls):**
- `src/components/landing/LandingAnimations.tsx` rebuilt only in the sections called out as weak: hero, buyer path, post-launch benefits, and seller copy. `HeroDashboardMock` and the payout card stay as anchors.
- Homepage metadata in `src/app/page.tsx` now describes the product as ready-made business agents instead of a generic AI marketplace.
- `src/components/dev/PaletteSwitcher.tsx` is temporarily mounted for on-site visual testing in all environments via `src/app/layout.tsx`; the floating trigger is now explicitly labeled `Палитра`.

## Current Status (2026-04-14)

**Pricing model B+C + compute classes (deployed):**
- Новая модель: `agents.price_monthly/price_onetime` = цена труда продавца (БЕЗ хостинга). Покупатель платит `seller_price + compute_price`. Комиссия **12%** берётся ТОЛЬКО с `seller_price` — compute passthrough, остаётся у платформы.
- `agents.compute_class` ∈ {S, M, L} — добавлен в схему, default `S`. Классы определены в `src/lib/compute.ts` (`COMPUTE_CLASSES`, `totalPrice()`, `sellerPayout()`, `platformCommission()`).
- S=390₽ (0.25 CPU, 256 MB), M=790₽ (0.5 CPU, 512 MB, 1 GB disk), L=1690₽ (1 CPU, 1 GB, 5 GB disk, cron).
- Checkout route, yookassa/cryptomus провайдеры, seller/admin статистика, dashboard, catalog и agent page — всё переведено на модель B+C.
- `src/lib/docker.ts` — compute limits реально применяются: `Memory`, `NanoCpus`, `PidsLimit`, `MemorySwap=Memory` (swap выключен) — из `COMPUTE_CLASSES[class].{memoryMb,cpu}`.
- Ночная ветка `backup/compute-windows-night` — альтернативный драфт с `sub.seller_price` и Cryptomus USD, идеи перенесены в `todo.md` (Phase C2).

## Previous Status (2026-04-13)

**Project reorganization (2026-04-13):**
- CLAUDE.md restructured: slimmed from 32KB monolith to focused core (~4KB) with routing table
- Created `instructions/` with 5 modules: coding.md, design.md, payments.md, docker.md, agents-build.md
- Created `lessons.md` (self-learning system) and `todo.md` (task tracking)
- Created global `~/.claude/CLAUDE.md` with cross-project rules
- Initialized Memory system with MEMORY.md index + user_profile.md + project_architecture.md
- All detailed specs (DB schema details, payment flows, agent catalog, auth flows) moved from CLAUDE.md to instruction modules

## Previous Status (2026-04-12)

**Phase A — дизайн (ЗАВЕРШЁН):**
- Полный редизайн лендинга: product-first, editorial typography, asymmetric layouts, no AI-slop.
- Visual system: mono labels (`font-mono text-[11px] uppercase tracking-[0.15em]`), `border-border/40` cards, `bg-foreground text-background` CTA buttons, `rounded-lg`, no gradients/glow/backdrop-blur/glassmorphism.
- Hero: centered copy + HeroDashboardMock (buyer-facing mock с activity feed, stats row, streaming logs, sidebar с агентами).
- 21 файл вычищен от AI-slop (gradient text, glow blobs, violet decorations, backdrop-blur) — все страницы в едином стиле.
- Финальный cleanup: убраны developer-facing термины (Docker, визард, образ), все em dashes заменены на hyphens, fake tech metrics заменены на buyer-relevant.
- **Бэкап-тег перед редизайном:** `backup/phase-a-pre-redesign` на коммите `143611f`.

**Phase C — скелет платёжной системы (2026-04-11 вечер):**
- `src/lib/payments/provider.ts` — интерфейс `PaymentProvider`, типы `WebhookEvent` / `PayoutParams` / `CreateCheckoutParams`, `providerEnvConfigured()` для проверки env.
- `src/lib/payments/yookassa.ts` — реализация: createCheckout с split через transfers[] (88% продавцу от `seller_price` на yookassa_account_id), handleWebhook для payment.succeeded/canceled, payoutToSeller throw (не используется — split через transfers), createSellerAccount throw (заглушка до интеграции). HTTP через fetch с Basic auth + Idempotence-Key. Сумма в рублях с двумя знаками, save_payment_method=true для подписок.
- `src/lib/payments/cryptomus.ts` — реализация: createCheckout (USD или RUB с автоконвертом), handleWebhook с верификацией MD5-подписи, payoutToSeller 88% от `seller_price` на cryptomus_wallet_address через /v1/payout, cancelSubscription через /v1/recurrence/cancel.
- `src/lib/payments/index.ts` — `getProvider(name)` возвращает null если env не заполнен, `listAvailableProviders()` для ProviderPicker UI.
- `/api/checkout/route.ts` переписан: если provider передан И credentials есть → настоящий checkout (создаёт subscription, вызывает provider.createCheckout, возвращает `checkoutUrl`); иначе → dev-stub (subscription сразу в pending_setup без оплаты). YooKassa split получает `sellerYookassaAccountId` через инъекцию в agent object.
- `/api/webhooks/yookassa/route.ts` — принимает POST, парсит через provider.handleWebhook, обновляет subscriptions.
- `/api/webhooks/cryptomus/route.ts` — принимает POST, после payment.succeeded для not-admin агента инициирует payout 88% от `seller_price` продавцу, пишет запись в payouts (pending/processing/completed/failed).

**Активация платежей = чисто ENV-работа.** Как только YooKassa одобрит заявку, на VPS в .env добавляется YOOKASSA_SHOP_ID / YOOKASSA_SECRET_KEY / YOOKASSA_WEBHOOK_SECRET — `providerEnvConfigured("yookassa")` начинает возвращать true, `getProvider` возвращает реальный инстанс, /api/checkout переключается с dev-stub на настоящий checkout без правок кода. Аналогично для Cryptomus (CRYPTOMUS_MERCHANT_ID + API_KEY + PAYOUT_API_KEY + WEBHOOK_SECRET).

**Что ещё НЕ сделано / НЕ активировано в платежах:**
- Реальный YooKassa `createSellerAccount` API call всё ещё заглушка. `/api/seller/onboarding` уже существует и сохраняет данные продавца либо вручную вставленный `yookassa_account_id`, но автоматическое создание субаккаунта через YooKassa API ещё не сделано.
- Credentials YooKassa/Cryptomus не настроены на VPS, поэтому `/api/payments/providers` возвращает `[]`, а checkout остаётся в dev-stub режиме.
- После появления credentials нужен реальный E2E smoke: checkout -> provider redirect -> webhook -> subscription update -> seller split/payout.
- Для YooKassa recurring нужен включённый VPS scheduler, который будет вызывать `/api/cron/yookassa-recurring` с `x-cron-secret`.

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
- BetterAuth настроен (src/lib/auth.ts) — Google OAuth, GitHub OAuth и внутренний email/password механизм для Telegram login. Публичная email/password форма позже удалена.
- BetterAuth API route (src/app/api/auth/[...all]/route.ts).
- Auth client (src/lib/auth-client.ts) — signIn, signUp, signOut, useSession.
- Auth server helper (src/lib/auth-server.ts) — getSession(), getUser().
- Все pages и API routes переписаны: supabase.from() → Drizzle запросы.
- middleware.ts переписан: BetterAuth session cookie вместо Supabase.
- LoginForm позже удалён во время OAuth-only cleanup; публичный auth сейчас только Telegram/GitHub/Google.
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
- Сайт доступен по http://77.239.104.149 (публично). SSH через `ssh aimbot-public`.

## Active Decisions

### Архитектура
- **Self-hosted:** BetterAuth + Drizzle ORM + PostgreSQL в Docker. Supabase полностью удалён.
- **Auth:** BetterAuth (Google OAuth, GitHub OAuth, Telegram Login Widget). Public email/password UI removed; `emailAndPassword.enabled` stays enabled internally because Telegram login uses BetterAuth email sign-up/sign-in with deterministic HMAC password.
- **ORM:** Drizzle ORM с node-postgres (pg).
- **БД:** PostgreSQL 16 в Docker, volume для данных, порт только localhost.
- **Деплой:** Docker Compose (postgres + next.js + nginx), всё на одном VPS.
- **RLS убран** — проверка прав в API routes через getUser() + db query.
- **Комиссия платформы:** 12% (только с seller_price, compute — passthrough).
- **Цены в БД:** копейки RUB.

### VPS
- Провайдер: u1host (бывший AdminVPS отменён)
- Публичный IP: 77.239.104.149
- Ubuntu 24.04, kernel 6.8.0-79
- SSH: `ssh aimbot-public` (alias в `~/.ssh/config`)
- Docker 29.4.0 + Compose 5.1.1
- Проект: /opt/agent-market

### Telegram Bot для Login Widget
- Бот создан: @agentmarket0_bot
- Production domain is `hireon.agency`; Telegram `/setdomain` / live Telegram callback should be rechecked on a real phone after auth changes.

## Active Decision (2026-04-11): сайт → боты, а не наоборот

Приостанавливаем работу над стартовыми ботами (Day 6) до того, как сайт будет **production-ready**. Причина: пустые кнопки, нерабочий OAuth, неотлаженные флоу = маркетплейс на сломанном фундаменте, даже если в бэке 6 идеальных агентов. Приоритет — сначала довести фронт до состояния «юзер может дойти от лендинга до оплаты без единой ошибки», потом уже наполнять каталог ботами.

Скаффолд `ai-support-bot` остаётся на VPS (`docker compose ps` в `/opt/agent-market/agents-src/ai-support-bot/` — бот + mongo работают, ресурсов ест минимум). Возвращаемся к нему после Day 10.

## Current Stage (2026-04-12)

**Phase A (дизайн) — завершён.** Следующий шаг — выбрать приоритет из оставшихся фаз:

**Что уже в репо и готово к активации:**
- Phase C скелет платежей — коммит `3534c11`. Активация = вписать ENV-переменные YooKassa/Cryptomus в `/opt/agent-market/.env` на VPS, никакого кода трогать не надо. Подробности — выше в разделе "Phase C".
- Phase D скаффолд AI Support Bot — работает на VPS в `/opt/agent-market/agents-src/ai-support-bot/`, не трогать.
- Бэкап-тег `backup/phase-a-pre-redesign` на коммите `143611f` — откат в любой момент: `git reset --hard backup/phase-a-pre-redesign`.

## План после дизайн-дня (в порядке приоритета)

1. **Phase B — внешние блокеры (ждут действий юзера):**
   - Google + GitHub OAuth credentials в VPS `.env` и smoke обоих провайдеров
   - Telegram Login Widget: подтвердить `/setdomain` у @BotFather для @agentmarket0_bot и пройти live flow на реальном телефоне
   - YooKassa Маркетплейс — заявка, одобрение, credentials

2. **Phase C — активация платежей + доделки (НЕ сам код провайдеров, он уже написан):**
   - Вписать ENV в VPS → dev-stub автоматически переключится на настоящий checkout
   - Реальный YooKassa createSellerAccount через API; текущий `/api/seller/onboarding` уже сохраняет данные/ручной account ID
   - VPS scheduler для recurring списаний YooKassa (route уже есть)
   - Retry-логика для failed Cryptomus payouts
   - Реальное end-to-end тестирование с тестовым магазином

3. **Phase D — достроить стартовый каталог ботов:**
   - #4 Website Monitor (обёртка changedetection.io, Apache 2.0)
   - #5 News Digest Bot (обёртка ESWZY/telegram-news, MIT)
   - #2 Content Writer (свой код ~150 строк + ai_provider.py)
   - #3 Competitor Monitor (свой код ~120 строк + ai_provider.py)
   - #6 Review Responder 2ГИС (свой код)

## Completed Phases

1. ~~SSH доступ к VPS~~ — через Tailscale.
2. ~~Деплой на VPS~~.
3. ~~Day 5~~ — docker.ts, API routes, LogViewer.
4. ~~Day 7~~ — панель продавца.
5. ~~Day 8~~ — админка.
6. ~~Day 9~~ — SEO, error/loading states, UI overhaul.
7. ~~UI polish~~ — 2026-04-10.
8. ~~Day 6 partial~~ — ai-support-bot scaffold протестирован (2026-04-11), поставлен на паузу.
9. ~~Phase A site polish~~ — dev checkout, legal pages, robots/sitemap, AgentGrid empty state, seed fix (kopecks).
10. ~~Phase C payment scaffolding~~ — готов к активации через ENV (2026-04-11 вечер).
11. ~~Phase A дизайн-день~~ — полный редизайн + visual unification + text cleanup (2026-04-12).

## Blockers

- YooKassa Маркетплейс: заявка/credentials не готовы, поэтому банковский checkout не активирован.
- Cryptomus credentials не настроены на VPS, поэтому crypto checkout тоже не активирован.
- Google/GitHub OAuth credentials и Telegram live flow нужно финально проверить на проде.
- Финальный E2E payment smoke на проде ещё не пройден: checkout, webhook, subscription update, seller split/payout, recurring route.

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
