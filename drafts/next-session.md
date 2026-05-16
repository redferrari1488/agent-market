Pre-launch readiness pass, продолжение. Прошлая сессия 2026-05-16 закрыла
2 блокера и заложила редизайн (Hero + Header + мобильный лендинг), но
осталось много полировки + 5 research/launch фаз + ожидание решения от
СБ ЮКассы по recurring.

═══════════════════════════════════════════════════════════════════════════════
КОНТЕКСТ (прочитать в первую очередь)
═══════════════════════════════════════════════════════════════════════════════

1. /Users/monkmode/agent-market/CLAUDE.md — стек, env, схема, deploy
2. /Users/monkmode/agent-market/PROJECT_CONTEXT.md — последняя запись
3. memory/MEMORY.md — индекс, читать [[handoff-pre-launch]],
   [[pre-launch-strategy]], [[managed-keys-post-phase0]]
4. Прод: hireon.agency, IP 77.239.104.149, /opt/agent-market.
   SSH: ssh root@77.239.104.149.
   Deploy:
   git push && ssh root@77.239.104.149 'cd /opt/agent-market && git pull &&
   docker compose up -d --build app'
5. Дизайн-исходник: /tmp/hireon-redesign/1605/project/ (распакованный
   tar.gz от Claude Design). Файлы: hireon-tokens.jsx, hireon-shared.jsx,
   hireon-headers.jsx, hireon-heroes.jsx, hireon-mobile-full.jsx,
   hireon-pr.jsx. Чат с дизайнером — 1605/chats/chat1.md.

═══════════════════════════════════════════════════════════════════════════════
ЧТО УЖЕ СДЕЛАНО (2026-05-16)
═══════════════════════════════════════════════════════════════════════════════

ЗАКРЫТЫЕ БЛОКЕРЫ:
- 401753e fix(subscriptions): auto-deploy после save конфига, не paused.
  Причина — /api/subscriptions/[id]/config ставил status=paused, хотя
  paused зарезервирован для (1) ручного стопа, (2) recurring failures.
- 0b6c8be fix(checkout): закрыть дыру с zombie-подписками без оплаты.
  Причина — createCheckout фейлился на 403 «recurring forbidden», но
  subscription оставалась в БД pending_setup → reused: true → юзер
  попадал в SetupWizard и контейнер деплоился без оплаты. Фикс:
  cleanup на провале createCheckout + provider_payment_id IS NOT NULL
  гейт на existing-check + SetupWizard виден только при наличии
  provider_payment_id (иначе экран «Ожидание оплаты»).

UI ДЛЯ ЮКАССЫ:
- 54f2b3a feat(dashboard): UI отвязки карты — отдельный блок «Способ
  оплаты» в ManageView с кнопкой «Отвязать карту» (требование СБ ЮКассы).

РЕДИЗАЙН (Hero + Header + мобильный лендинг):
- 029b601 feat(landing): Hero A с 3D floating card + engineering grid,
  Header floating pill, шрифт Onest, design tokens --hr-* + keyframes
  в globals.css, shared примитивы в landing/redesign/shared.tsx.
- 85842a4 feat(landing): полный мобильный лендинг (StatusStrip,
  ThreeSteps, CatalogSection, SellerSection) с @media-разделением
  .hr-desktop-only / .hr-mobile-only.
- 03154a4 fix(landing): убрать pulse-animation мерцание, замедлить
  ротацию active card 1.8s → 4.2s, мобильный hero без overflow.

CLEANUP БД:
- 8 zombie-подписок удалены (status=pending_setup, provider_payment_id=NULL).
- В ЮКассе финансах 0 сделок — никто реально не платил, всё было обход.
- e2e-echo-test возвращён в draft.

ЮКасса:
- Webhook URL уже настроен в ЛК (https://hireon.agency/api/webhooks/yookassa).
  Webhook'и от 77.75.x.x приходили 30 апреля, IP-фильтр пропускает,
  app возвращает 200. Инфраструктура работает.
- В чате поддержки ЮКассы создан тикет на активацию recurring для
  shopID 1334693. **Заявка передана СБ ЮКассы (~1-2 рабочих дня)**.
  Имя магазина для банка: HIREON.AG. Оборот заявлен 30-80к ₽/мес
  на старте, до 150к ₽/мес к 6-му месяцу (триггер перехода на ИП).

═══════════════════════════════════════════════════════════════════════════════
ПРИОРИТЕТ 1 — ДИЗАЙН: остановка мерцания + полировка
═══════════════════════════════════════════════════════════════════════════════

ПРОБЛЕМА: после коммита 03154a4 юзер всё ещё видит мерцание плавающего
мока на десктопе. Hard refresh не помог. Точный источник не локализован.

Кандидаты на мерцание (надо проверить через DevTools → Animations tab):
- hr-scanline 14s/22s — вертикальные линии раз в 14-22s проходят через
  teal-обводку, могут давать псевдо-flash при пересечении
- hr-glow-drift 14s — фоновый glow за карточкой, не должен мерцать
- hr-float 7s на FloatingCard — анимация всего контейнера, idle bob
- Сами border-color/box-shadow transitions на active card (4.2s ротация)
- Возможно motion.div в LandingAnimations.tsx с initial={{ opacity: 0 }}
  пере-рендерится из-за state и мигает

Действие: открыть DevTools на проде, во вкладке Animations поймать
конкретные кейфреймы которые крутятся в момент мерцания. Если scanlines —
убрать их или сделать opacity ниже. Если sub-rerender — стабилизировать
React-memoization.

ОСТАЛЬНОЕ КРИВОЕ НА ЛЕНДЕ (на десктопе и мобайле — юзер сказал «много чего»):
- Никто не делал визуального pass'а. Открыть в Chrome/Safari + iPhone,
  пройтись по всем секциям, выписать список багов.
- Конкретные кандидаты: переходы между секциями, отступы, типографика
  на промежуточных breakpoints (881-1024px tablet), z-index стычки,
  motion-animations.
- Engineering grid в Hero может уезжать при resize окна.
- Stat-grid 2x2 на мобайле может ломаться у iPhone SE (375px).
- Mobile menu overlay z-index с PreLaunchBanner.
- Глобальный Footer не вписывается в новый дизайн (его не переделывали).

ОПТИМИЗАЦИЯ (юзер хочет «полностью оптимизировать»):
- React.memo на тяжёлые компоненты (FloatingCard, CatalogPreview, EngGrid)
- Снизить частоту setInterval (eventCount тикает каждые 1400ms — нужен ли?)
- prefers-reduced-motion: отключать все hr-* анимации
- Lighthouse mobile/desktop, проверить CLS/LCP/INP
- Image optimization если будут картинки агентов
- Анализ bundle size после Onest шрифта (cyrillic + latin × 6 weights)

═══════════════════════════════════════════════════════════════════════════════
ПРИОРИТЕТ 2 — Ждём ЮКассу + Блокер 3
═══════════════════════════════════════════════════════════════════════════════

ЮКасса (ждём СБ):
- Проверить почту юзера на ответ от ЮКассы (1-2 рабочих дня от 2026-05-16).
- Если активировали recurring — сделать **реальный** E2E прогон с
  настоящей оплатой. Проверить что provider_payment_id заполняется,
  expires_at выставляется, cron yookassa-recurring отрабатывает.
- Если запросили доп. инфо — собрать ответ.
- Mock-подписка 6fb66bc6-ea84-4bd7-b127-e56a7f31ac72 (Мониторинг сайтов,
  paused, для юзера scheyaah081@gmail.com) держим в БД пока заявка
  на проверке — менеджер может пройти по URL из скрина. **После
  активации recurring — удалить**: docker compose exec -T postgres psql
  -U agentmarket -d agentmarket -c "DELETE FROM subscriptions WHERE id =
  '6fb66bc6-ea84-4bd7-b127-e56a7f31ac72';"

БЛОКЕР 3 — CLAUDE.md устарел (требует approval):
- Строка 106: «OPENAI_API_KEY (OpenRouter)» → реально OPENROUTER_API_KEY
  (см. src/lib/docker.ts:126).
- Блок Env Vars (73-99): добавить OPENROUTER_API_KEY.
- DOCKER_HOST=ssh://user@vps-ip устарел — используется socketPath fallback
  + volume mount /var/run/docker.sock.
- Спросить approval перед правкой.

═══════════════════════════════════════════════════════════════════════════════
ПРИОРИТЕТ 3 — Оставшиеся фазы из плана
═══════════════════════════════════════════════════════════════════════════════

ФАЗА 1 — SECURITY REVIEW (блокер запуска):
- Запустить /security-review. Дополнительно вручную проверить:
- Rate limiting на /api/checkout, /api/auth/*, /api/seller/become.
  В src/lib/rate-limit.ts util есть, но grep по src/app/api показывает
  что НИГДЕ не вызывается. P1 — добавить минимум на checkout/auth.
- Webhook signatures: YooKassa IP-whitelist уже работает, Cryptomus HMAC
  проверить.
- AES-256-GCM: ENCRYPTION_KEY не в логах, IV уникальный.
- BetterAuth: cookies HttpOnly/Secure/SameSite, CSRF.
- API routes: проверка user/role перед чтением чужих данных.
- /api/account/delete: защита от подмены id.
- Docker spawn: no host volume mounts из user-input, resource limits ok.
- SSRF в external_url агентов.
- CSP в Header — strict-dynamic, nonce.
- SQL injection — raw SQL с конкатенацией.
- Прод .env на VPS — права 600.
- Закрыть Critical/High, Medium — issue list для после launch.

ФАЗА 4 — Claude Managed Agents (research):
- Anthropic Managed Agents — публичная фича на 2026-05 (есть skill
  claude-api). Сейчас: OpenRouter + платформенный ключ для Hireon-агентов.
- Research: pros/cons для нашего сценария, что менять в архитектуре,
  deal breakers, цена/лимиты.
- Не делать миграцию — 1 страница max, рекомендация в drafts/.

ФАЗА 8 — Cryptomus vs альтернативы (research):
- ОЧЕНЬ ВАЖНО учитывая опыт юзера 2026-05-15 с Bybit P2P — типичный
  покупатель столкнётся с тем же квестом «купить $5 крипты с РУ карты»,
  потратит ~2 часа. Это аргумент за fiat-on-ramp в виджете оплаты.
- Сравнить: NowPayments, BitPay, Coinbase Commerce, Plisio, CoinPayments,
  Cryptomus (текущий) — по KYC на мерчанте, выплатам в RUB/USDT,
  fiat-on-ramp в виджете для покупателя, комиссиям, доступности в РФ.
- Прочитать instructions/payments.md и текущий src/lib/payments/cryptomus.ts.
- Не мигрировать — рекомендация + scope работ.

ФАЗА 5 — Lock-in Agency коллаба (process design):
- Lock-in Agency делает агентов под заказ: клиент пишет → код пишут →
  агент на маркетплейсе.
- Опиши процесс: где клиент оставляет request, как Lock-in трекает,
  как агент попадает в каталог, кто платит и как делятся, SLA.
- Возможно мини-таблица custom_requests? Спросить юзера ДО реализации.

ФАЗА 6 — Launch post (контент):
- Лонгрид «Как я создал маркетплейс AI-агентов» для VC.ru / Habr /
  Telegram канала. Простой человеческий язык, без AI-slop. Можно
  код-сниппеты и тех. детали.
- Источники: git log, memory/, CLAUDE.md, instructions/.
- ОБЯЗАТЕЛЬНО: тире через дефис «-», не «—». Без эмодзи. 800-1500 слов.
- Сохранить в drafts/launch-post.md.

═══════════════════════════════════════════════════════════════════════════════
ПРИОРИТЕТ 4 — PR-материалы из дизайна (опционально)
═══════════════════════════════════════════════════════════════════════════════

В дизайн-бандле /tmp/hireon-redesign/1605/project/hireon-pr.jsx — PR
форматы для рекламы запуска:
- 1:1 типографический пост 1080×1080
- 1:1 v2 с продуктовой карточкой и буллетами
- 9:16 story 1080×1920
- 16:9 баннер 1600×900 с лёгкой анимацией

Сделать когда лендинг будет отполирован. Источник — cream-палитра
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
- Не пушить .md документы кроме launch-post.md и обновлений
  PROJECT_CONTEXT.md / drafts/next-session.md
- Длинные тире «—» нигде в новом маркетинговом тексте (launch-post)
- Не добавлять фичи вне scope без approval
- Не трогать секции главного лендинга ниже Hero на десктопе без согласия
  (FlowCinematic, CATALOG grid, SELLER payout)

═══════════════════════════════════════════════════════════════════════════════
ПЕРВЫЙ ХОД В СЕССИИ
═══════════════════════════════════════════════════════════════════════════════
1. Прочитать контекстные файлы (без меня)
2. Дать short status проду + проверить почту юзера на ответ от ЮКассы
3. Спросить с чего стартуем. Рекомендация: ПРИОРИТЕТ 1 (дизайн —
   локализовать мерцание + полировка лендинга) первым, потому что это
   мешает запуску рекламы. Затем когда ЮКасса ответит — реальный E2E.
   Research-фазы (1/4/5/6/8) и launch-post — параллельно/после.
4. Не писать длинных summaries — юзер видит diff
