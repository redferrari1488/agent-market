import type { Metadata } from "next";
import { db } from "@/lib/db";
import { agents } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { LandingAnimations } from "@/components/landing/LandingAnimations";
import { normalizeAgentFeatureList } from "@/lib/agent-copy";

export const metadata: Metadata = {
  title: "hireon - готовые AI-агенты для бизнеса",
  description:
    "Поддержка, контент, аналитика, мониторинг и любые другие задачи бизнеса. Выбираете готового агента, подключаете свои ключи и управляете им из кабинета.",
  openGraph: {
    title: "hireon - готовые AI-агенты для бизнеса",
    description:
      "Поддержка, контент, аналитика, мониторинг и любые другие задачи бизнеса. Выбираете готового агента, подключаете свои ключи и управляете им из кабинета.",
    type: "website",
  },
};

export default async function Home() {
  let topAgents: Array<{
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
  }> = [];
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
      .limit(3);
  } catch (err) {
    // Don't bring down the landing page if DB is unreachable.
    console.error("[home] failed to load agents, rendering empty:", err);
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
