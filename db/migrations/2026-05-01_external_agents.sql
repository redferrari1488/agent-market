-- Phase 0: Outbound-ссылки для сторонних агентов + бренды для разделения каталога.
--
-- external_url — URL ресурса продавца (сайт, Telegram-бот, лендинг). Заполняется
-- для агентов с seller_id IS NOT NULL. Founder-агенты (seller_id IS NULL)
-- продаются через ЮКассу, для них external_url = NULL.
--
-- brand — маркер бренда для founder-агентов. Сейчас используется значение
-- 'hireon'. Под коллаб с Lock-in Agency зарезервировано 'lock_in'. Для
-- сторонних агентов brand = NULL (рендерятся во вкладке "От продавцов").

ALTER TABLE agents ADD COLUMN external_url TEXT;
ALTER TABLE agents ADD COLUMN brand TEXT;

-- Все существующие founder-агенты помечаем брендом 'hireon'.
UPDATE agents SET brand = 'hireon' WHERE seller_id IS NULL;
