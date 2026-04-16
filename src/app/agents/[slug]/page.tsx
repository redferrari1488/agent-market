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
import { eq, and, desc } from "drizzle-orm";
import { getUser } from "@/lib/auth-server";
import { ReviewsList, RatingStars } from "@/components/agents/AgentDetails";
import { PurchaseButton } from "@/components/agents/PurchaseButton";
import { ReviewForm } from "@/components/agents/ReviewForm";
import {
  COMPUTE_CLASSES,
  DEFAULT_COMPUTE_CLASS,
  totalPrice,
  type ComputeClass,
} from "@/lib/compute";

type CatKey = "support" | "content" | "analytics" | "sales" | "monitoring";

const categoryConfig: Record<
  CatKey,
  { label: string; icon: React.ElementType; accent: string; bg: string; ring: string }
> = {
  support: {
    label: "Поддержка",
    icon: MessageSquare,
    accent: "text-blue-400",
    bg: "bg-blue-500/10",
    ring: "ring-blue-500/20",
  },
  content: {
    label: "Контент",
    icon: PenTool,
    accent: "text-violet-400",
    bg: "bg-violet-500/10",
    ring: "ring-violet-500/20",
  },
  analytics: {
    label: "Аналитика",
    icon: BarChart3,
    accent: "text-emerald-400",
    bg: "bg-emerald-500/10",
    ring: "ring-emerald-500/20",
  },
  sales: {
    label: "Продажи",
    icon: ShoppingCart,
    accent: "text-amber-400",
    bg: "bg-amber-500/10",
    ring: "ring-amber-500/20",
  },
  monitoring: {
    label: "Мониторинг",
    icon: Activity,
    accent: "text-cyan-400",
    bg: "bg-cyan-500/10",
    ring: "ring-cyan-500/20",
  },
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
    title: `${agent.name} - AgentMarket`,
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
      computeClass: agents.computeClass,
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

  const catKey: CatKey =
    agent.category && agent.category in categoryConfig
      ? (agent.category as CatKey)
      : "support";
  const cat = categoryConfig[catKey];
  const CategoryIcon = cat.icon;
  const featuresList: string[] = (agent.features as string[]) || [];
  const setupFields =
    Array.isArray(agent.setupSchema) && agent.setupSchema.length > 0
      ? (agent.setupSchema as { key: string; label: string; type: string; required?: boolean }[])
      : [];

  // Модель B+C: покупатель платит seller_price + compute_price.
  // В UI показываем ТОТАЛ — это честная цифра на кассе.
  const classId: ComputeClass =
    agent.computeClass && agent.computeClass in COMPUTE_CLASSES
      ? (agent.computeClass as ComputeClass)
      : DEFAULT_COMPUTE_CLASS;
  const computeInfo = COMPUTE_CLASSES[classId];
  const displayPriceMonthly =
    agent.priceMonthly != null ? totalPrice(agent.priceMonthly, classId) : null;
  const displayPriceOnetime =
    agent.priceOnetime != null ? totalPrice(agent.priceOnetime, classId) : null;

  return (
    <section className="mx-auto max-w-5xl px-5 sm:px-6">
      <div className="py-10 sm:py-14">
        <Link
          href="/agents"
          className="group inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          Каталог
        </Link>

        <div className="mt-8 grid grid-cols-1 gap-12 lg:grid-cols-3 lg:gap-10">
          <div className="lg:col-span-2">
            {/* Hero */}
            <div className="flex items-start gap-4 sm:gap-5">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg sm:h-14 sm:w-14 ${cat.bg} ${cat.accent} ring-1 ${cat.ring}`}
              >
                <CategoryIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] uppercase tracking-[0.15em]">
                  <span className={cat.accent}>{cat.label}</span>
                  {sellerName && (
                    <>
                      <span className="text-border">/</span>
                      <span className="text-muted-foreground">{sellerName}</span>
                    </>
                  )}
                </div>
                <h1 className="mt-3 text-[2rem] font-bold leading-[1.05] tracking-[-0.03em] sm:text-[2.5rem]">
                  {agent.name}
                </h1>
                <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
                  {agent.description}
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
                  <RatingStars avg={agent.ratingAvg} count={agent.ratingCount} />
                  <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    {agent.purchasesCount} подключений
                  </span>
                </div>
              </div>
            </div>

            <div className="my-10 border-t border-border/40" />

            {/* Long description — editorial style */}
            {agent.longDescription && (
              <div>
                <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                  Описание
                </h2>
                <div className="mt-4 whitespace-pre-wrap text-[14.5px] leading-[1.7] text-foreground/85">
                  {agent.longDescription.replace(/\*\*/g, "")}
                </div>
              </div>
            )}

            {/* Features */}
            {featuresList.length > 0 && (
              <div className="mt-12">
                <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                  Возможности
                </h2>
                <ul className="mt-5 grid gap-x-6 gap-y-3.5 sm:grid-cols-2">
                  {featuresList.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2.5 text-[13.5px] leading-relaxed"
                    >
                      <Check className={`mt-[3px] h-3.5 w-3.5 shrink-0 ${cat.accent}`} />
                      <span className="text-foreground/90">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Setup fields */}
            {setupFields.length > 0 && (
              <div className="mt-12">
                <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                  Для настройки потребуется
                </h2>
                <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
                  {setupFields.map((field) => (
                    <li
                      key={field.key}
                      className="flex items-center gap-2.5 rounded-lg border border-border/40 px-3.5 py-2.5 text-[13px] text-foreground/90"
                    >
                      <div className={`h-1.5 w-1.5 rounded-full ${cat.bg} ring-1 ${cat.ring}`} />
                      {field.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Reviews */}
            <div className="mt-14 border-t border-border/40 pt-10">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                  Отзывы
                  {agent.ratingCount > 0 && (
                    <span className="ml-1.5 font-sans text-muted-foreground/60">
                      ({agent.ratingCount})
                    </span>
                  )}
                </h2>
              </div>
              {hasPurchased && (
                <div className="mt-5">
                  <ReviewForm agentId={agent.id} />
                </div>
              )}
              <div className="mt-5">
                <ReviewsList reviews={mappedReviews} />
              </div>
            </div>
          </div>

          {/* Sticky sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-16 lg:top-20 space-y-4">
              <div className="rounded-lg border border-border/40 p-5">
                <PurchaseButton
                  agentId={agent.id}
                  pricingModel={(agent.pricingModel || "subscription") as "subscription" | "one_time" | "both"}
                  priceMonthly={displayPriceMonthly}
                  priceOnetime={displayPriceOnetime}
                  isLoggedIn={!!user}
                />

                <div className="mt-5 space-y-2.5 border-t border-border/40 pt-5 font-mono text-[11.5px]">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Категория</span>
                    <span className={`${cat.accent}`}>{cat.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Тариф</span>
                    <span className="text-foreground/80">
                      {computeInfo.label} · {(computeInfo.priceKopecks / 100).toFixed(0)}&nbsp;₽/мес
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Мощность</span>
                    <span className="text-foreground/80">{computeInfo.specs}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Подключений</span>
                    <span className="text-foreground/80">{agent.purchasesCount}</span>
                  </div>
                  {sellerName && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Продавец</span>
                      <span className="text-foreground/80">{sellerName}</span>
                    </div>
                  )}
                </div>

                <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
                  {computeInfo.description}. Оплата картой или криптой, отмена в любое время.
                </p>
              </div>

              <div className="rounded-lg border border-border/40 p-5">
                <h3 className="font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                  Как начать
                </h3>
                <ol className="mt-4 space-y-3.5">
                  {[
                    "Подключить агента",
                    "Заполнить настройки",
                    "Агент работает 24/7",
                  ].map((step, i) => (
                    <li key={step} className="flex items-start gap-3">
                      <span className="mt-[2px] font-mono text-[10px] tabular-nums text-muted-foreground/60">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="text-[13px] leading-snug text-foreground/85">
                        {step}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="rounded-lg border border-border/40 p-5">
                <h3 className="font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                  Тарифы
                </h3>
                <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
                  Каждый агент работает на выделенных ресурсах. Тариф определяет мощность и возможности.
                </p>
                <ul className="mt-4 space-y-3">
                  {(Object.keys(COMPUTE_CLASSES) as ComputeClass[]).map((cls) => {
                    const info = COMPUTE_CLASSES[cls];
                    const isActive = cls === classId;
                    return (
                      <li
                        key={cls}
                        className={`rounded-md border px-3 py-2.5 ${
                          isActive
                            ? "border-primary/30 bg-primary/5"
                            : "border-border/40"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-[12px] font-medium ${isActive ? "text-foreground" : "text-foreground/70"}`}>
                            {info.label}
                          </span>
                          <span className="font-mono text-[11px] text-muted-foreground">
                            {(info.priceKopecks / 100).toFixed(0)} ₽/мес
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                          {info.description}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
