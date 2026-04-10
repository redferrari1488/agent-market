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
    <div className="relative">
      {/* Glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[500px] overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[400px] w-[800px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-violet-600/15 blur-[120px]" />
        <div className="absolute right-0 top-1/4 h-[300px] w-[300px] rounded-full bg-blue-600/10 blur-[100px]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mb-8 max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Каталог{" "}
            <span className="bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              агентов
            </span>
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
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
    </div>
  );
}
