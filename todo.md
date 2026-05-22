# TODO

> **Активная сессия: 2026-05-23** — v3 redesign задеплоен и стабилен на проде. Платежи (ЮКасса + NowPayments) активны с 22.05. Hireon в Phase 0 (free placement для third-party sellers, монетизация через свои агенты + boost).

---

## Открытое — техническое

### Высокий приоритет

- [ ] **Voice-transcriber публикация** — `agent-market/voice-transcriber:latest` готов, draft в БД (1490₽/мес).
  - e2e-чек с реальным голосовым (TG bot → транскрипция)
  - опц. брендинг welcome-message
  - `UPDATE agents SET status='published' WHERE slug='voice-transcriber'`

### Средний приоритет

- [ ] **Outbound link на seller-карточке** — для `agents` с `seller_id != NULL` и `external_url`. UI «Перейти к продавцу» (`ExternalAgentCTA.tsx` уже компонент существует — проверить что подхватывает `external_url` корректно)
- [ ] **Header.tsx role-зависимая навигация** — свериться что «Стать продавцом» / «Продавцам» / «Админка» уже правильно показывается по роли в `buildNavigation()`. Если ок — закрыть задачу.
- [ ] **Биржа заказов** — репрофилирование `access_requests`: добавить `title / budget / category`, форма `/requests/new` + лента `/requests`

### Низкий приоритет / тех. долг

- [ ] **Carousel на framer-motion AnimatePresence** — текущий `display:none` фикс для off-screen работает, но это hack. Полный фикс — переход на framer-motion с proper exit-анимациями + знание lastDir для swipe direction.
- [ ] **Generic fallback для HeroIllustration** — сейчас 8 per-agent mockup'ов через switch. Когда агентов станет ≥15 — добавить category-based fallback.

---

## Открытое — маркетинг / запуск

- [ ] **Лонч-пост** — `drafts/launch-post.md` (если ещё не запостил в TG/X)
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
