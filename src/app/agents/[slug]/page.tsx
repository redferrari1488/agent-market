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

  // Проверяем купил ли юзер этого агента
  let hasPurchased = false;
  if (user) {
    const [existingSub] = await db
      .select({ id: subscriptions.id })
      .from(subscriptions)
      .where(and(eq(subscriptions.userId, user.id), eq(subscriptions.agentId, agent.id)))
      .limit(1);
    hasPurchased = !!existingSub;
  }

  // Отзывы с профилями
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

  // Продавец
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
    <div className="relative">
      {/* Glow background */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[500px] overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[400px] w-[800px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-violet-600/10 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          href="/agents"
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-violet-400"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Каталог
        </Link>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs text-violet-300">
                <CategoryIcon className="h-3 w-3" />
                {cat.label}
                {sellerName && (
                  <>
                    <span className="text-violet-400/40">·</span>
                    {sellerName}
                  </>
                )}
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                {agent.name}
              </h1>
              <p className="mt-3 text-lg leading-relaxed text-muted-foreground">
                {agent.description}
              </p>
              <div className="mt-4 flex items-center gap-4">
                <RatingStars avg={agent.ratingAvg} count={agent.ratingCount} />
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  {agent.purchasesCount}
                </span>
              </div>
            </div>

            <div className="my-8 border-t border-border/50" />

            {agent.longDescription && (
              <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm">
                <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-violet-500/5 blur-2xl" />
                <h2 className="relative text-xs font-bold uppercase tracking-wider text-violet-400/80">
                  Описание
                </h2>
                <div className="relative mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                  {agent.longDescription}
                </div>
              </div>
            )}

            {featuresList.length > 0 && (
              <div className="mt-6 rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm">
                <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400/80">
                  Возможности
                </h2>
                <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
                  {featuresList.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                        <Check className="h-3 w-3" />
                      </div>
                      <span className="text-foreground/90">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {Array.isArray(agent.setupSchema) && agent.setupSchema.length > 0 && (
              <div className="mt-6 rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm">
                <h2 className="text-xs font-bold uppercase tracking-wider text-blue-400/80">
                  Для настройки потребуется
                </h2>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {(agent.setupSchema as { key: string; label: string; type: string; required?: boolean }[]).map(
                    (field) => (
                      <li
                        key={field.key}
                        className="flex items-center gap-2 text-sm text-foreground/90"
                      >
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                        {field.label}
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}

            <div className="mt-8 border-t border-border/50 pt-8">
              <h2 className="text-xs font-bold uppercase tracking-wider text-violet-400/80">
                Отзывы
                {agent.ratingCount > 0 && (
                  <span className="ml-1 font-normal text-muted-foreground">
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
              <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/80 p-6 backdrop-blur-md">
                <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />
                <div className="relative">
                  <PurchaseButton
                    agentId={agent.id}
                    pricingModel={(agent.pricingModel || "subscription") as "subscription" | "one_time" | "both"}
                    priceMonthly={agent.priceMonthly}
                    priceOnetime={agent.priceOnetime}
                    isLoggedIn={!!user}
                  />

                  <div className="mt-5 space-y-2.5 border-t border-border/50 pt-5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Категория</span>
                      <span>{cat.label}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Подключений</span>
                      <span>{agent.purchasesCount}</span>
                    </div>
                    {sellerName && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Продавец</span>
                        <span>{sellerName}</span>
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
      </div>
    </div>
  );
}
