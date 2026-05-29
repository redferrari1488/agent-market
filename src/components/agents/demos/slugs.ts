// Plain TS module — V3-slugs (slug-и, для которых вместо длинного лендинга
// рендерится компактная V3 split-card). Читается и сервером (page.tsx),
// и клиентом (Header.tsx). Не использовать "use client" — иначе Next.js
// заворачивает экспорты в client-ref, и `Set.has` ломается на сервере.
//
// Источник истины: обязан совпадать с ключами DEMOS в registry.tsx.

export const V3_SLUGS = new Set<string>([
  "review-responder-2gis",
  "telegram-support-bot",
  "content-writer",
  "competitor-monitor",
  "news-digest-bot",
  "website-monitor",
  "lead-qualifier-amocrm",
  "call-analytics-roistat",
]);
