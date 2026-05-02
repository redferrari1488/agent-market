import { Suspense } from "react";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { agents } from "@/lib/db/schema";
import { eq, ilike, or, and, asc, desc, isNull, isNotNull, sql, type SQL } from "drizzle-orm";
import { AgentGrid } from "@/components/agents/AgentGrid";
import { AgentFilters } from "@/components/agents/AgentFilters";
import { CatalogTabs, type CatalogTab } from "@/components/agents/CatalogTabs";
import { CatalogHero } from "@/components/agents/CatalogHero";
import { Skeleton } from "@/components/ui/skeleton";
import {
  COMPUTE_CLASSES,
  DEFAULT_COMPUTE_CLASS,
  totalPrice,
  type ComputeClass,
} from "@/lib/compute";

export const metadata: Metadata = {
  title: "Каталог AI-агентов - hireon",
  description:
    "Выберите готового AI-агента для вашего бизнеса. Поддержка, контент, аналитика, мониторинг и продажи.",
  openGraph: {
    title: "Каталог AI-агентов - hireon",
    description: "Готовые AI-агенты для бизнеса. Поддержка, контент, аналитика, мониторинг.",
  },
};

type SearchParams = Promise<{
  category?: string;
  sort?: string;
  q?: string;
  tab?: string;
}>;

const VALID_TABS: CatalogTab[] = ["all", "hireon", "lock_in", "external"];

function tabCondition(tab: CatalogTab): SQL | undefined {
  switch (tab) {
    case "hireon":
      return and(isNull(agents.sellerId), eq(agents.brand, "hireon"));
    case "lock_in":
      return and(isNull(agents.sellerId), eq(agents.brand, "lock_in"));
    case "external":
      return isNotNull(agents.sellerId);
    case "all":
    default:
      return undefined;
  }
}

export default async function AgentsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  const tab: CatalogTab =
    params.tab && (VALID_TABS as string[]).includes(params.tab)
      ? (params.tab as CatalogTab)
      : "all";

  // Считаем количества по группам, чтобы скрывать пустые вкладки.
  // Lock-in вкладка появится только когда у нас будут агенты с brand='lock_in'.
  const [counts] = await db
    .select({
      hireon: sql<number>`count(*) filter (where ${agents.sellerId} is null and ${agents.brand} = 'hireon')`.mapWith(Number),
      lockIn: sql<number>`count(*) filter (where ${agents.sellerId} is null and ${agents.brand} = 'lock_in')`.mapWith(Number),
      external: sql<number>`count(*) filter (where ${agents.sellerId} is not null)`.mapWith(Number),
      all: sql<number>`count(*)`.mapWith(Number),
    })
    .from(agents)
    .where(eq(agents.status, "published"));

  const conditions = [eq(agents.status, "published")];

  const tabCond = tabCondition(tab);
  if (tabCond) {
    conditions.push(tabCond);
  }

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
      sellerId: agents.sellerId,
      brand: agents.brand,
    })
    .from(agents)
    .where(and(...conditions))
    .orderBy(orderBy);

  // Покупатель видит total (seller + compute). Sorting по priceMonthly — это
  // сортировка по цене продавца, что для S-класса совпадает с total, а для
  // смешанных классов отличается на фикс-сумму хостинга. Для MVP ок.
  // У внешних агентов (seller_id != null) цену в каталоге не показываем —
  // покупка идёт у продавца, цены мы не контролируем.
  const mappedAgents = rows.map((a) => {
    const classId: ComputeClass =
      a.computeClass && a.computeClass in COMPUTE_CLASSES
        ? (a.computeClass as ComputeClass)
        : DEFAULT_COMPUTE_CLASS;
    const isExternal = a.sellerId != null;
    return {
      id: a.id,
      slug: a.slug,
      name: a.name,
      description: a.description,
      category: a.category,
      price_monthly:
        !isExternal && a.priceMonthly != null
          ? totalPrice(a.priceMonthly, classId)
          : null,
      rating_avg: a.ratingAvg,
      rating_count: a.ratingCount,
      purchases_count: a.purchasesCount,
      features: a.features,
      status: a.status,
      brand: a.brand,
      is_external: isExternal,
    };
  });

  const totalCount = mappedAgents.length;

  return (
    <section className="mx-auto max-w-6xl px-5 sm:px-6">
      <CatalogHero totalCount={totalCount} />

      <div className="pb-16 sm:pb-20">
        <CatalogTabs
          activeTab={tab}
          counts={{
            all: counts.all,
            hireon: counts.hireon,
            lock_in: counts.lockIn,
            external: counts.external,
          }}
        />

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
