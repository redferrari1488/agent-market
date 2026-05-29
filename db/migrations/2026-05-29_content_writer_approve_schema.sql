-- content-writer: approve-flow + богатый бриф + sonnet.
-- Образ переписан на approve-flow (черновик в ЛС → кнопки → публикация только
-- одобренного) и теперь ТРЕБУЕТ OWNER_CHAT_ID (entrypoint.sh падает без него).
-- Старая setup_schema его не собирала → любая покупка валилась в restart loop.
-- Плюс: EXAMPLES/рубрики (рычаг качества), модель haiku→sonnet, честный текст.
-- Применять ПОСЛЕ ребилда образа agent-market/content-writer:latest.

UPDATE agents
SET
  description = 'Пишет посты для Telegram-канала в вашем стиле и присылает на одобрение — публикует только то, что вы подтвердили.',
  long_description = 'Генерирует черновики постов по вашим рубрикам и примерам и присылает вам в личку с кнопками «Опубликовать / Переписать / Пропустить». Можно ответить своим текстом — бот опубликует его. В канал попадает только одобрённое. Сам следит за интервалом и не теряет состояние после рестартов. AI включён в подписку.',
  features = '["Публикация только по вашему одобрению", "Пишет в стиле вашего канала по примерам", "Кнопки: опубликовать / переписать / свой текст", "AI включён в подписку"]'::jsonb,
  setup_schema = '[
    {"key":"TELEGRAM_BOT_TOKEN","label":"Telegram Bot Token","type":"text","required":true},
    {"key":"CHANNEL_ID","label":"ID или @username канала для публикации","type":"text","required":true},
    {"key":"OWNER_CHAT_ID","label":"Ваш Telegram chat_id (узнать у @userinfobot) — сюда бот шлёт черновики на одобрение","type":"text","required":true},
    {"key":"TOPIC","label":"Тема канала","type":"textarea","required":true},
    {"key":"TONE","label":"Тон публикаций","type":"textarea","required":true},
    {"key":"EXAMPLES","label":"2-4 реальных поста канала — бот копирует манеру (без примеров тексты выходят усреднёнными)","type":"textarea","required":true},
    {"key":"CONTENT_PILLARS","label":"Рубрики канала, по одной на строку (опционально)","type":"textarea","required":false},
    {"key":"AUDIENCE","label":"Кто читает канал (опционально)","type":"textarea","required":false},
    {"key":"FORMAT_RULES","label":"Правила формата: длина, эмодзи, хэштеги (опционально)","type":"textarea","required":false},
    {"key":"AVOID","label":"Темы, которых избегать (опционально)","type":"textarea","required":false},
    {"key":"POST_INTERVAL_HOURS","label":"Как часто присылать черновик, часов","type":"select","options":["6","12","24","48"],"required":false}
  ]'::jsonb,
  env_template = '{"AI_PROVIDER":"claude","AI_MODEL":"anthropic/claude-sonnet-4-6","POST_INTERVAL_HOURS":"24"}'::jsonb
WHERE slug = 'content-writer';
