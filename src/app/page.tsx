import type { Metadata } from "next";
import { db } from "@/lib/db";
import { agents } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { LandingAnimations } from "@/components/landing/LandingAnimations";
import { normalizeAgentFeatureList } from "@/lib/agent-copy";

export const metadata: Metadata = {
  title: "hireon - готовые AI-агенты для бизнеса",
  description:
    "Поддержка, контент, аналитика, мониторинг и любые другие задачи бизнеса. Выбираете готового агента, AI-модель уже подключена, управляете из кабинета.",
  openGraph: {
    title: "hireon - готовые AI-агенты для бизнеса",
    description:
      "Поддержка, контент, аналитика, мониторинг и любые другие задачи бизнеса. Выбираете готового агента, AI-модель уже подключена, управляете из кабинета.",
    type: "website",
  },
};

type TopAgent = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string | null;
  priceMonthly: number | null;
  ratingAvg: number;
  ratingCount: number;
  purchasesCount: number;
  features: unknown;
  status: string;
};

const DEV_DEMO_AGENTS: TopAgent[] = [
  {
    id: "dev-1",
    slug: "site-monitor",
    name: "Мониторинг сайтов",
    description:
      "Сайт упал? Узнаешь первым, до клиентов. Любые 4xx/5xx и diff контента — push в Telegram за 60 секунд.",
    category: "monitoring",
    priceMonthly: 250000,
    ratingAvg: 0,
    ratingCount: 0,
    purchasesCount: 0,
    features: [
      "Готовый движок changedetection.io",
      "Telegram-уведомления",
      "До 20 URL",
    ],
    status: "published",
  },
  {
    id: "dev-2",
    slug: "competitor-monitor",
    name: "Competitor Monitor",
    description:
      "Каждое утро — отчёт что конкуренты выкатили вчера. Без открытых вкладок и ручной разведки.",
    category: "monitoring",
    priceMonthly: 250000,
    ratingAvg: 0,
    ratingCount: 0,
    purchasesCount: 0,
    features: [
      "Ежедневный мониторинг",
      "Короткие понятные сводки",
      "Отчёты в Telegram",
    ],
    status: "published",
  },
  {
    id: "dev-3",
    slug: "news-digest",
    name: "Новостной дайджест",
    description:
      "Утренний дайджест отрасли по твоим RSS и Telegram-каналам. Без болтовни — только то, что нужно.",
    category: "content",
    priceMonthly: 150000,
    ratingAvg: 0,
    ratingCount: 0,
    purchasesCount: 0,
    features: [
      "Поддержка нескольких RSS",
      "AI-переписывание в тоне бренда",
      "Ограничение постов за цикл",
    ],
    status: "published",
  },
];

export default async function Home() {
  let topAgents: TopAgent[] = [];
  try {
    topAgents = await db
      .select({
        id: agents.id,
        slug: agents.slug,
        name: agents.name,
        description: agents.description,
        category: agents.category,
        priceMonthly: agents.priceMonthly,
        ratingAvg: agents.ratingAvg,
        ratingCount: agents.ratingCount,
        purchasesCount: agents.purchasesCount,
        features: agents.features,
        status: agents.status,
      })
      .from(agents)
      .where(eq(agents.status, "published"))
      .orderBy(desc(agents.purchasesCount))
      .limit(20);
  } catch (err) {
    // Don't bring down the landing page if DB is unreachable.
    // Silent для ECONNREFUSED в dev (нет локального Postgres) — overlay
    // от Next.js DevTools на console.error мешает прев'ю дизайна.
    // В prod (DB всегда есть) этой ветки достичь невозможно, но если вдруг
    // ляжет — warn чтобы попало в server logs без overlay-эскалации.
    const msg = err instanceof Error ? err.message : String(err);
    const isConnRefused = /ECONNREFUSED/i.test(msg);
    if (!isConnRefused) {
      console.warn("[home] failed to load agents, rendering empty:", err);
    }
  }

  // Dev-only fallback: если БД недоступна или пуста — подсунуть 3 демо-агента
  // чтобы секция "Каталог агентов" не исчезала в локальном превью.
  // В prod БД всегда есть и непустая, эта ветка тогда не отрабатывает.
  if (topAgents.length === 0 && process.env.NODE_ENV !== "production") {
    topAgents = DEV_DEMO_AGENTS;
  }

  const mappedAgents = topAgents.map((a) => ({
    id: a.id,
    slug: a.slug,
    name: a.name,
    description: a.description,
    category: a.category,
    price_monthly: a.priceMonthly,
    rating_avg: a.ratingAvg,
    rating_count: a.ratingCount,
    purchases_count: a.purchasesCount,
    features: normalizeAgentFeatureList(a.features),
    status: a.status,
  }));

  return <LandingAnimations agents={mappedAgents} />;
}
