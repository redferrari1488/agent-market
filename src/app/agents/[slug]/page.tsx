import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowLeft,
  Check,
  Users,
  MessageSquare,
  PenTool,
  BarChart3,
  ShoppingCart,
  Activity,
} from "lucide-react";
import { db } from "@/lib/db";
import { agents, profiles, reviews, subscriptions } from "@/lib/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { getUser } from "@/lib/auth-server";
import { ReviewsList, RatingStars } from "@/components/agents/AgentDetails";
import { PurchaseButton } from "@/components/agents/PurchaseButton";
import { ReviewForm } from "@/components/agents/ReviewForm";

const categoryConfig: Record<string, { label: string; icon: React.ElementType }> = {
  support: { label: "Поддержка", icon: MessageSquare },
  content: { label: "Контент", icon: PenTool },
  analytics: { label: "Аналитика", icon: BarChart3 },
  sales: { label: "Продажи", icon: ShoppingCart },
  monitoring: { label: "Мониторинг", icon: Activity },
};

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const [agent] = await db
    .select({ name: agents.name, description: agents.description })
    .from(agents)
    .where(and(eq(agents.slug, slug), eq(agents.status, "published")))
    .limit(1);

  if (!agent) return { title: "Агент не найден" };
  return {
    title: `${agent.name} — AgentMarket`,
    description: agent.description,
  };
}

export default async function AgentPage({ params }: { params: Params }) {
  const { slug } = await params;

  const [agent] = await db
    .select({
      id: agents.id,
      slug: agents.slug,
      name: agents.name,
      description: agents.description,
      longDescription: agents.longDescription,
      category: agents.category,
      pricingModel: agents.pricingModel,
      priceMonthly: agents.priceMonthly,
      priceOnetime: agents.priceOnetime,
      ratingAvg: agents.ratingAvg,
      ratingCount: agents.ratingCount,
      purchasesCount: agents.purchasesCount,
      features: agents.features,
      setupSchema: agents.setupSchema,
      sellerId: agents.sellerId,
    })
    .from(agents)
    .where(and(eq(agents.slug, slug), eq(agents.status, "published")))
    .limit(1);

  if (!agent) notFound();

  const user = await getUser();

  let hasPurchased = false;
  if (user) {
    const [existingSub] = await db
      .select({ id: subscriptions.id })
      .from(subscriptions)
      .where(and(eq(subscriptions.userId, user.id), eq(subscriptions.agentId, agent.id)))
      .limit(1);
    hasPurchased = !!existingSub;
  }

  const reviewRows = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      text: reviews.text,
      createdAt: reviews.createdAt,
      userName: profiles.name,
      userAvatar: profiles.avatarUrl,
    })
    .from(reviews)
    .leftJoin(profiles, eq(reviews.userId, profiles.id))
    .where(eq(reviews.agentId, agent.id))
    .orderBy(desc(reviews.createdAt))
    .limit(20);

  const mappedReviews = reviewRows.map((r) => ({
    id: r.id,
    rating: r.rating,
    text: r.text,
    created_at: r.createdAt.toISOString(),
    profiles: { name: r.userName, avatar_url: r.userAvatar },
  }));

  let sellerName: string | null = null;
  if (agent.sellerId) {
    const [seller] = await db
      .select({ name: profiles.name })
      .from(profiles)
      .where(eq(profiles.id, agent.sellerId))
      .limit(1);
    sellerName = seller?.name ?? null;
  }

  const cat = categoryConfig[agent.category!] || categoryConfig.support;
  const CategoryIcon = cat.icon;
  const featuresList: string[] = (agent.features as string[]) || [];

  return (
    <section className="mx-auto max-w-5xl px-5 sm:px-6">
      <div className="py-10 sm:py-14">
        <Link
          href="/agents"
          className="mb-6 inline-flex items-center gap-1 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Каталог
        </Link>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div>
              <div className="inline-flex items-center gap-2 text-[12px] text-muted-foreground">
                <CategoryIcon className="h-3.5 w-3.5" />
                <span>{cat.label}</span>
                {sellerName && (
                  <>
                    <span className="text-border">·</span>
                    <span>{sellerName}</span>
                  </>
                )}
              </div>
              <h1 className="mt-3 text-[2rem] font-bold tracking-[-0.03em] sm:text-[2.5rem]">
                {agent.name}
              </h1>
              <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
                {agent.description}
              </p>
              <div className="mt-4 flex items-center gap-4">
                <RatingStars avg={agent.ratingAvg} count={agent.ratingCount} />
                <span className="flex items-center gap-1 text-[13px] text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  {agent.purchasesCount}
                </span>
              </div>
            </div>

            <div className="my-8 border-t border-border/40" />

            {agent.longDescription && (
              <div className="rounded-lg border border-border/40 p-5">
                <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                  Описание
                </h2>
                <div className="mt-3 whitespace-pre-wrap text-[14px] leading-relaxed text-foreground/90">
                  {agent.longDescription}
                </div>
              </div>
            )}

            {featuresList.length > 0 && (
              <div className="mt-6 rounded-lg border border-border/40 p-5">
                <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                  Возможности
                </h2>
                <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
                  {featuresList.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-[13px]">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-foreground/40" />
                      <span className="text-foreground/90">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {Array.isArray(agent.setupSchema) && agent.setupSchema.length > 0 && (
              <div className="mt-6 rounded-lg border border-border/40 p-5">
                <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                  Для настройки потребуется
                </h2>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {(agent.setupSchema as { key: string; label: string; type: string; required?: boolean }[]).map(
                    (field) => (
                      <li
                        key={field.key}
                        className="flex items-center gap-2 text-[13px] text-foreground/90"
                      >
                        <div className="h-1 w-1 rounded-full bg-foreground/30" />
                        {field.label}
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}

            <div className="mt-8 border-t border-border/40 pt-8">
              <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                Отзывы
                {agent.ratingCount > 0 && (
                  <span className="ml-1 font-sans font-normal text-muted-foreground">
                    ({agent.ratingCount})
                  </span>
                )}
              </h2>
              {hasPurchased && (
                <div className="mt-4">
                  <ReviewForm agentId={agent.id} />
                </div>
              )}
              <div className="mt-4">
                <ReviewsList reviews={mappedReviews} />
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-20">
              <div className="rounded-lg border border-border/40 p-5">
                <PurchaseButton
                  agentId={agent.id}
                  pricingModel={(agent.pricingModel || "subscription") as "subscription" | "one_time" | "both"}
                  priceMonthly={agent.priceMonthly}
                  priceOnetime={agent.priceOnetime}
                  isLoggedIn={!!user}
                />

                <div className="mt-5 space-y-2.5 border-t border-border/40 pt-5 font-mono text-[12px]">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground/60">Категория</span>
                    <span className="text-foreground/80">{cat.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground/60">Подключений</span>
                    <span className="text-foreground/80">{agent.purchasesCount}</span>
                  </div>
                  {sellerName && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground/60">Продавец</span>
                      <span className="text-foreground/80">{sellerName}</span>
                    </div>
                  )}
                </div>

                <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
                  Оплата картой или криптой. Отмена в любое время.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
