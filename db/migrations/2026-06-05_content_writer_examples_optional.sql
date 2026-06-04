-- content-writer: EXAMPLES → опционально.
-- Новый канал без готовых постов не мог пройти онбординг — EXAMPLES было
-- required. Код (main.py) и entrypoint.sh уже трактуют пустой EXAMPLES как ""
-- (просто без few-shot примеров), поэтому меняем только setup_schema.
-- Точечный jsonb-update: правим required у элемента key='EXAMPLES', остальные
-- поля (label/help/placeholder) и порядок шагов wizard'а сохраняем.
UPDATE agents
SET setup_schema = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'key' = 'EXAMPLES'
         THEN elem || '{"required": false}'::jsonb
         ELSE elem END
    ORDER BY ord
  )
  FROM jsonb_array_elements(setup_schema) WITH ORDINALITY AS t(elem, ord)
)
WHERE slug = 'content-writer';
