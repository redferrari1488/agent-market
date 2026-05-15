Pre-launch readiness pass, продолжение. Прошлая сессия закрыла блоки 1-2
(tech audit + первые фиксы + E2E). Эта - закрыть три критических блокера и
оставшиеся фазы 1, 4, 5, 6, 8.

═══════════════════════════════════════════════════════════════════════════════
КОНТЕКСТ (прочитать в первую очередь)
═══════════════════════════════════════════════════════════════════════════════

1. /Users/monkmode/agent-market/CLAUDE.md - стек, env, схема, deploy
2. /Users/monkmode/agent-market/PROJECT_CONTEXT.md - последняя запись от
   2026-05-15 содержит полный tech audit + список known limits
3. memory/MEMORY.md - индекс, читать [[handoff-pre-launch]],
   [[pre-launch-strategy]], [[managed-keys-post-phase0]]
4. Прод: hireon.agency, IP 77.239.104.149, /opt/agent-market.
   SSH: ssh root@77.239.104.149 (Tailscale 100.79.2.56 тоже работает).
   Deploy:
   git push && ssh root@77.239.104.149 'cd /opt/agent-market && git pull &&
   docker compose up -d --build app'

Стек кратко: Next 16 (App Router), Drizzle/PostgreSQL, BetterAuth, YooKassa
(live-ключи активны) + Cryptomus (не активирован), агенты в Docker через
dockerode, OpenRouter ($5 пополнен 2026-05-15) для AI (платформенный ключ,
модель anthropic/claude-sonnet-4-6).

═══════════════════════════════════════════════════════════════════════════════
ЧТО УЖЕ СДЕЛАНО (2026-05-15)
═══════════════════════════════════════════════════════════════════════════════

Tech audit + OpenRouter audit (блок 1):
- OpenRouter работает на проде live, баланс $5, реальный chat completion 200
- YooKassa live-ключи активны, checkout боевой
- Cryptomus НЕ активирован, его cron-timer (payout-retry) отключён
- systemd timers живы: db-backup ежедневно, yookassa-recurring ежедневно
- Docker isolation работает (CapDrop ALL, no-new-privileges, ReadonlyRootfs)
- Сторонний tracking_bot убран с VPS
- TELEGRAM_ADMIN_CHAT_ID настроен (6707714139), уведомления в @hireon_agency_bot

Фиксы (блок 2, все в проде):
- 060049a /seller submit: autoprefix https + русские zod-сообщения
  (БД seller_applications была пустая - никто не доходил до submit)
- 2e2f737 admin-notify: await notifyAdmin + лог 4xx (раньше void игнорировал)
- 30490d3 docker-compose: TELEGRAM_ADMIN_CHAT_ID + RESEND_* env в app-контейнер
- e7acf63 XS compute class 10₽ + agents-src/echo-agent для E2E
- 918d89e расхардкодили FIXED_COMPUTE_CLASS=M в /agents/[slug]/page.tsx
  БОНУС: S-агенты (call-analytics, lead-qualifier) переплачивали 400₽/мес
  из-за этого хардкода - теперь читает реальный compute_class из БД
- 93fc321 echo-agent: openai>=1.60 (совместимость с httpx>=0.28)
- ad8a17e docker-compose: /var/run/docker.sock + group_add 988 в app
  (без этого ENOENT при попытке deployContainer - блокер post-payment flow)

E2E прогон полностью прошёл: оплата → webhook (handled manually на этот раз)
→ deployContainer → docker → OpenRouter → Claude → AI-ответ в логах UI.
Тестовая subscription и контейнер удалены. Тестовый агент e2e-echo-test
переведён в status=draft (виден только админу), сам образ echo-agent:latest
и XS compute class остаются на VPS для будущих тестов.

scheyaah081@gmail.com промоутнут в admin - доступ к /admin/applications,
/admin/agents и т.п.

═══════════════════════════════════════════════════════════════════════════════
ТРИ КРИТИЧЕСКИХ БЛОКЕРА (закрыть до запуска рекламы)
═══════════════════════════════════════════════════════════════════════════════

БЛОКЕР 1 - YooKassa Webhook URL не настроен (САМЫЙ ВАЖНЫЙ)
──────────────────────────────────────────────────────────────────────────────
При E2E юзер оплатил 20₽, но webhook на наш сервер НЕ пришёл - в логах
nginx и app за весь период тишина. Без webhook каждый покупатель платит,
но subscription остаётся в pending_setup ВЕЧНО, агент не запускается.

Действие юзера (НЕ Claude):
1. https://yookassa.ru/my -> Интеграция -> HTTP-уведомления
2. Добавить URL: https://hireon.agency/api/webhooks/yookassa
3. Включить события: payment.succeeded, payment.canceled
4. Сохранить

Тест: сделать тестовую покупку 10-20₽, в логах app/nginx должен появиться
POST /api/webhooks/yookassa с 200. provider_payment_id в subscriptions
заполнится автоматически.

Claude может: создать новый тестовый агент через INSERT (как echo-agent был),
наблюдать за логами, после успешного webhook - закрыть как done.

БЛОКЕР 2 - paused-аномалия при первичной оплате
──────────────────────────────────────────────────────────────────────────────
В E2E subscription d754c9ec... после оплаты оказалась в status=paused
вместо pending_setup. По коду webhook ставит pending_setup, paused только
из yookassa-recurring cron при 3 failed charges. Откуда взялся paused при
первой оплате - не разобрались.

Гипотезы:
- cron yookassa-recurring сработал на subscription без provider_payment_id
  и где-то нашёл совпадение с expires_at в окне
- какая-то логика в /api/subscriptions/[id]/start (нажатие "Запустить" при
  ENOENT) поставила paused
- что-то в обработке /api/checkout/route.ts:127 - там status=pending_setup
  ставится сразу при создании, не pending - возможно с этим связано

Действие: воспроизвести (можно с тестовым агентом + ручным triggering
webhook через payments.coinbase.com или curl эмулятор). Найти где
status=paused ставится при первом checkout и пофиксить.

БЛОКЕР 3 - CLAUDE.md устарел про env-имя
──────────────────────────────────────────────────────────────────────────────
CLAUDE.md строка 106 говорит "OPENAI_API_KEY (OpenRouter)" - реально host
env называется OPENROUTER_API_KEY (это в коде src/lib/docker.ts:126).
Внутри контейнера маппится в OPENAI_API_KEY + OPENAI_BASE_URL.

Также в блоке Env Vars CLAUDE.md (строки 73-99) переменная OPENROUTER_API_KEY
вообще отсутствует. И DOCKER_HOST=ssh://user@vps-ip устарел - в реальности
на проде используется socketPath fallback (теперь явно через volume mount).

Действие: правка CLAUDE.md требует approval юзера (см. правила). Спросить
и обновить эти места + добавить OPENROUTER_API_KEY в блок Env Vars.

═══════════════════════════════════════════════════════════════════════════════
ОСТАВШИЕСЯ ФАЗЫ (порядок: безопасность → research → процессы → контент)
═══════════════════════════════════════════════════════════════════════════════

ФАЗА 1 - SECURITY REVIEW (блокер запуска)
──────────────────────────────────────────────────────────────────────────────
Запустить /security-review. Дополнительно вручную проверить:
- Webhook signatures: YooKassa (IP-whitelist уже работает), Cryptomus (HMAC)
- AES-256-GCM: ENCRYPTION_KEY не в логах, IV уникальный на encrypt
- BetterAuth: cookies HttpOnly/Secure/SameSite, CSRF
- API routes: проверка user/role перед чтением чужих данных
- /api/account/delete: защита от подмены id
- Docker spawn: no host volume mounts из user-input, resource limits ok
- SSRF в external_url агентов
- Rate limiting на /api/checkout, /api/auth/*, /api/seller/become
  ВАЖНО: в src/lib/rate-limit.ts есть util, но grep по src/app/api показал
  что НИГДЕ не вызывается. Это P1 - добавить минимум на checkout/auth.
- CSP в Header - strict-dynamic, nonce
- SQL injection - raw SQL с конкатенацией
- Прод .env на VPS - права 600, не закоммичены ключи

Закрыть Critical/High, Medium - в issue list для после launch.

ФАЗА 4 - Claude Managed Agents (research + рекомендация)
──────────────────────────────────────────────────────────────────────────────
Anthropic Managed Agents - публичная фича на 2026-05 (есть skill claude-api).
Сейчас: OpenRouter + платформенный ключ для Hireon-агентов.

Research:
- pros/cons для нашего сценария (готовые агенты на подписке)
- что пришлось бы поменять в архитектуре
- deal breakers
- цена / лимиты

Не делать миграцию - 1 страница max, рекомендация.

ФАЗА 8 - Cryptomus vs альтернативы (research + решение)
──────────────────────────────────────────────────────────────────────────────
ОЧЕНЬ ВАЖНЫЙ research учитывая опыт юзера 2026-05-15 с Bybit P2P и
обменниками - юзер на своей шкуре прошёл квест "купить $5 крипты с РУ
карты", потратил ~2 часа. Его типичный покупатель столкнётся с тем же.
Это сильнейший аргумент за fiat-on-ramp в виджете оплаты.

Сравнить: NowPayments, BitPay, Coinbase Commerce, Plisio, CoinPayments,
Cryptomus (текущий) - по:
- KYC на мерчанте (юзер хочет МИНИМУМ KYC)
- Выплаты в RUB/USDT (юзер хочет рубли на свою карту/банк)
- Fiat-on-ramp в виджете для покупателя (КЛЮЧЕВОЕ - покупатель должен
  платить картой через crypto-on-ramp, а не "отправьте 0.0234 BTC")
- Комиссии, доступность в РФ, поддержка СБП/карт через crypto-rails
- Простота интеграции при миграции

Прочитать instructions/payments.md и src/app/api/webhooks/cryptomus/,
src/app/api/checkout/ - что у нас уже накодено и насколько глубоко зашит
Cryptomus (sunk cost vs миграция).

Не мигрировать - рекомендация + scope работ.

ФАЗА 5 - Lock-in Agency коллаба (process design)
──────────────────────────────────────────────────────────────────────────────
Lock-in Agency делает агентов под заказ: клиент пишет -> код пишут -> агент
на маркетплейсе. Опиши процесс:
1. Где клиент оставляет request (форма? Telegram? отдельный flow?)
2. Как Lock-in получает заявку и трекает её
3. Когда код готов - как агент попадает в каталог
4. Кто платит и как делятся деньги
5. SLA: сроки, ответственность за качество

Это процесс-дизайн, возможно мини-таблица custom_requests? Спросить юзера
ДО реализации.

ФАЗА 6 - Launch post "Как я создал маркетплейс AI-агентов"
──────────────────────────────────────────────────────────────────────────────
Лонгрид для VC.ru / Habr / Telegram канала. Простой человеческий язык,
без AI-slop. Можно код-сниппеты и тех. детали.

Источники: git log (полная история), memory/, CLAUDE.md, instructions/.

Структура (предложить свою или эту):
- Зачем (промпты не работают, бизнес хочет готовое)
- Стек и почему такой
- Фейлы и решения (несколько реальных, из git)
- Где сейчас (Phase 0, набор первой волны)
- Призыв (стать продавцом / купить)

ОБЯЗАТЕЛЬНО: тире через дефис "-", не "—". Без эмодзи. 800-1500 слов.
Сохранить в drafts/launch-post.md.

═══════════════════════════════════════════════════════════════════════════════
QUALITY BAR
═══════════════════════════════════════════════════════════════════════════════
- Atomic коммиты + meaningful messages (стиль git log)
- Build green перед каждым deploy
- Не амендить опубликованные коммиты
- Не пушить миграции БД / payment-related без явного approval
- Перед миграциями - backup БД (pg_dump) на VPS

═══════════════════════════════════════════════════════════════════════════════
ЧЕГО НЕ ДЕЛАТЬ
═══════════════════════════════════════════════════════════════════════════════
- Не трогать дизайн (warm Claude Design зафиксен)
- Не добавлять фичи вне scope без approval
- Не править instructions/*.md и CLAUDE.md без approval (БЛОКЕР 3 - тоже
  approval нужен перед правкой)
- Не писать .md документы кроме launch-post.md и обновлений PROJECT_CONTEXT.md
- Длинные тире "—" нигде в новом тексте

═══════════════════════════════════════════════════════════════════════════════
ПЕРВЫЙ ХОД В СЕССИИ
═══════════════════════════════════════════════════════════════════════════════
1. Прочитать контекстные файлы (без меня)
2. Дать short status проду
3. Спросить какой блокер/фазу стартуем первой. Рекомендация: БЛОКЕР 1
   (YooKassa webhook URL) первым - блокирует все будущие платежи. Затем
   БЛОКЕР 2 (paused-аномалия) + ФАЗА 1 (security). Research-фазы (4, 8) и
   launch-post (6) - в конце.
4. Не писать длинных summaries - юзер видит diff
