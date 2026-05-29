INSERT INTO agents (
  seller_id,
  slug,
  name,
  description,
  long_description,
  category,
  pricing_model,
  price_monthly,
  price_onetime,
  docker_image,
  features,
  setup_schema,
  env_template,
  compute_class,
  needs_cron,
  status
) VALUES (
  NULL,
  'content-writer',
  'Контент-бот для Telegram',
  'Пишет посты для Telegram-канала в вашем стиле и присылает на одобрение — публикует только то, что вы подтвердили.',
  $$Генерирует черновики постов по вашим рубрикам и примерам и присылает вам в личку с кнопками «Опубликовать / Переписать / Пропустить». Можно ответить своим текстом — бот опубликует его. В канал попадает только одобрённое. Сам следит за интервалом и не теряет состояние после рестартов. AI включён в подписку.$$,
  'content',
  'subscription',
  150000,
  NULL,
  'agent-market/content-writer:latest',
  '["Публикация только по вашему одобрению", "Пишет в стиле вашего канала по примерам", "Кнопки: опубликовать / переписать / свой текст", "AI включён в подписку"]'::jsonb,
  '[
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
  '{"AI_PROVIDER":"claude","AI_MODEL":"anthropic/claude-sonnet-4-6","POST_INTERVAL_HOURS":"24"}'::jsonb,
  'M',
  false,
  'published'
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO agents (
  seller_id,
  slug,
  name,
  description,
  long_description,
  category,
  pricing_model,
  price_monthly,
  price_onetime,
  docker_image,
  features,
  setup_schema,
  env_template,
  compute_class,
  needs_cron,
  status
) VALUES (
  NULL,
  'competitor-monitor',
  'Монитор конкурентов',
  'Сравнивает сайты конкурентов и шлёт Telegram-отчёт по важным изменениям.',
  $$Сохраняет текстовые снимки страниц конкурентов, строит diff и собирает AI-выжимку по изменениям. Подходит для ежедневного слежения за офферами, лендингами и продуктовыми страницами без ручного обхода сайтов.$$,
  'analytics',
  'subscription',
  250000,
  NULL,
  'agent-market/competitor-monitor:latest',
  '["Diff по изменениям", "AI-сводка для бизнеса", "До 10 URL в мониторинге", "Отчёты в Telegram"]'::jsonb,
  '[
    {"key":"COMPETITOR_URLS","label":"URL конкурентов JSON-массивом","type":"json_array","required":true},
    {"key":"TELEGRAM_BOT_TOKEN","label":"Telegram Bot Token","type":"text","required":true},
    {"key":"CHAT_ID","label":"Telegram Chat ID","type":"text","required":true},
    {"key":"BUSINESS_DESC","label":"Описание вашего бизнеса","type":"textarea","required":true},
    {"key":"CHECK_INTERVAL_HOURS","label":"Интервал проверки, часов","type":"select","options":["12","24","48"],"required":false}
  ]'::jsonb,
  '{"AI_PROVIDER":"claude","AI_MODEL":"anthropic/claude-sonnet-4-6","CHECK_INTERVAL_HOURS":"24"}'::jsonb,
  'M',
  false,
  'published'
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO agents (
  seller_id,
  slug,
  name,
  description,
  long_description,
  category,
  pricing_model,
  price_monthly,
  price_onetime,
  docker_image,
  features,
  setup_schema,
  env_template,
  compute_class,
  needs_cron,
  status
) VALUES (
  NULL,
  'website-monitor',
  'Мониторинг сайтов',
  'Следит за изменениями на сайтах и присылает уведомления в Telegram.',
  $$Запускает настроенный экземпляр changedetection.io и один раз засевает список URL через внутренний API. Подходит для общего мониторинга страниц, карточек товаров, прайсов и любых сайтов, где нужны быстрые Telegram-уведомления.$$,
  'monitoring',
  'subscription',
  250000,
  NULL,
  'agent-market/website-monitor:latest',
  '["Готовый движок changedetection.io", "Telegram-уведомления", "До 20 URL", "Постоянное хранилище состояния"]'::jsonb,
  '[
    {"key":"WATCH_URLS","label":"URL для мониторинга JSON-массивом","type":"json_array","required":true},
    {"key":"TELEGRAM_BOT_TOKEN","label":"Telegram Bot Token","type":"text","required":true},
    {"key":"CHAT_ID","label":"Telegram Chat ID","type":"text","required":true},
    {"key":"CHECK_INTERVAL_MINUTES","label":"Интервал проверки, минут","type":"select","options":["30","60","180","360","720","1440"],"required":false}
  ]'::jsonb,
  '{"CHECK_INTERVAL_MINUTES":"360","PORT":"5000","BASE_URL":"http://localhost:5000"}'::jsonb,
  'M',
  false,
  'published'
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO agents (
  seller_id,
  slug,
  name,
  description,
  long_description,
  category,
  pricing_model,
  price_monthly,
  price_onetime,
  docker_image,
  features,
  setup_schema,
  env_template,
  compute_class,
  needs_cron,
  status
) VALUES (
  NULL,
  'news-digest-bot',
  'Новостной дайджест',
  'Забирает новости из RSS, переписывает их и публикует в Telegram-канал.',
  $$Следит за RSS-лентами, отмечает уже просмотренные записи и превращает новые новости в короткие посты для канала. На первом запуске создаёт baseline без исторического спама и дальше публикует только свежие элементы.$$,
  'content',
  'subscription',
  150000,
  NULL,
  'agent-market/news-digest-bot:latest',
  '["Поддержка нескольких RSS", "AI-переписывание в тоне бренда", "Ограничение постов за цикл", "Без дублей после рестарта"]'::jsonb,
  '[
    {"key":"TELEGRAM_BOT_TOKEN","label":"Telegram Bot Token","type":"text","required":true},
    {"key":"CHANNEL_ID","label":"ID или @username канала","type":"text","required":true},
    {"key":"RSS_FEEDS","label":"RSS-ленты JSON-массивом","type":"json_array","required":true},
    {"key":"TONE","label":"Тон публикаций","type":"textarea","required":true},
    {"key":"FETCH_INTERVAL_MINUTES","label":"Интервал опроса, минут","type":"select","options":["15","30","60","120","360","1440"],"required":false},
    {"key":"MAX_POSTS_PER_CYCLE","label":"Максимум постов за цикл","type":"select","options":["1","3","5","10"],"required":false}
  ]'::jsonb,
  '{"AI_PROVIDER":"claude","AI_MODEL":"anthropic/claude-haiku-4-5","FETCH_INTERVAL_MINUTES":"60","MAX_POSTS_PER_CYCLE":"5"}'::jsonb,
  'M',
  false,
  'published'
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO agents (
  seller_id,
  slug,
  name,
  description,
  long_description,
  category,
  pricing_model,
  price_monthly,
  price_onetime,
  docker_image,
  features,
  setup_schema,
  env_template,
  compute_class,
  needs_cron,
  status
) VALUES (
  NULL,
  'review-responder-2gis',
  'Ответы на отзывы 2GIS',
  'Ловит новые отзывы 2GIS и присылает владельцу AI-черновики ответов.',
  $$Отслеживает новые отзывы филиала в 2GIS, отбирает важные кейсы и отправляет владельцу готовые черновики в Telegram. Подходит для ручного approve-процесса, когда нужен быстрый ответ без прямой автопубликации в 2GIS.$$,
  'support',
  'subscription',
  200000,
  NULL,
  'agent-market/review-responder-2gis:latest',
  '["Мониторинг новых отзывов", "Черновики ответов в тоне бренда", "Кнопки одобрения и пропуска", "AI включён в подписку"]'::jsonb,
  '[
    {"key":"TWOGIS_BRANCH_ID","label":"ID филиала 2GIS","type":"text","required":true},
    {"key":"TELEGRAM_BOT_TOKEN","label":"Telegram Bot Token","type":"text","required":true},
    {"key":"OWNER_CHAT_ID","label":"Telegram Chat ID владельца","type":"text","required":true},
    {"key":"BRAND_TONE","label":"Тон бренда","type":"textarea","required":true},
    {"key":"CHECK_INTERVAL_MINUTES","label":"Интервал проверки, минут","type":"select","options":["30","60","120","240","360"],"required":false},
    {"key":"TWOGIS_PUBLIC_KEY","label":"Публичный ключ 2GIS, если известен","type":"text","required":false}
  ]'::jsonb,
  '{"AI_PROVIDER":"claude","AI_MODEL":"anthropic/claude-sonnet-4-6","CHECK_INTERVAL_MINUTES":"120"}'::jsonb,
  'M',
  false,
  'published'
)
ON CONFLICT (slug) DO NOTHING;
