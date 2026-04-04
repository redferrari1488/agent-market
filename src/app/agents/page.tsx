import { Suspense } from "react";
import type { Metadata } from "next";
import { createServerClient } from "@/lib/supabase";
import { AgentGrid } from "@/components/agents/AgentGrid";
import { AgentFilters } from "@/components/agents/AgentFilters";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Каталог AI-агентов — AgentMarket",
  description:
    "Выберите готового AI-агента для вашего бизнеса. Поддержка, контент, аналитика, мониторинг и продажи.",
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

  const supabase = await createServerClient();

  let query = supabase
    .from("agents")
    .select(
      "id, slug, name, description, category, price_monthly, rating_avg, rating_count, purchases_count, features, status"
    )
    .eq("status", "published");

  // Фильтр по категории
  if (params.category) {
    query = query.eq("category", params.category);
  }

  // Поиск по названию/описанию
  if (params.q) {
    query = query.or(
      `name.ilike.%${params.q}%,description.ilike.%${params.q}%`
    );
  }

  // Сортировка
  switch (params.sort) {
    case "price_asc":
      query = query.order("price_monthly", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price_monthly", { ascending: false });
      break;
    case "rating":
      query = query.order("rating_avg", { ascending: false });
      break;
    case "newest":
      query = query.order("created_at", { ascending: false });
      break;
    default:
      query = query.order("purchases_count", { ascending: false });
  }

  const { data: agents } = await query;

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
        <AgentGrid agents={agents || []} />
      </div>
    </div>
  );
}
