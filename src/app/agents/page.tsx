import type { Metadata } from "next";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { agents } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { AgentCatalogClient } from "@/components/agents/AgentCatalogClient";
import {
  COMPUTE_CLASSES,
  DEFAULT_COMPUTE_CLASS,
  totalPrice,
  type ComputeClass,
} from "@/lib/compute";

export const metadata: Metadata = {
  title: "Каталог AI-агентов - hireon",
  description:
    "Опишите задачу — подберём подходящих AI-агентов. Поддержка, контент, аналитика, мониторинг, продажи.",
  openGraph: {
    title: "Каталог AI-агентов - hireon",
    description:
      "Готовые AI-агенты для бизнеса. Поддержка, контент, аналитика, мониторинг.",
  },
};

export const dynamic = "force-dynamic";

export default async function AgentsPage() {
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
      keywords: agents.keywords,
      status: agents.status,
      sellerId: agents.sellerId,
      brand: agents.brand,
      externalUrl: agents.externalUrl,
      createdAt: agents.createdAt,
    })
    .from(agents)
    .where(eq(agents.status, "published"))
    .orderBy(desc(agents.createdAt));

  const mapped = rows.map((a) => {
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
      keywords: a.keywords ?? [],
      status: a.status,
      brand: a.brand,
      is_external: isExternal,
      external_url: a.externalUrl,
    };
  });

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-72px)] items-center justify-center">
          <div className="font-mono text-[11px] tracking-[0.06em] text-muted-foreground/50">
            загрузка каталога...
          </div>
        </div>
      }
    >
      <AgentCatalogClient agents={mapped} />
    </Suspense>
  );
}
