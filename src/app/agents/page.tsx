import { Suspense } from "react";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { agents } from "@/lib/db/schema";
import { eq, ilike, or, and, asc, desc } from "drizzle-orm";
import { AgentGrid } from "@/components/agents/AgentGrid";
import { AgentFilters } from "@/components/agents/AgentFilters";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Каталог AI-агентов — AgentMarket",
  description:
    "Выберите готового AI-агента для вашего бизнеса. Поддержка, контент, аналитика, мониторинг и продажи.",
  openGraph: {
    title: "Каталог AI-агентов — AgentMarket",
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
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold sm:text-4xl">Каталог агентов</h1>
        <p className="mt-2 text-muted-foreground">
          Готовые AI-агенты для любых задач. Выберите, подключите, работает.
        </p>
      </div>

      <Suspense fallback={<Skeleton className="h-32 w-full" />}>
        <AgentFilters />
      </Suspense>

      <div className="mt-8">
        <AgentGrid agents={mappedAgents} />
      </div>
    </div>
  );
}
