import { Suspense } from "react";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { agents } from "@/lib/db/schema";
import { eq, ilike, or, and, asc, desc } from "drizzle-orm";
import { AgentGrid } from "@/components/agents/AgentGrid";
import { AgentFilters } from "@/components/agents/AgentFilters";
import { Skeleton } from "@/components/ui/skeleton";
import { FadeIn } from "@/components/motion";

export const metadata: Metadata = {
  title: "Каталог AI-агентов - AgentMarket",
  description:
    "Выберите готового AI-агента для вашего бизнеса. Поддержка, контент, аналитика, мониторинг и продажи.",
  openGraph: {
    title: "Каталог AI-агентов - AgentMarket",
    description: "Готовые AI-агенты для бизнеса. Поддержка, контент, аналитика, мониторинг.",
  },
};

type SearchParams = Promise<{
  category?: string;
  sort?: string;
  q?: string;
}>;

export default async function AgentsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  const conditions = [eq(agents.status, "published")];

  if (params.category) {
    conditions.push(eq(agents.category, params.category));
  }

  if (params.q) {
    conditions.push(
      or(
        ilike(agents.name, `%${params.q}%`),
        ilike(agents.description, `%${params.q}%`)
      )!
    );
  }

  let orderBy;
  switch (params.sort) {
    case "price_asc":
      orderBy = asc(agents.priceMonthly);
      break;
    case "price_desc":
      orderBy = desc(agents.priceMonthly);
      break;
    case "rating":
      orderBy = desc(agents.ratingAvg);
      break;
    case "newest":
      orderBy = desc(agents.createdAt);
      break;
    default:
      orderBy = desc(agents.purchasesCount);
  }

  const rows = await db
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
    .where(and(...conditions))
    .orderBy(orderBy);

  const mappedAgents = rows.map((a) => ({
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

  return (
    <section className="mx-auto max-w-6xl px-5 sm:px-6">
      <div className="py-12 sm:py-16">
        <FadeIn>
          <div className="mb-10">
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Каталог
            </p>
            <h1 className="mt-2 text-[2rem] font-bold tracking-[-0.03em] sm:text-[2.5rem]">
              Агенты
            </h1>
            <p className="mt-2 max-w-lg text-[15px] text-muted-foreground">
              Готовые AI-агенты для любых задач. Выберите, подключите, работает.
            </p>
          </div>
        </FadeIn>

        <Suspense fallback={<Skeleton className="h-12 w-full" />}>
          <AgentFilters />
        </Suspense>

        <div className="mt-8">
          <AgentGrid agents={mappedAgents} animated />
        </div>
      </div>
    </section>
  );
}
