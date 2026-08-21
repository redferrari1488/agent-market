Pre-launch readiness pass, продолжение.
Прошлая сессия 2026-05-16 (вторая половина) закрыла security review,
сделала research по крипто-провайдерам, почистила устаревшие комментарии
из старой 12%-комиссионной модели.

═══════════════════════════════════════════════════════════════════════════════
КОНТЕКСТ (прочитать в первую очередь)
═══════════════════════════════════════════════════════════════════════════════

1. /Users/monkmode/agent-market/CLAUDE.md — стек, env, схема, deploy
2. /Users/monkmode/agent-market/PROJECT_CONTEXT.md — последняя запись
3. memory/MEMORY.md — индекс, читать [[handoff-pre-launch]],
   [[pre-launch-strategy]], [[managed-keys-post-phase0]]
4. Прод: hireon.agency, IP <VPS_IP>, /opt/agent-market.
   SSH: ssh root@<VPS_IP>.
   Deploy:
   git push && ssh root@<VPS_IP> 'cd /opt/agent-market && git pull &&
   docker compose up -d --build app'
5. Дизайн-исходник: /tmp/hireon-redesign/1605/project/ (распакованный
   tar.gz от Claude Design). Файлы: hireon-tokens.jsx, hireon-shared.jsx,
   hireon-headers.jsx, hireon-heroes.jsx, hireon-mobile-full.jsx,
   hireon-pr.jsx. Чат с дизайнером — 1605/chats/chat1.md.
6. Архивы для Claude Design лежат на ~/Desktop/ (прошлая сессия
   готовила, дизайнер упал — юзер вернётся к нему когда поднимется):
   hireon-landing-code.zip (45 KB), hireon-screenshots.zip (32 MB).

═══════════════════════════════════════════════════════════════════════════════
ЧТО УЖЕ СДЕЛАНО (2026-05-16)
═══════════════════════════════════════════════════════════════════════════════

ПЕРВАЯ ПОЛОВИНА ДНЯ — РЕДИЗАЙН (в проде):
- 029b601 Hero A (3D floating card + engineering grid + OKLCH палитра)
  + Header floating pill + Onest шрифт + design tokens --hr-*.
- 85842a4 Полный мобильный лендинг (StatusStrip, ThreeSteps, CatalogSection,
  SellerSection) через @media .hr-desktop-only / .hr-mobile-only.
- 03154a4 Убрана pulse-animation, ротация active card 1.8s → 4.2s,
  мобильный hero без overflow.

ВТОРАЯ ПОЛОВИНА ДНЯ — SECURITY + CLEANUP:
- 8ebb892 CLAUDE.md fix: на платформе OPENROUTER_API_KEY, в контейнер
  агента прокидывается как OPENAI_API_KEY (OpenAI SDK совместим).
  БЛОКЕР 3 закрыт.
- 4740d54 Security P1+M1+M3 fixes:
  • app-layer rate-limit на /api/checkout (5r/min/user),
    /api/seller/become (3/hour), /api/account/delete (3/hour).
    Раньше src/lib/rate-limit.ts существовал но нигде не вызывался.
  • Cryptomus webhook signature: timingSafeEqual вместо `!==`.
  • getClientIp() trust x-real-ip от nginx приоритет над x-forwarded-for.
- def7ca9 Cleanup устаревших 88%/12% комментариев. Старая модель
  «12% комиссии, продавец получает 88%» уже была переписана на
  Phase 0 = 0% (sellerPayout=100%, platformCommission=0), но комментарии
  в 8 файлах оставались. Логика не менялась, только тексты.

ЗАКРЫТЫЕ БЛОКЕРЫ ПЕРВОЙ ПОЛОВИНЫ:
- 401753e auto-deploy после save конфига (был paused, не должен).
- 0b6c8be закрыта дыра zombie-подписок без оплаты.
- 54f2b3a UI отвязки карты для ЮКассы.

ЮКАССА:
- Webhook URL настроен (https://hireon.agency/api/webhooks/yookassa),
  инфраструктура работает (webhook'и 30 апреля приходили с 200).
- В чате поддержки тикет на активацию recurring для shopID 1334693.
  Заявка передана СБ ЮКассы ~1-2 рабочих дня от 2026-05-16.
  Имя магазина: HIREON.AG. Оборот заявлен 30-80к ₽/мес → 150к ₽/мес.

SECURITY REVIEW — ИТОГ (полный аудит сделан):
ВСЁ ОК:
- AES-256-GCM шифрование (IV 12 байт, AuthTag, ENCRYPTION_KEY проверка)
- BetterAuth куки (HttpOnly + Secure на https + SameSite=lax)
- CSP с nonce + strict-dynamic в src/proxy.ts
- /api/account/delete: fresh session (10 мин) + email confirmation +
  transaction + audit log + admin self-delete блок
- SQL injection: все sql`` через template без user-input
- Docker isolation: CapDrop ALL, no-new-privileges, PidsLimit 512,
  NanoCpus, ReadonlyRootfs + tmpfs noexec для Python-агентов
- API authz: getUser() + role check во всех seller/admin routes
- YooKassa IP-whitelist: корректный CIDR парсинг для IPv4 + IPv6
- Webhook idempotency: provider_payment_id check

VPS (SSH-проверено на <VPS_IP>):
- .env permissions 600 root:root
- postgres только 127.0.0.1:5432
- app только 127.0.0.1:3000
- nginx:alpine в docker-compose: HSTS preload, X-Frame DENY,
  X-Content-Type-Options nosniff, Referrer-Policy, Permissions-Policy,
  TLS 1.2/1.3 only, ECDHE-only ciphers, server_tokens off,
  client_max_body_size 1M, return 444 на unknown Host
- nginx rate-limit zones: auth_general 20r/m, auth_telegram 40r/m,
  checkout 10r/m, seller_onboarding 6r/m
- unattended-upgrades работают (последний 15 мая)
- В docker logs секретов нет

OPEN POST-LAUNCH (Low priority, не блокеры):
- ufw inactive (защита уже через docker bind на 127.0.0.1, но defence
  in depth: ufw allow 22,80,443/tcp && ufw enable)
- external_url валидатор протокола (поле в схеме есть, но ни одним API
  не пишется — теоретический риск)
- Docker image whitelist (опирается на ручную модерацию)

═══════════════════════════════════════════════════════════════════════════════
ПРИОРИТЕТ 1 — ДИЗАЙН: полировка лендинга
═══════════════════════════════════════════════════════════════════════════════

Юзер пошёл к Claude Design, тот упал. Архивы готовы (на ~/Desktop/):
- hireon-landing-code.zip — точка входа + landing components + globals.css
- hireon-screenshots.zip — 9 скринов (desktop + mobile) + видео мерцания

ПРОБЛЕМЫ ИЗ ПРОШЛОЙ СЕССИИ (от юзера):
1. Мерцание плавающего мока на десктопе после 03154a4 НЕ ушло.
   Подозрения: hr-scanline 14s/22s через teal-обводку, hr-glow-drift,
   hr-float 7s, или React rerender. Открыть DevTools → Animations tab.
2. Юзер сказал «много чего криво на ленде» — нужен визуальный pass
   по всем секциям, breakpoint'ам 881-1024px, z-index стычкам.
3. Footer и PreLaunchBanner не переделаны под новый стиль.

ДЕЙСТВИЕ: когда юзер вернётся с правками от Claude Design — применить.
Если правок нет — пройти DevTools-пасс самому, локализовать мерцание.

═══════════════════════════════════════════════════════════════════════════════
ПРИОРИТЕТ 2 — МИГРАЦИЯ Cryptomus → NowPayments
═══════════════════════════════════════════════════════════════════════════════

РЕШЕНИЕ ПРИНЯТО В ПРОШЛОЙ СЕССИИ. Use-case юзера: «принимаем крипту от
тех у кого она есть (BTC/USDT/SOL/USDC), fiat-on-ramp с РУ-карты нас не
интересует — это нереализуемо ни одним gateway на 2026».

ПРИЧИНЫ УХОДА С CRYPTOMUS:
- FINTRAC (Канада) штраф CAD 177M в окт 2025 за AML — рекорд для
  крипто-процессоров.
- TRM Labs: hundreds of millions USD через Cryptomus с Garantex
  (закрытым санкционированным RU-обменником), Иран, CSAM, human
  trafficking.
- Cryptomus создали клон Heleket как escape hatch.
- Reputational hit: tainted USDT через Cryptomus адреса блокируется
  Bybit/OKX P2P — продавцу может прилететь блок аккаунта.
- Single point of failure для inbound + payout.

ПОЧЕМУ NowPayments (а не OxaPay/Plisio/Heleket):
- UK-юрисдикция, FCA-friendly, чистая репутация.
- 0.5% комиссия (vs 2% Cryptomus).
- 350+ криптовалют включая BTC, ETH, USDT TRC20/ERC20/BEP20, USDC, SOL.
- Webhook signature HMAC-SHA512 (vs MD5 у Cryptomus — крепче).
- API похож на Cryptomus, переписать ~4-6 часов.
- Recurring не нативный — эмулируем cron'ом как для YooKassa (уже есть).

ПЛАН РАБОТ:
1. Зарегистрировать аккаунт на nowpayments.io, пройти KYB (бизнес-KYC).
2. Получить ENV vars: NOWPAYMENTS_API_KEY, NOWPAYMENTS_IPN_SECRET,
   опционально NOWPAYMENTS_PAYOUT_API_KEY (если будут payouts).
3. Создать src/lib/payments/nowpayments.ts по интерфейсу PaymentProvider
   (см. src/lib/payments/provider.ts):
   - createCheckout — POST /v1/invoice
   - handleWebhook — verify HMAC-SHA512 через timingSafeEqual, ответ
     /v1/payment/list для idempotency
   - payoutToSeller — POST /v1/payout (если нужны автопэйауты)
   - cancelSubscription — no-op (нативного recurring нет)
4. Routes /api/webhooks/cryptomus → /api/webhooks/nowpayments.
5. Регистрация провайдера в src/lib/payments/index.ts.
6. Миграция БД: subscriptions.payment_provider enum
   ('yookassa', 'cryptomus') → ('yookassa', 'nowpayments').
   Если в проде есть подписки с payment_provider='cryptomus' (а у нас
   их 0 после cleanup zombie) — мигрируем на 'nowpayments' или null.
7. UI: PurchaseButton, CheckoutForm — заменить cryptomus → nowpayments.
8. ENV vars на VPS (.env): добавить NOWPAYMENTS_*, удалить CRYPTOMUS_*.
9. Smoke-test: создать подписку, оплатить $1 USDT-TRC20, проверить
   webhook 200, статус subscription, payout (если применим).
10. После успеха — удалить src/lib/payments/cryptomus.ts и связанный
    код. Обновить instructions/payments.md.

⚠️ ВАЖНО: миграцию делать осторожно. Backup БД на VPS через pg_dump
ДО любых ALTER TYPE на enum. Можно сделать в feature-branch и слить
после smoke-test.

═══════════════════════════════════════════════════════════════════════════════
ПРИОРИТЕТ 3 — ЖДЁМ ЮКАССУ (могло прийти за ночь)
═══════════════════════════════════════════════════════════════════════════════

- Проверить почту юзера на ответ от ЮКассы (~1-2 рабочих дня от 16 мая).
- Если активировали recurring — реальный E2E прогон:
  • Создать тестовую подписку, оплатить настоящей картой
  • Проверить provider_payment_id заполняется
  • Проверить expires_at выставляется через webhook
  • Дождаться cron yookassa-recurring (раз в сутки)
  • Проверить что вторая оплата проходит автоматом
- Если запросили доп. инфо — собрать ответ.
- Mock-подписка 6fb66bc6-ea84-4bd7-b127-e56a7f31ac72 (Мониторинг сайтов,
  paused, scheyaah081@gmail.com) держим в БД пока заявка на проверке.
  После активации recurring — удалить:
  ssh root@<VPS_IP> 'cd /opt/agent-market && docker compose exec -T
  postgres psql -U agentmarket -d agentmarket -c "DELETE FROM
  subscriptions WHERE id = '\''6fb66bc6-ea84-4bd7-b127-e56a7f31ac72'\'';"'

═══════════════════════════════════════════════════════════════════════════════
ПРИОРИТЕТ 4 — Launch post (контент)
═══════════════════════════════════════════════════════════════════════════════

- Лонгрид «Как я создал маркетплейс AI-агентов» для VC.ru / Habr /
  Telegram канала. Простой человеческий язык, без AI-slop. Можно
  код-сниппеты и тех. детали.
- Источники: git log, memory/, CLAUDE.md, instructions/.
- ОБЯЗАТЕЛЬНО: тире через дефис «-», не «—». Без эмодзи. 800-1500 слов.
- Сохранить в drafts/launch-post.md.
- Делать в последнюю очередь, после полировки лендинга.

═══════════════════════════════════════════════════════════════════════════════
ПРИОРИТЕТ 5 — Research, не блокеры
═══════════════════════════════════════════════════════════════════════════════

CLAUDE MANAGED AGENTS (опционально):
- Anthropic Managed Agents — публичная фича на 2026-05 (есть skill
  claude-api). Сейчас: OpenRouter + платформенный ключ для Hireon.
- Research: pros/cons для нашего сценария, что менять в архитектуре,
  deal breakers, цена/лимиты.
- Не делать миграцию — 1 страница max, рекомендация в drafts/.

LOCK-IN AGENCY коллаба (process design):
- Lock-in Agency делает агентов под заказ: клиент пишет → код пишут →
  агент на маркетплейсе.
- Опиши процесс: где клиент оставляет request, как Lock-in трекает,
  как агент попадает в каталог, кто платит и как делятся, SLA.
- Возможно мини-таблица custom_requests? Спросить юзера ДО реализации.

PR-МАТЕРИАЛЫ (опционально):
- В дизайн-бандле /tmp/hireon-redesign/1605/project/hireon-pr.jsx —
  PR форматы для рекламы запуска: 1:1 типографический пост 1080×1080,
  1:1 v2 с продуктовой карточкой, 9:16 story, 16:9 баннер.
- Сделать когда лендинг будет отполирован. Источник — cream-палитра
  (.hireon-cream-scope в hireon-tokens.jsx).

═══════════════════════════════════════════════════════════════════════════════
QUALITY BAR
═══════════════════════════════════════════════════════════════════════════════
- Atomic коммиты + meaningful messages (стиль git log)
- Build green перед каждым deploy
- Не амендить опубликованные коммиты
- Не пушить миграции БД / payment-related без явного approval
- Перед миграциями — backup БД (pg_dump) на VPS

═══════════════════════════════════════════════════════════════════════════════
ЧЕГО НЕ ДЕЛАТЬ
═══════════════════════════════════════════════════════════════════════════════
- Не править CLAUDE.md и instructions/*.md без approval
- Не пушить .md документы кроме launch-post.md и обновлений drafts/
- Не плодить новые тех-долги под видом «улучшений»
- Не мигрировать с Cryptomus на NowPayments до того как юзер подтвердил
  что зарегистрировался на nowpayments.io и получил KYB approval
- НЕ запускать кричащих рекламных постов без полировки лендинга
