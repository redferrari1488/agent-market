# Hireon — маркетплейс готовых AI-агентов

Не промпты, а работающие системы: покупатель выбирает агента, оплачивает
(подписка или разово), проходит Setup Wizard, платформа поднимает Docker-контейнер
агента на VPS, и тот работает 24/7.

**Phase 0 (pre-launch):** продаются только собственные агенты платформы
(`seller_id = NULL`), для сторонних продавцов — бесплатное размещение, комиссии
пока нет. Рынок: РФ (основной) + международные, два платёжных провайдера.

## Стек

- **Frontend:** Next.js 16 (App Router, TS strict), Tailwind v4, shadcn/ui, framer-motion
- **Backend:** Next.js API Routes
- **БД:** PostgreSQL + Drizzle ORM, BetterAuth (Telegram Login)
- **Платежи:** YooKassa (РФ) + NowPayments (крипто/международные)
- **Агенты:** Docker-контейнеры через dockerode → tecnativa/docker-socket-proxy на VPS
- **AI:** OpenRouter (managed-ключ для агентов Hireon), Python 3.11 агенты
- **Прочее:** Zod (валидация), AES-256-GCM (шифрование конфигов), pino + Telegram-алерты

## Разработка

```bash
npm install
cp .env.local.example .env.local   # заполнить секреты
npm run dev                         # http://localhost:3000
```

### Проверки

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm test            # vitest (юнит-тесты чистых функций: деньги, шифрование,
                    #         валидация конфига, IP-whitelist, telegram-HMAC, reconciler)
npm run build       # next build (пред-деплой проверка; нужен доступ к БД)
```

CI (`.github/workflows/ci.yml`) гоняет typecheck + lint + test на каждый push/PR.

## Деплой

```bash
git push && ssh aimbot-public 'cd /opt/agent-market && git pull && docker compose up -d --build app'
```

Миграции БД применяются вручную (`db/migrations/`, `db/seeds/`) — см. `instructions/`.
Cron-таймеры (recurring-списания + reconciler) — `infra/cron/`.

## Структура

| Каталог | Что там |
|---|---|
| `src/app/` | Страницы и API-роуты (checkout, вебхуки, cron, lifecycle подписок, admin/seller) |
| `src/lib/` | Ядро: `docker.ts`, `payments/`, `encryption.ts`, `auth*`, `validators.ts`, `net/ip.ts` |
| `src/components/` | UI (лендинг, каталог, дашборд) |
| `agents-src/` | Docker-образы Python-агентов |
| `db/` | `migration.sql` (init) + `migrations/` (ручные) + `seeds/` |
| `infra/` | nginx, fail2ban, systemd-таймеры (backup/restore-test/cron), security-отчёты |

## Документация

- `CLAUDE.md` — инструкции и факты проекта (роутинг по задачам в `instructions/`)
- `PROJECT_CONTEXT.md` — общий контекст между устройствами
- `lessons.md` — журнал инцидентов и паттернов
- `todo.md` — текущие задачи
