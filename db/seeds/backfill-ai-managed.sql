-- Phase 0: managed AI через OpenRouter (платформа подкидывает OPENAI_API_KEY).
-- Чистим setup_schema от пользовательских AI-полей: больше не спрашиваем у юзера.
UPDATE agents
SET setup_schema = COALESCE(
  (
    SELECT jsonb_agg(elem)
    FROM jsonb_array_elements(setup_schema) elem
    WHERE elem->>'key' NOT IN ('AI_PROVIDER','ANTHROPIC_API_KEY','OPENAI_API_KEY','API_KEY')
  ),
  '[]'::jsonb
)
WHERE seller_id IS NULL
  AND setup_schema IS NOT NULL
  AND jsonb_typeof(setup_schema) = 'array';

-- Переименовываем CLAUDE_MODEL -> AI_MODEL в env_template и переводим в OpenRouter-формат.
-- Ставим префикс anthropic/ только если его ещё нет.
UPDATE agents
SET env_template = jsonb_set(
  env_template - 'CLAUDE_MODEL',
  '{AI_MODEL}',
  to_jsonb(
    CASE
      WHEN env_template->>'CLAUDE_MODEL' LIKE 'anthropic/%'
        THEN env_template->>'CLAUDE_MODEL'
      ELSE 'anthropic/' || (env_template->>'CLAUDE_MODEL')
    END
  )
)
WHERE seller_id IS NULL
  AND env_template ? 'CLAUDE_MODEL';
