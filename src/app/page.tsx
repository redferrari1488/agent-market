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
// Прибиты гвоздями для лонча: понятные не-tech ЦА сценарии (контент в TG,
// саппорт клиентов 24/7, ответы на отзывы в 2GIS). Остальные опубликованные
// агенты сортируются по purchases_count desc после featured.
const LANDING_FEATURED_SLUGS = [
  "content-writer",
  "telegram-support-bot",
  "review-responder-2gis",
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
    slug: "telegram-support-bot",
    name: "Telegram Support Bot",
    description:
      "Отвечает клиентам 24/7 по вашей базе ответов. Понимает контекст вопроса и пишет живо.",
    category: "support",
    priceMonthly: 490000,
    ratingAvg: 0,
    ratingCount: 0,
    purchasesCount: 0,
    features: [
      "База FAQ в один файл",
      "Передаёт сложное менеджеру",
      "Telegram-бот за 5 минут",
    ],
    status: "published",
  },
  {
    id: "dev-3",
    slug: "review-responder-2gis",
    name: "Ответы на отзывы 2GIS",
    description:
      "Готовит ответы на отзывы клиентов в 2GIS в тоне бренда. Вы только проверяете и отправляете.",
    category: "support",
    priceMonthly: 590000,
    ratingAvg: 0,
    ratingCount: 0,
    purchasesCount: 0,
    features: [
      "Подхватывает новые отзывы",
      "Тон и стиль вашего бренда",
      "Черновики на проверку",
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
