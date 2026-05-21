-- Phase A агент-страницы v3: отдельные структурированные списки
-- «подходит / не подходит» для рендера двух карточек side-by-side
-- (вместо парсинга long_description). См. drafts/agent-page-v3-handoff.md
-- если есть; и chat-историю с Claude Design о v3-agent-page.html.

ALTER TABLE agents
  ADD COLUMN IF NOT EXISTS fits_for     TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS not_fits_for TEXT[] NOT NULL DEFAULT '{}';
