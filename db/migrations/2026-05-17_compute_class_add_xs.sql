-- Расширить compute_class constraint: добавить XS (10₽/мес).
-- XS уже определён в src/lib/compute.ts как «E2E-тестовый/микро-агенты»,
-- но БД-constraint отставал от кода и блокировал INSERT/UPDATE с XS.

ALTER TABLE agents DROP CONSTRAINT IF EXISTS agents_compute_class_check;
ALTER TABLE agents
  ADD CONSTRAINT agents_compute_class_check
  CHECK (compute_class IN ('XS', 'S', 'M', 'L'));
