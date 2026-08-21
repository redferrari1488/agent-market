# TODO

> **Активная сессия: 2026-05-23** — v3 redesign задеплоен и стабилен на проде. Платежи (ЮКасса + NowPayments) активны с 22.05. Hireon в Phase 0 (free placement для third-party sellers, монетизация через свои агенты + boost).

---

## Открытое — техническое

### Высокий приоритет

- [~] **Voice-transcriber — НЕ ПУБЛИКУЕМ (решение фаундера 2026-06-12).** e2e пройден (контейнер на VPS, реальное голосовое → транскрипция за ~21с, пайплайн рабочий), но как standalone-продукт не имеет смысла: в Telegram транскрипция ГС встроена (Premium, мгновенная). Та же логика, что с review-responder-2gis — не конкурировать с нативной фичей платформы. Образ остаётся в cold storage, агент в draft. Транскрипция — только как маленькая часть будущего продукта, не сам продукт.

- [~] **review-responder-2gis — ОТЛОЖЕН (ниша заморожена 2026-06-09, решение фаундера).** Ниша слабая: конкуренция с нативным «Отзывы Про» 2ГИС (AI-автоответы + доступ к публикации), нет write-API (только ручная вставка / хрупкий обход), забитый рынок, низкий чек СМБ. Парсинг-фикс остаётся в git (не пропал), агент в waitlist. НЕ доводить, образ НЕ пересобирать.

- [ ] **telegram-support-bot: рантайм-верификация** — статически здоров (2026-06-09: все entrypoint-патчи матчат upstream, образ соберётся, дефолтная модель/chat_mode без багов, AI-ядро живо). НЕ воспроизводимо без прогона. Прогнать локально на ноуте: `cd agents-src/ai-support-bot && docker compose up --build` с реальным токеном → диалог → читать логи (start.py теперь пишет INFO в stdout). Гипотезы остатка: streaming-формат claude/OpenRouter в openai 0.28; Markdown v1 parse.

### Низкий приоритет / тех. долг

- [ ] **Generic fallback для HeroIllustration** — сейчас 8 per-agent mockup'ов через switch. Когда агентов станет ≥15 — добавить category-based fallback.

---

## Открытое — маркетинг / запуск

> **Стратегия распространения (v3 — малый бюджет, творчество+соцсети+AI):** `drafts/hireon-distribution-plan.docx`.
> Рычаг №1 — dogfooding: маркетинг Hireon ведут собственные агенты (контент + демо + доказательство в одном).
> Творчество вместо бюджета: building in public, короткие видео «AI решил за 3 сек», публичные разборы, лид-магниты.
> Соцсети только легальные РФ (Telegram/VK/Дзен/YouTube/Rutube) — Instagram/X/Reddit/Discord под запретом рекламы (ФЗ-72).
> Платное — микро-тесты (Telegram-посев 5-15к ₽) только ПОСЛЕ органической валидации. Деньги только со своих агентов (НПД/422-ФЗ).
> Next-actions: E2E оплаты · агент-копирайтер ведёт канал Hireon · 5-8 коротких видео · аутрич 2ГИС с демо · лид-магнит «100 ответов на отзывы».

### Готовые маркетинг-ассеты (написаны, ждут публикации/рассылки)

- [ ] **Лонгрид** `drafts/launch-post.md` — написан, опубликовать на VC.ru/Habr (вставить скриншоты, сверить цифры)
- [ ] **TG-посты** `drafts/marketing/telegram-posts.md` (8) + `telegram-posts-2.md` (8) — копипастить в канал по 2-3/нед
- [ ] **Лид-магнит** `drafts/marketing/lead-magnet-2gis-otvety.docx` (48 ответов) — выложить как бесплатный файл
- [ ] **Аутрич-скрипт** `drafts/marketing/cold-outreach-2gis.md` — слать бизнесам с неотвеченными отзывами 2ГИС
- [ ] **Партнёрский оффер** `drafts/marketing/partner-offer.md` — рассылать агентствам/реселлерам (дорогие агенты)
- [ ] **Видео-сценарии** `drafts/marketing/video-scenarios.md` (6) — снять для VK Клипов/Shorts/Rutube
- [ ] **SEO-лендинги** `/resheniya/{otvety-na-otzyvy-2gis,bot-podderzhki-telegram,kopirayter-telegram-kanala}` — в коде, задеплоить (sitemap обновлён)

- [ ] **Список candidate-агентов** — `drafts/agent-candidates.md` (новые направления для разработки)

`drafts/launch-assets-v2/` — 8 PNG (cyan, big type) — финальная пачка, готова к использованию.

---

## Внешние блокеры (на пользователе)

- [ ] Тестовая покупка одного из своих агентов (1500₽) для e2e проверки + чек НПД через «Мой налог»
- [ ] Lock-In Agency коллаб — формат бартер, питч в `HANDOFF_2026-04-29.md` раздел 6

---

## Что НЕ делаем (sticky)

- **Marketplace split-эквайринг** — Phase 1, после открытия ИП на УСН 6%. Триггер Phase 1: 5+ сторонних продавцов готовы ИЛИ >150к₽/мес от своих агентов (близко к лимиту НПД 2.4 млн/год).
- **Приём платежей от сторонних агентов** — запрещено 422-ФЗ для НПД. Только бесплатное размещение + boost-монетизация.
- **YooKassa Marketplace split-логика** — Phase 2 (после ИП).
- **Cryptomus** — иностранных продавцов нет в Phase 0.
- **Telegram-бот модератора** — Resend заблокирован, обходимся `/admin/applications` руками.

---

## Архив

История prior sessions (Phase 0 ship, security review, hero shader, branding, pre-launch гибрид) — `git log` + `lessons.md`. Все эти задачи закрыты:

- Юр.страницы (`/terms`, `/privacy`, `/refund`, `/contacts`, `/seller`) — НПД-режим
- Pre-launch баннер на всех страницах
- Форма заявки продавца + админ-очередь `/admin/applications`
- Миграции `access_requests` + `seller_applications` на проде
- Security review (OWASP Top 10, заголовки, rate limiting, Trivy scan)
- Hero redesign + branding (hire.on wordmark, favicon, dark mode)
- ЮКасса заявка одобрена, оба провайдера активны с 22.05
- v3 страница агента (Stripe/Linear vibe + per-agent mockups + sticky mobile bar + СМБ-тон)
- Mobile багфиксы v3 round 3 (header media-query, features fallback, scroll-padding, ambient gradient убран, etc)
- Header mobile: «Войти»/avatar shortcut на pill
- Outbound link для сторонних агентов (`ExternalAgentCTA` + `AgentCard` с target=_blank) — готов, ждёт первого seller'а
- Header role-nav (`buildNavigation()` различает buyer/seller/admin) — проверено
- Биржа заказов — закрыта (не делаем, неактуально месяц)
- Carousel framer-motion рефакторинг — отменён, текущее состояние после revert на 26e5395 стабильно (не трогать)
