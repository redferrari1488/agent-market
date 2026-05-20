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

// Featured trio показывается в секции «Каталог агентов» на главной.
// Прибиты гвоздями для лонча: 3 smoke-проверенных агента, понятные для СМБ.
// telegram-support-bot, review-responder-2gis, website-monitor вынесены в
// waitlist до пост-лонч фиксов (upstream-проблемы 2GIS HTML + changedetection
// API auth + silent ai-support-bot logs).
const LANDING_FEATURED_SLUGS = [
  "content-writer",
  "competitor-monitor",
  "news-digest-bot",
];

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
    slug: "content-writer",
    name: "Контент-копирайтер",
    description:
      "Пишет посты в ваш Telegram-канал в нужном тоне и по расписанию. Под рубрики, темы и ваш голос.",
    category: "content",
    priceMonthly: 99000,
    ratingAvg: 0,
    ratingCount: 0,
    purchasesCount: 0,
    features: [
      "Claude Sonnet 4.6 в подписке",
      "Расписание и черновики",
      "Стиль и тон под вас",
    ],
    status: "published",
  },
  {
    id: "dev-2",
    slug: "competitor-monitor",
    name: "Competitor Monitor",
    description:
      "Каждое утро короткий отчёт что конкуренты выкатили вчера. Без ручной разведки и открытых вкладок.",
    category: "monitoring",
    priceMonthly: 250000,
    ratingAvg: 0,
    ratingCount: 0,
    purchasesCount: 0,
    features: [
      "Ежедневный обход сайтов",
      "AI-сводка изменений",
      "Отчёты в Telegram",
    ],
    status: "published",
  },
  {
    id: "dev-3",
    slug: "news-digest-bot",
    name: "Новостной дайджест",
    description:
      "Утренний дайджест отрасли по вашим RSS и Telegram-каналам. Без болтовни, по делу.",
    category: "content",
    priceMonthly: 150000,
    ratingAvg: 0,
    ratingCount: 0,
    purchasesCount: 0,
    features: [
      "RSS + Telegram-каналы",
      "AI-краткое резюме",
      "Расписание утром",
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

  const featuredOrder = new Map(
    LANDING_FEATURED_SLUGS.map((slug, idx) => [slug, idx]),
  );
  topAgents.sort((a, b) => {
    const ai = featuredOrder.get(a.slug);
    const bi = featuredOrder.get(b.slug);
    if (ai !== undefined && bi !== undefined) return ai - bi;
    if (ai !== undefined) return -1;
    if (bi !== undefined) return 1;
    return b.purchasesCount - a.purchasesCount;
  });

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
