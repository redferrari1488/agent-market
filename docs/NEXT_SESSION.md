# Next Session — Agent Market / Hireon

Копируй этот файл целиком в начало следующей сессии как контекст.

---

## Статус на 19.08.2026 — прод выключен

VPS `aimbot-public` (<VPS_IP>) выключен, платить за него Артём пока не хочет.
Сайт по HTTP/HTTPS не отвечает, SSH на этом IP отдаёт чужой хост-ключ (адрес,
судя по всему, ушёл другому клиенту) — ключ не принимать, старая запись из
`known_hosts` удалена 19.08.2026. DNS `hireon.agency` по-прежнему указывает на
этот IP: A-запись стоит снять в reg.ru, иначе домен светит на чужой сервер.
Всё, что ниже, — состояние на момент выключения, а не текущее.

## Where we are (на момент выключения прода)

- **Домен:** `hireon.agency` (куплен на reg.ru, DNS → `<VPS_IP>`)
- **SSL:** Let's Encrypt issued, valid до `2026-07-18`, auto-renew через certbot systemd timer
- **Site live:** https://hireon.agency (HTTPS 200, HTTP→HTTPS redirect, www→apex redirect)
- **Brand:** полный ребренд из `AgentMarket` → `Hireon` завершён по всему UI (header, footer, metadata, контакты, копирайт, URL-моки). Фавикон удалён, нужен свой.
- **Stack живой:** postgres (healthy) + app + nginx в Docker Compose на VPS
- **Catalog:** 6 агентов published в БД (`telegram-support-bot`, `content-writer`, `competitor-monitor`, `website-monitor`, `news-digest-bot`, `review-responder-2gis`)
- **Last commits:** `52a2345` (SSL/HTTPS), ребренд-коммит должен быть свежим после этой сессии

## VPS access

- SSH: `ssh aimbot-public`
- Public IP: `<VPS_IP>`
- Путь: `/opt/agent-market`
- Сертификаты: `/etc/letsencrypt/live/hireon.agency/`
- Порты: 80, 443 открыты, UFW inactive
- Certbot 2.9.0

## Что осталось (Phase B, по приоритету)

| # | Задача | Кто делает | Время |
|---|---|---|---|
| 1 | `CRON_SECRET` в `.env` + systemd-таймеры для `/api/cron/yookassa-recurring` и `/api/cron/cryptomus-payout-retry` | Claude через SSH | 10 мин |
| 2 | Telegram `/setdomain hireon.agency` у @BotFather (бот `@agentmarket0_bot`) | Юзер | 1 мин |
| 3 | Google OAuth credentials (Google Cloud Console → OAuth consent → Client ID) | Юзер (Claude гайдит) | 15 мин |
| 4 | GitHub OAuth credentials (Developer Settings → OAuth Apps) | Юзер (Claude гайдит) | 5 мин |
| 5 | Resend API key → допишем email verification (~50 строк кода) | Юзер регистрирует, Claude кодит | 30 мин |
| 6 | YooKassa Маркетплейс — подать заявку | Юзер | внешний процесс, дни-недели |
| 7 | Cryptomus — регистрация | Юзер | внешний процесс |
| 8 | Фавикон — сделать нормальный (брендированный) | Юзер или Claude | 5-10 мин |
| 9 | ~~В `contacts/page.tsx` стоит `@hireon` и `hello@hireon.agency`~~ DONE — контакты унифицированы на `@hireon_agency` + `hireon.team@yandex.com` (4e1d1a1) | — | — |

## Первый шаг в новой сессии

1. Локально: `git pull` — забрать свежие коммиты
2. Спросить юзера: стартуем с задачи 1 (CRON, Claude делает сам) или с 2/3/4 (OAuth + Telegram, юзер делает, Claude гайдит)?

## Gotchas / важное

- **На VPS не настроен git push** — все коммиты делаются с Windows/ноута, на VPS только `git pull`. Если Claude правит файлы на VPS напрямую, нужно потом scp-нуть их обратно на локальную машину и закоммитить оттуда.
- **Primary market:** RU + international (dual payment providers)
- **Комиссия:** 15% (из CLAUDE.md), admin-агенты с `seller_id = NULL` идут 100% платформе
- **BYOK:** все AI-ключи приносит покупатель, платформа не держит
- **Не модифицировать** `CLAUDE.md` и `instructions/` без явного разрешения юзера
- **Проверка работы (пока прод был жив):** `curl -sI https://hireon.agency/` возвращал HTTP 200

## Контекст памяти

Всё остальное (архитектура, DB-схема, payment flow) — в `CLAUDE.md` и `instructions/`. Не грузить если не нужно.

## Рабочая директория

- Windows: `C:\Users\artem\agent-market`
- Git remote: `https://github.com/rodimovartem/agent-market.git`
- Main branch: `main`
