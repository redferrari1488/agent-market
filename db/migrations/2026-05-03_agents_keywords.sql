-- Phase 0: keyword-based scoring for the splash search.
--
-- Каталог /agents начинается со splash «что хотите автоматизировать?».
-- Чтобы scoring находил агента по описанию боли (а не точному имени),
-- держим явный массив ключевых слов: добавляем в БД, в форму продавца,
-- в admin-агентов засеваем руками.

BEGIN;

ALTER TABLE agents ADD COLUMN IF NOT EXISTS keywords text[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_agents_keywords ON agents USING gin (keywords);

-- Бэкфилл существующих admin/founder-агентов. Добавляем ключевые слова под
-- типовые боли пользователя — то, что человек напишет в splash-textarea.
UPDATE agents SET keywords = ARRAY[
  'контент','посты','telegram','канал','автопостинг','смм','тексты','писать','расписание','тон'
] WHERE slug = 'content-writer';

UPDATE agents SET keywords = ARRAY[
  'конкуренты','мониторинг','сайты','аналитика','следить','изменения','саммари','daily','digest','сравнение'
] WHERE slug = 'competitor-monitor';

UPDATE agents SET keywords = ARRAY[
  'мониторинг','сайт','доступность','uptime','следить','изменения','страница','telegram','уведомления'
] WHERE slug = 'website-monitor';

UPDATE agents SET keywords = ARRAY[
  'новости','дайджест','rss','утром','отрасль','сводка','мониторинг','подписка','telegram','digest'
] WHERE slug = 'news-digest-bot';

UPDATE agents SET keywords = ARRAY[
  '2gis','отзывы','репутация','клиенты','ответы','модерация','бренд','саппорт','поддержка','уведомления'
] WHERE slug = 'review-responder-2gis';

COMMIT;
