-- Seed: 3 стартовых агента платформы (seller_id = NULL → админские, без комиссии)
-- Запускать после миграции. Можно запускать повторно — использует ON CONFLICT.

INSERT INTO agents (
  slug, name, description, long_description,
  category, pricing_model, price_monthly, price_onetime,
  docker_image, features, setup_schema, env_template, status
) VALUES
(
  'telegram-support-bot',
  'Telegram Support Bot',
  'Отвечает клиентам в Telegram 24/7 через OpenAI с учётом вашего FAQ.',
  'Автоматический саппорт-бот для Telegram. Принимает сообщения пользователей, генерирует ответы через OpenAI с учётом загруженного FAQ-документа и вашей инструкции. Работает круглосуточно, не требует присутствия оператора.

Что внутри:
- Живые ответы по смыслу на основе вашего FAQ
- Контекстный поиск по базе знаний
- История диалогов для каждого пользователя
- Логи всех сообщений',
  'support',
  'subscription',
  190000, NULL,
  'agentmarket/telegram-support-bot:latest',
  '["Ответы 24/7", "Контекст из FAQ", "GPT-4 под капотом", "Логи диалогов"]'::jsonb,
  '[
    {"key":"TELEGRAM_BOT_TOKEN","label":"Telegram Bot Token","type":"password","required":true},
    {"key":"SYSTEM_PROMPT","label":"Инструкция для бота (роль, задачи, тон)","type":"textarea","required":true},
    {"key":"ALLOWED_TELEGRAM_USERNAMES","label":"Whitelist Telegram-юзернеймов JSON-массивом (или [] для всех)","type":"json_array","required":false}
  ]'::jsonb,
  '{}'::jsonb,
  'published'
),
(
  'content-writer',
  'Content Writer',
  'Пишет посты в Telegram-канал по расписанию в вашем тоне и тематике.',
  'Автоматический контент-райтер. Генерирует посты через OpenAI на заданную тематику в выбранном тоне и публикует их в Telegram-канал по расписанию. Работает как виртуальный SMM-специалист.

Что внутри:
- Генерация текстов в вашем стиле
- Публикация по расписанию (любая частота)
- Поддержка нескольких каналов
- Пишет в вашем тоне',
  'content',
  'subscription',
  150000, NULL,
  'agentmarket/content-writer:latest',
  '["Автопостинг по расписанию", "Ваш tone of voice", "GPT-4", "Любая частота публикаций"]'::jsonb,
  '[
    {"key":"TOPIC","label":"Тематика канала","type":"text","required":true},
    {"key":"TONE","label":"Тон публикаций (деловой / casual / экспертный)","type":"textarea","required":true},
    {"key":"POST_INTERVAL_HOURS","label":"Интервал постинга, часы","type":"select","options":["6","12","24","48"],"required":true},
    {"key":"TELEGRAM_BOT_TOKEN","label":"Telegram Bot Token","type":"password","required":true},
    {"key":"CHANNEL_ID","label":"ID Telegram-канала","type":"text","required":true}
  ]'::jsonb,
  '{"AI_PROVIDER":"claude","AI_MODEL":"anthropic/claude-haiku-4-5","POST_INTERVAL_HOURS":"24"}'::jsonb,
  'published'
),
(
  'competitor-monitor',
  'Competitor Monitor',
  'Следит за сайтами конкурентов и шлёт саммари изменений раз в день.',
  'Ежедневный мониторинг сайтов конкурентов. Парсит указанные URL, сравнивает с предыдущей версией, GPT делает краткое саммари изменений и отправляет отчёт в Telegram.

Что внутри:
- Автоматический сбор данных с сайтов
- Понятные сводки изменений
- Отчёты в Telegram
- История версий',
  'monitoring',
  'both',
  250000, 990000,
  'agentmarket/competitor-monitor:latest',
  '["Ежедневный мониторинг", "GPT-саммари изменений", "Отчёты в Telegram", "История версий"]'::jsonb,
  '[
    {"key":"COMPETITOR_URLS","label":"URL конкурентов JSON-массивом","type":"json_array","required":true},
    {"key":"BUSINESS_DESC","label":"Опиши свой бизнес — для контекста сравнения","type":"textarea","required":true},
    {"key":"TELEGRAM_BOT_TOKEN","label":"Telegram Bot Token для отчётов","type":"password","required":true},
    {"key":"CHAT_ID","label":"Telegram Chat ID для отчётов","type":"text","required":true},
    {"key":"CHECK_INTERVAL_HOURS","label":"Интервал проверки, часы","type":"select","options":["12","24","48"],"required":false}
  ]'::jsonb,
  '{"AI_PROVIDER":"claude","AI_MODEL":"anthropic/claude-sonnet-4-6","CHECK_INTERVAL_HOURS":"24"}'::jsonb,
  'published'
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  long_description = EXCLUDED.long_description,
  pricing_model = EXCLUDED.pricing_model,
  price_monthly = EXCLUDED.price_monthly,
  price_onetime = EXCLUDED.price_onetime,
  features = EXCLUDED.features,
  setup_schema = EXCLUDED.setup_schema,
  status = EXCLUDED.status;
