# Промт для следующей сессии

## Контекст последних сессий

**2026-05-17 (вечер + ночь):** крипто-миграция Cryptomus → NowPayments,
редизайн дашборда, аудит «швейцарские часы» — 9 коммитов в проде.

**2026-05-18:** marathon-сессия, 14 коммитов в `main`. Сделано:
- Smoke-test для всех 6 published агентов (`npm run smoke:agents`) — 6/6 PASS
- NowPayments friendly error messages + точные минимумы по live API
- Output preview backend (`/api/subscriptions/[id]/output-info`)
- Бэкапы БД — добавлен weekly auto-restore-test (daily-backup уже был)
- Security audit (subagent + 5 групп фиксов): self-approval seller onboarding,
  rate-limits на anonymous mutating endpoints, webhook/cron hardening,
  status-guards на /start и /restart, audit-trail на admin actions
- E2E checkout flow test — 4 фазы PASS (signed webhook, idempotency,
  bad signature, AES-GCM roundtrip)

Полная история: `git log --oneline 6ec464b..HEAD` (от 6ec464b на 2026-05-18).

## Где смотреть

- `memory/MEMORY.md` → `[[handoff-pre-launch]]` — оперативный статус
- `drafts/sellers-quickstart.md` — 376 строк, отложено до реальных продавцов
- Прод: hireon.agency, IP 77.239.104.149, /opt/agent-market
- Smoke: `ssh root@77.239.104.149 'cd /opt/agent-market && bash scripts/smoke-agents.sh'`
- E2E: `ssh root@77.239.104.149 'cd /opt/agent-market && bash scripts/e2e-checkout.sh'`

## Приоритет на следующую сессию

### #1 — Output preview UI (small, нужен браузер)

Backend готов (`GET /api/subscriptions/[id]/output-info`). Нужен фронт в
`src/app/dashboard/agents/[id]/ManageView.tsx` — Status Panel должен
показывать «Куда поступают результаты»:
- Для `kind: 'output'` (CHANNEL_ID): ссылка на `t.me/<username>` или
  `t.me/c/<id>`, название канала, кол-во подписчиков
- Для `kind: 'notification'` (CHAT_ID, OWNER_CHAT_ID): «Уведомления → @юзернейм»
- Если `accessible: false` — fallback: «Открыть в Telegram» (raw ID)

Endpoint возвращает форму:
```ts
{ data: { targets: Array<{
  kind: 'output' | 'notification',
  envKey: string,
  raw: string,
  title: string | null,
  url: string | null,
  type: string | null,
  memberCount: number | null,
  accessible: boolean,
  error: string | null,
}> } }
```

Реальный тест требует bot-админ в реальном канале — попроси юзера дать
один настроенный agent + проверь визуально.

### #2 — Offsite-бэкапы (medium, нужны creds)

Сейчас бэкапы только на VPS (`/var/backups/hireon/`). Если умрёт диск —
данных нет. Нужно:
1. Получить от юзера creds к S3-compatible (Backblaze B2 / Cloudflare R2 /
   Yandex Object Storage / AWS S3 / Selectel).
2. Установить `rclone` или `aws-cli` на VPS.
3. Расширить `infra/backup/hireon-db-backup.sh` — после успешного
   `pg_dump` копировать .sql.gz в bucket.
4. Retention в бакете 30 дней, чтобы не разрастался.
5. (опц) Восстановление из offsite в restore-test раз в месяц.

### #3 — Полировка лендинга (medium, нужен браузер)

Из past-handoff'а ещё не закрыто:
- Мерцание плавающего мока на десктопе после 03154a4 — DevTools → Animations
- Footer + PreLaunchBanner не переделаны под новый стиль
- Breakpoint 881-1024px стычки

### #4 — ЮКасса recurring (blocked, ждём СБ)

Заявка 16 мая (shopID 1334693). После активации:
- Удалить mock-подписку `6fb66bc6-ea84-4bd7-b127-e56a7f31ac72`
- Прогнать реальный E2E с тестовой картой
- `hireon-yookassa-recurring.timer` уже работает, проверить логи через
  `journalctl -u hireon-yookassa-recurring.service`

### #5 — Лонч-пост (last, нужен полированный лендинг)

VC.ru / Habr / Telegram. 800-1500 слов, без эмодзи, без AI-slop,
тире через дефис. Сохранить в `drafts/launch-post.md`.

## Что НЕ делать

- `docker image prune -a` на VPS — НИКОГДА
- Не пушить миграции БД без явного approval (security audit оставил
  `payouts.providerTransferId` как маркер вместо новой колонки)
- Не публиковать `drafts/sellers-quickstart.md` пока нет реальных продавцов
- Не задеплоить `2b8ba20` отдельно — это standalone fix для скрипта, не для app

## Файлы которые открыть первым делом

- `src/app/dashboard/agents/[id]/ManageView.tsx` — место для Output preview UI
- `src/lib/telegram-bot.ts` — helper для Telegram Bot API (готов)
- `infra/backup/hireon-db-backup.sh` — extend для offsite

## Известные edge cases (lessons из сессии 2026-05-18)

- На VPS `/opt/agent-market` мог иметь untracked файлы которые я scp-нул
  при отладке (smoke / restore-test / e2e). `git pull` рвался — проверяй
  через `diff <(cat file) <(git show origin/main:file)` ДО удаления.
- npm pg в node:22-slim: ESM resolver не уважает NODE_PATH. Копируй
  скрипт в /tmp где есть node_modules: `cp /scripts/foo.mjs /tmp/`.
- Inotice systemd-units: timers под именем `hireon-*` уже были до моих
  правок (db-backup, yookassa-recurring). Проверяй `systemctl list-timers`
  ДО создания новых.

## Состояние прода (2026-05-18 EOD)

- HEAD: `2b8ba20` (но app задеплоен на `1d15a69` — последний `docker compose up -d --build app`)
- App `Up`, healthy, /api/payments/providers → 200
- 3 systemd timer'а активны: db-backup daily 03:00 UTC, db-restore-test weekly Sun 06:00 UTC, yookassa-recurring daily 06:00 UTC
- 0 зомби, 0 restart loops
- БД: 9 users, 9 agents (8 published + 1 draft echo-agent), 4 subscriptions
