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
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/agents"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Каталог
      </Link>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CategoryIcon className="h-3.5 w-3.5" />
              {cat.label}
              {sellerName && (
                <>
                  <span className="text-border">·</span>
                  {sellerName}
                </>
              )}
            </div>
            <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{agent.name}</h1>
            <p className="mt-2 text-muted-foreground">{agent.description}</p>
            <div className="mt-3 flex items-center gap-4">
              <RatingStars avg={agent.ratingAvg} count={agent.ratingCount} />
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                {agent.purchasesCount}
              </span>
            </div>
          </div>

          <div className="my-6 border-t border-border" />

          {agent.longDescription && (
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Описание
              </h2>
              <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">
                {agent.longDescription}
              </div>
            </div>
          )}

          {featuresList.length > 0 && (
            <div className="mt-8">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Возможности
              </h2>
              <ul className="mt-3 space-y-2">
                {featuresList.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="text-foreground/80">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {Array.isArray(agent.setupSchema) && agent.setupSchema.length > 0 && (
            <div className="mt-8">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Для настройки потребуется
              </h2>
              <ul className="mt-3 space-y-1.5">
                {(agent.setupSchema as { key: string; label: string; type: string; required?: boolean }[]).map(
                  (field) => (
                    <li key={field.key} className="flex items-center gap-2 text-sm text-foreground/80">
                      <div className="h-1 w-1 rounded-full bg-muted-foreground" />
                      {field.label}
                    </li>
                  )
                )}
              </ul>
            </div>
          )}

          <div className="mt-8 border-t border-border pt-8">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Отзывы
              {agent.ratingCount > 0 && (
                <span className="ml-1 font-normal">({agent.ratingCount})</span>
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
          <div className="sticky top-20 rounded-xl border border-border p-5">
            <PurchaseButton
              agentId={agent.id}
              pricingModel={(agent.pricingModel || "subscription") as "subscription" | "one_time" | "both"}
              priceMonthly={agent.priceMonthly}
              priceOnetime={agent.priceOnetime}
              isLoggedIn={!!user}
            />

            <div className="mt-4 space-y-2.5 border-t border-border pt-4 text-sm">
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

            <p className="mt-4 text-[11px] text-muted-foreground">
              Оплата картой или криптой. Отмена в любое время.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
