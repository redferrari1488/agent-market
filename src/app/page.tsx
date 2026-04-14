import type { Metadata } from "next";
import { db } from "@/lib/db";
import { agents } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { LandingAnimations } from "@/components/landing/LandingAnimations";

export const metadata: Metadata = {
  title: "AgentMarket - готовые AI-агенты для бизнеса",
  description:
    "Поддержка, контент, аналитика и мониторинг. Выбираете готового агента, подключаете свои ключи и управляете им из кабинета.",
  openGraph: {
    title: "AgentMarket - готовые AI-агенты для бизнеса",
    description:
      "Поддержка, контент, аналитика и мониторинг. Выбираете готового агента, подключаете свои ключи и управляете им из кабинета.",
    type: "website",
  },
};

export default async function Home() {
  const topAgents = await db
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
    features: a.features,
    status: a.status,
  }));

  return <LandingAnimations agents={mappedAgents} />;
}
