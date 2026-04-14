import { Suspense } from "react";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { agents } from "@/lib/db/schema";
import { eq, ilike, or, and, asc, desc } from "drizzle-orm";
import { AgentGrid } from "@/components/agents/AgentGrid";
import { AgentFilters } from "@/components/agents/AgentFilters";
import { Skeleton } from "@/components/ui/skeleton";
import { FadeIn } from "@/components/motion";
import {
  COMPUTE_CLASSES,
  DEFAULT_COMPUTE_CLASS,
  totalPrice,
  type ComputeClass,
} from "@/lib/compute";

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
      computeClass: agents.computeClass,
      ratingAvg: agents.ratingAvg,
      ratingCount: agents.ratingCount,
      purchasesCount: agents.purchasesCount,
      features: agents.features,
      status: agents.status,
    })
    .from(agents)
    .where(and(...conditions))
    .orderBy(orderBy);

  // Покупатель видит total (seller + compute). Sorting по priceMonthly — это
  // сортировка по цене продавца, что для S-класса совпадает с total, а для
  // смешанных классов отличается на фикс-сумму хостинга. Для MVP ок.
  const mappedAgents = rows.map((a) => {
    const classId: ComputeClass =
      a.computeClass && a.computeClass in COMPUTE_CLASSES
        ? (a.computeClass as ComputeClass)
        : DEFAULT_COMPUTE_CLASS;
    return {
      id: a.id,
      slug: a.slug,
      name: a.name,
      description: a.description,
      category: a.category,
      price_monthly:
        a.priceMonthly != null ? totalPrice(a.priceMonthly, classId) : null,
      rating_avg: a.ratingAvg,
      rating_count: a.ratingCount,
      purchases_count: a.purchasesCount,
      features: a.features,
      status: a.status,
    };
  });

  const totalCount = mappedAgents.length;
  const pluralize = (n: number) => {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod100 >= 11 && mod100 <= 19) return "агентов";
    if (mod10 === 1) return "агент";
    if (mod10 >= 2 && mod10 <= 4) return "агента";
    return "агентов";
  };

  return (
    <section className="mx-auto max-w-6xl px-5 sm:px-6">
      <div className="py-10 sm:py-16">
        <FadeIn>
          <div className="mb-8 sm:mb-10">
            <div className="flex items-baseline gap-3">
              <p className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Каталог
              </p>
              <span className="font-mono text-[11px] text-muted-foreground/40">·</span>
              <p className="font-mono text-[11px] tabular-nums text-muted-foreground/60">
                {totalCount} {pluralize(totalCount)}
              </p>
            </div>
            <h1 className="mt-2 text-[2rem] font-bold leading-[1.05] tracking-[-0.03em] sm:text-[2.75rem]">
              Готовые агенты
            </h1>
            <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-muted-foreground">
              Выберите агента по задаче. Подключайте за минуту - работает 24/7 без вашего участия.
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
