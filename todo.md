# TODO

> **Активная сессия: 2026-04-28** — гибридная Pre-launch стратегия (НПД + waitlist для сторонних) + подготовка заявки в ЮКасса-Самозанятый.

---

## SESSION 2026-04-28 — Pre-launch гибрид

### Стратегия (зафиксирована)

**Юр.модель Фазы 0 (сейчас):** ты регистрируешься как самозанятый (НПД) и продаёшь только **свои** агенты (`seller_id IS NULL`) через ЮКасса-Самозанятый. Сторонние продавцы могут регистрироваться, заполнять карточку, проходить модерацию, но **их карточки переключают кнопку «Купить» → «Запросить доступ»** (waitlist).

**Монетизация сторонних в Фазе 0:** фикс. подписка за листинг (Free / Pro 990 ₽/мес / Featured 2990 ₽/мес). Это услуга самозанятого «размещение в каталоге», не агентство — 422-ФЗ не нарушается.

**Триггер Фазы 1 (открытие ИП):** 5+ сторонних продавцов с готовыми агентами + 20+ заявок на доступ ИЛИ стабильная выручка от своих агентов >150к/мес (близко к лимиту НПД 2.4 млн/год).

**Фаза 1:** ИП на УСН 6% в Москве через Тинькофф Бизнес → подача в YooKassa Marketplace + T-Bank Касса параллельно → переключение sellers на split-эквайринг.

> Подробное обоснование выбора режимов — `~/.claude/projects/-Users-monkmode-agent-market/memory/project_pre_launch_strategy.md` (НПД и АУСН запрещают агентскую деятельность; УСН 6% — единственный путь к маркетплейсу с %-комиссией в РФ).

---

### Чек-лист подачи заявки в ЮКасса-Самозанятый

#### Что должен сделать пользователь (внешние шаги)

1. **Регистрация НПД** через приложение «Мой налог» (5 минут, бесплатно):
   - Скачать «Мой налог» (App Store / Google Play / Web)
   - Войти через Госуслуги или паспорт + ИНН
   - Подтвердить статус «Самозанятый», вид деятельности — **«IT-услуги»** или **«Программное обеспечение»**
   - Получить ИНН (он же твой обычный ИНН физлица)

2. **Заявка в ЮКассу:**
   - Зайти на https://yookassa.ru → «Подключить» → выбрать тариф **«Для самозанятых»**
   - Email + телефон + ИНН
   - URL сайта: **https://hireon.agency**
   - Описание деятельности (готовый текст ниже ↓)
   - Реквизиты для зачисления: карта или счёт самозанятого
   - Ссылки на оферту/политику/контакты на сайте

3. **Telegram-бот для уведомлений модератора** (опционально, но удобно):
   - Через @BotFather создать нового бота `@hireon_moderation_bot` (или подобное)
   - Получить TOKEN
   - Узнать свой `chat_id` через @userinfobot
   - Передать TOKEN + chat_id мне → пропишу в ENV

#### Что должно быть на сайте до подачи (готовлю в этой сессии)

- [x] Главная страница с описанием услуги — есть
- [x] Каталог `/agents` с публичными ценами — есть
- [ ] **Договор-оферта** на `/terms` — переписать под гибридную модель
- [ ] **Политика конфиденциальности** на `/privacy` — обновить упоминание о платежах НПД
- [ ] **Политика возвратов** на `/refund` — создать (требование ЮКассы)
- [ ] **Контакты** на `/contacts` — добавить блок с реквизитами самозанятого (ИНН, ФИО) — поля под плейсхолдеры до получения ИНН
- [ ] **Описание тарифов для продавцов** на `/seller` — три тарифа Free/Pro/Featured

#### Готовый текст для поля «Описание деятельности» в заявке

```
Платформа hireon — каталог готовых AI-агентов с возможностью оплаты услуг
самозанятого исполнителя. Через сайт принимаются:
1. Платежи за подписки на AI-агенты собственной разработки (продукт самозанятого).
2. Платежи за услуги размещения в каталоге от сторонних разработчиков
   (тариф Pro/Featured — фиксированная абонентская плата за информационный сервис).
Платформа не выступает агентом или комиссионером и не принимает платежи
от покупателей за продукты сторонних разработчиков. Сторонние продавцы
вступают в самостоятельные сделки с покупателями вне платформы.
```

#### Реквизиты для контактов и оферты (плейсхолдеры до получения ИНН)

```
Самозанятый: [ФИО — заполнить]
ИНН: [12 цифр после регистрации НПД]
Email: hello@hireon.agency
Telegram: @[username]
Юридический адрес: [город регистрации]
```

---

### Код Фазы 0 (выполняем в текущей сессии)

В порядке зависимостей:

- [ ] **#1 Юр.страницы** — `/terms`, `/privacy`, `/refund` (новый), `/contacts`, `/seller` под гибридную модель НПД (TaskList #2)
- [ ] **#2 Pre-launch баннер** — тонкая полоска вверху сайта (TaskList #3)
- [ ] **#3 Split-чекаут** — свои агенты → активный YooKassa, сторонние → «Запросить доступ» (TaskList #4)
- [ ] **#4 access_requests** — таблица + форма waitlist + Drizzle migration (TaskList #5)
- [ ] **#5 Тарифы продавцов** — Free/Pro/Featured + биллинг через YooKassa-Самозанятый (TaskList #6)
- [ ] **#6 Telegram-бот модератора** — уведомления о новых лидах/агентах/подписках (TaskList #7)
- [ ] **#7 Дашборд продавца** — просмотры, заявки, биллинг (TaskList #8)

### Внешние блокеры (на пользователе)

- [ ] Регистрация НПД через «Мой налог» (5 мин)
- [ ] Подача заявки в ЮКасса-Самозанятый (после готовности страниц на сайте)
- [ ] Создание Telegram-бота через @BotFather для модерации (опционально)

### Что НЕ делаем в Фазе 0

- Не трогаем `cryptomus.ts` — Cryptomus нужен только в Фазе 1 для иностранцев
- Не пилим YooKassa Marketplace split-логику — это Фаза 2 (после ИП)
- Не открываем приём платежей от сторонних агентов — запрещено 422-ФЗ
- Не удаляем готовый код Marketplace — оставляем закомментированным/отключённым feature-флагом, чтобы переключить в Фазе 2

---

## ARCHIVED — Session 2026-04-25 (hero shader / branding)

> Закрыто в HANDOFF_2026-04-27. Hero-плазма live, лого выбрано (вариант D — h-monogram), favicon заменён, dark mode форсирован.

### Hero — DONE
- [x] Veo промпт → `output/branding/veo-prompt.md`
- [x] mp4/webm/poster в `public/hero-bg.*`
- [x] Интегрирован в hero как `<video>`, удалён `HeroBlobCanvas` и `HeroDashboardMock` (последнее — частично)
- [x] `prefers-reduced-motion` — poster only
- [x] Refs cleanup (`output/hero-shader-mockup/`, `output/lockin*`)

### Логотип — DONE
- [x] 4 варианта в `output/branding/logo-*.svg`
- [x] Выбран вариант D — h-monogram + cyan dot
- [x] `src/components/branding/HireonMark.tsx` — компоненты HireonMark + HireonLogo
- [x] Header использует только HireonMark (22×22px, dark theme)
- [x] Favicon → `src/app/icon.svg` (Next.js auto-detect)
- [x] Lowercase «hireon» в metadata + всех страницах
- [x] Логин-страница тоже на HireonMark (закрыто в текущей сессии 2026-04-28)

### UX cleanup — DONE
- [x] Settings cleanup — `DeleteAccountCard` перенесён, settings убран из навигации
- [x] Onboarding copy — переписан

### Старое: Resend / Cryptomus currency / rename
- [ ] Resend API key (внешний блокер) → email verification — отложено до Фазы 1
- [x] Cryptomus `createCheckout` end-to-end currency — закрыто в `28af027`
- [x] Rename `cryptmusWalletAddress` → `cryptomusWalletAddress` — закрыто в `5c04056`

### Отложено / не делаем
- Custom_build (друг из lock-in.agency публикуется как обычный агент)
- Claude Managed Agents (MVP-1 модератор)
- Escrow/баланс при отсутствии онбординга (требует юриста)
- ENCRYPTION_KEY ротация
- CAPTCHA (заменили per-IP rate limiting)

---

## ARCHIVED — Session 2026-04-21 (security review)

> Полностью закрыто. OWASP Top 10 пройден, prod-gate зелёный кроме Resend (внешний блокер). Детали — в `infra/security/*.md` и git log по тегам `security:` / `fix:`.

**Ключевые блоки done:**
- HTTP-заголовки + Nginx hardening (CSP, HSTS, TLS 1.2/1.3)
- Rate limiting (auth/checkout/onboarding) + fail2ban
- Auth: cookies secure+httpOnly+sameSite=lax, Telegram auth_date 60s, trustedOrigins
- API ownership/role-checks на всех 23 роутах
- Docker: CapDrop ALL, no-new-privileges, ReadonlyRootfs, seccomp default
- Платежи: idempotency для YooKassa+Cryptomus, IP/sig binding, server-side amount calc
- AES-256-GCM шифрование, validate key length, BetterAuth secret 32+ bytes
- Trivy image scan baseline + remediation (5 чистых, ai-support-bot accepted-risk)
- npm audit + Dependabot weekly

---

## Already done на момент Session 2026-04-28

- Telegram Login (HMAC, deterministic password, self-heal)
- Light theme дефолт (потом отброшен в `e97962f` — force dark)
- YooKassa recurring cron window [-24h, +24h]
- systemd timers (yookassa-recurring, cryptomus-payout-retry)
- SSL hireon.agency, rebrand
- Phase C core: ProviderPicker, onboarding flow, IP allowlist, split-math
- Account deletion endpoint (`35a0820`) + перенос в settings (`b8ee7b8`)

---

## Что НЕ делаем в этой сессии

- Не трогаем design (hero/process steps live, branding закрыт)
- Не трогаем security baseline (закрыто 2026-04-21)
- Не пилим Marketplace-эквайринг (требует ИП = Фаза 1)
- Не открываем платежи для сторонних агентов (422-ФЗ запрещает агентство НПД)
