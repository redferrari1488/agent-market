# Project Context

## Current Goal
AI Agent Marketplace — маркетплейс готовых AI-агентов, работающих в Docker-контейнерах 24/7. Подробная архитектура в `CLAUDE.md`.

## Current Status (2026-04-06)

**Завершённые дни:**
- Day 1–4: лендинг, каталог, карточка агента, дашборд покупателя, Setup Wizard, AES-256-GCM шифрование, email OTP, отзывы, Header с user-меню, seed.sql с 3 агентами.

**Выполненные шаги (текущая сессия):**
- CLAUDE.md полностью переписан: Stripe → YooKassa + Cryptomus, 4 способа auth, нейтральные provider_* поля в БД, RUB-копейки вместо USD-центов.
- Миграция 005: stripe_* → provider_*, telegram_id, yookassa/cryptomus поля.
- Миграция 006: trigger handle_new_user подхватывает telegram_id/username из user_metadata.
- Stripe-код удалён (lib/stripe.ts, api/checkout, api/webhooks/stripe, api/seller/connect).
- PurchaseButton: заглушка «скоро» + рубли.
- Auth: Google OAuth + GitHub OAuth (OAuthButtons.tsx) + Telegram Login Widget (TelegramLoginButton.tsx + lib/auth/telegram.ts + api/auth/telegram/route.ts) + email OTP (fallback).
- Google OAuth — протестирован, работает.
- Telegram Login — код готов, тестирование отложено (нужен домен/туннель для BotFather /setdomain).

## Active Decisions

### Архитектура
- **Целевой рынок:** РФ (основной) + зарубеж.
- **Платежи:** YooKassa (РФ, split 85/15) + Cryptomus (крипта, programmatic payouts 85/15). Отложены на финальный этап.
- **Auth:** Google OAuth + GitHub OAuth + Telegram Login Widget + Email OTP. Всё через BetterAuth на self-hosted (см. ниже).
- **Комиссия платформы:** 15%.
- **Цены в БД:** копейки RUB. USD-цены опциональны (для Cryptomus).

### Решение: полный переезд на self-hosted (Вариант 1)
- **Отказываемся от Supabase** полностью (и Auth, и DB).
- **Новый отдельный VPS** для маркетплейса (Ubuntu 24.04, рекомендация 4GB RAM, 2 vCPU). Старый VPS (95.24.139.106) оставляем для 5 ботов — не трогаем.
- **Стек на VPS:** PostgreSQL + Next.js + Docker Engine + Nginx + BetterAuth.
- **BetterAuth** вместо Supabase Auth (Google OAuth handshake напрямую, сессии в Postgres).
- **Drizzle ORM** вместо Supabase JS Client для работы с БД.
- **RLS убираем** — проверка прав в API.
- Это решение принято потому, что пользователь хочет полную независимость от внешних сервисов. Момент идеальный — кода мало, мигрировать легко.

### Telegram Bot для Login Widget
- Бот создан: @agentmarket0_bot
- /setdomain не установлен (cloudflared не прошёл, отложено до наличия домена/деплоя)
- Токен бота нужно добавить в .env после настройки домена

## Next Tasks (в порядке приоритета)

1. **Арендовать новый VPS** (Ubuntu 24.04, 4GB RAM, 2 vCPU, 40+ GB SSD) — блокер для всего остального.
2. **Настройка VPS:** Docker, Postgres в контейнере, Nginx.
3. **Миграция кода:** Supabase → BetterAuth + Drizzle ORM + self-hosted Postgres.
4. **Day 5:** lib/docker.ts (dockerode), подключение к API start/stop/restart/logs, LogViewer.
5. **Day 6:** Docker-образы для 3 стартовых агентов.
6. **Day 7:** Панель продавца.
7. **Day 8:** Админка.
8. **Day 9:** E2E, error states, SEO.
9. **Day 10:** Финальный деплой, домен, SSL.
10. **После Day 10:** Платежи (YooKassa + Cryptomus).

## Blockers

- Новый VPS не арендован — блокирует переезд и Day 5+.
- YooKassa Маркетплейс: заявка не подана. Подавать нужно заранее (одобрение 1–2 недели).
- Домен не куплен — без него нет SSL и Telegram Login.

## Current Workflow
- Start work inside the project directory with `startproj`.
- End work inside the project directory with `endproj`.
- Sync between Windows and MacBook happens through normal git push/pull.

## Important Files
- `CLAUDE.md` — полная архитектура, схема БД, стек, флоу, стиль кода.
- `PROJECT_CONTEXT.md` — текущий статус, решения, блокеры (этот файл).
- `supabase/migration.sql` — каноническая схема БД (с нуля).
- `supabase/migrations/` — инкрементальные миграции.
- `supabase/seed.sql` — 3 стартовых агента.

## Notes For Claude And Codex
- Read `CLAUDE.md` and `PROJECT_CONTEXT.md` before making important changes.
- Preserve the existing workflow unless there is a strong reason to change it.
- If implementation details or priorities shift, update this file in the same change set.
- Миграции 005 и 006 нужно прогнать в БД (пока на Supabase, потом при переезде — на self-hosted Postgres).
