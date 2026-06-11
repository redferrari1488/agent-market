import type { Agent } from "@/components/agents/AgentCard";

// Общие данные интерактивного мока каталога (hero). Используются десктопным
// CatalogPreview (HeroSplit) и мобильным MobileCatalogMock — одна адаптация
// БД-агентов, один набор демо-фоллбеков, одни табы.

export const CAT_TOKEN: Record<string, { label: string; color: string }> = {
  monitoring: { label: "мониторинг", color: "var(--hr-cat-monitoring)" },
  content: { label: "контент", color: "var(--hr-cat-content)" },
  support: { label: "поддержка", color: "var(--hr-cat-support)" },
  analytics: { label: "аналитика", color: "var(--hr-cat-analytics)" },
  sales: { label: "продажи", color: "var(--hr-cat-sales)" },
};

export const FALLBACK_CAT = { label: "общее", color: "var(--hr-fg-3)" };

export const TABS = [
  "все",
  "поддержка",
  "контент",
  "аналитика",
  "продажи",
  "мониторинг",
];

export type CatalogAgent = {
  id: string;
  slug: string;
  cat: string;
  catKey: string;
  color: string;
  title: string;
  price: string;
  desc: string;
};

// Демо-карточки если БД пустая — мок должен выглядеть «как на дизайне»
// даже до первого опубликованного агента.
export const DEMO_AGENTS: CatalogAgent[] = [
  {
    id: "demo-1",
    slug: "telegram-support-bot",
    cat: "поддержка",
    catKey: "support",
    color: "var(--hr-cat-support)",
    title: "Бот поддержки в Telegram",
    price: "2 990 ₽",
    desc: "Отвечает 24/7, ведёт диалоги, эскалирует сложные.",
  },
  {
    id: "demo-2",
    slug: "content-writer",
    cat: "контент",
    catKey: "content",
    color: "var(--hr-cat-content)",
    title: "Контент-копирайтер",
    price: "990 ₽",
    desc: "Готовит еженедельный план постов и пишет драфты.",
  },
  {
    id: "demo-3",
    slug: "website-monitor",
    cat: "мониторинг",
    catKey: "monitoring",
    color: "var(--hr-cat-monitoring)",
    title: "Мониторинг сайтов",
    price: "1 490 ₽",
    desc: "Любые 4xx/5xx и diff контента — push в Telegram.",
  },
  {
    id: "demo-4",
    slug: "news-digest-bot",
    cat: "контент",
    catKey: "content",
    color: "var(--hr-cat-content)",
    title: "Новостной дайджест",
    price: "1 500 ₽",
    desc: "Сводка отрасли по твоим RSS и каналам утром.",
  },
  {
    id: "demo-5",
    slug: "competitor-monitor",
    cat: "мониторинг",
    catKey: "monitoring",
    color: "var(--hr-cat-monitoring)",
    title: "Мониторинг конкурентов",
    price: "2 500 ₽",
    desc: "Утренний отчёт что конкуренты выкатили вчера.",
  },
];

export function formatPrice(minor: number | null): string {
  if (!minor || minor <= 0) return "—";
  const rub = Math.floor(minor / 100);
  return `${rub.toLocaleString("ru-RU")} ₽`;
}

export function adaptAgents(agents: Agent[]): CatalogAgent[] {
  const real = agents
    .filter((a) => a.status === "published" && !a.is_external)
    .map((a) => {
      const catKey = a.category || "";
      const cat = CAT_TOKEN[catKey] || FALLBACK_CAT;
      return {
        id: a.id,
        slug: a.slug,
        cat: cat.label,
        catKey,
        color: cat.color,
        title: a.name,
        price: formatPrice(a.price_monthly),
        desc: a.description || "",
      };
    });
  // Fallback на demo если в БД меньше 5 опубликованных
  return real.length >= 5 ? real : DEMO_AGENTS;
}
