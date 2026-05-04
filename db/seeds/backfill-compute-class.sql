-- Phase 0 simplification: все админские агенты переводим на M.
-- Цена для покупателя единая «всё включено» (M = 790 ₽/мес: хостинг + AI).
UPDATE agents
SET compute_class = 'M'
WHERE seller_id IS NULL AND compute_class <> 'M';
