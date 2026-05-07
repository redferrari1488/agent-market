import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Check, Users } from "lucide-react";
import { db } from "@/lib/db";
import { agents, profiles, reviews, subscriptions } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getUser } from "@/lib/auth-server";
import { ReviewsList, RatingStars } from "@/components/agents/AgentDetails";
import { PurchaseButton } from "@/components/agents/PurchaseButton";
import { ExternalAgentCTA } from "@/components/agents/ExternalAgentCTA";
import { ReviewForm } from "@/components/agents/ReviewForm";
import { categoryColor, categoryLabel } from "@/lib/category-color";
import { totalPrice } from "@/lib/compute";

// Phase 0: цена для покупателя — единая «всё включено» (труд продавца + хостинг + AI),
// compute_class зафиксирован на M для всех агентов.
const FIXED_COMPUTE_CLASS = "M" as const;

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
    title: `${agent.name} - hireon`,
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
      priceMonthly: agents.priceMonthly,
      ratingAvg: agents.ratingAvg,
      ratingCount: agents.ratingCount,
      purchasesCount: agents.purchasesCount,
      features: agents.features,
      setupSchema: agents.setupSchema,
      sellerId: agents.sellerId,
      externalUrl: agents.externalUrl,
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

  const cc = categoryColor(agent.category);
  const catLabel = categoryLabel(agent.category);
  const featuresList: string[] = (agent.features as string[]) || [];
  const setupFields =
    Array.isArray(agent.setupSchema) && agent.setupSchema.length > 0
      ? (agent.setupSchema as { key: string; label: string; type: string; required?: boolean }[])
      : [];

  // Покупатель видит «всё включено»: труд продавца + хостинг + AI.
  const displayPriceMonthly =
    agent.priceMonthly != null ? totalPrice(agent.priceMonthly, FIXED_COMPUTE_CLASS) : null;

  return (
    <section className="mx-auto max-w-5xl px-5 sm:px-6">
      <div className="py-10 sm:py-14">
        <Link
          href="/agents?browse=1"
          className="group inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.06em] lowercase text-muted-foreground/70 transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-0.5" />
          каталог
        </Link>

        <div className="mt-8 grid grid-cols-1 gap-12 lg:grid-cols-3 lg:gap-10">
          <div className="lg:col-span-2">
            {/* Hero — top stripe + mono label, без иконочной плашки (как на каталог-карточке) */}
            <div className="h-[2px] w-full" style={{ background: cc, opacity: 0.85 }} />
            <div className="mt-6">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[11px] tracking-[0.08em] lowercase">
                <span style={{ color: cc, opacity: 0.95 }}>{catLabel.toLowerCase()}</span>
                {sellerName && (
                  <>
                    <span className="text-border/70">/</span>
                    <span className="text-muted-foreground">{sellerName}</span>
                  </>
                )}
              </div>
              <h1 className="mt-4 text-[2.25rem] font-extrabold leading-[1.02] tracking-[-0.03em] sm:text-[3rem]">
                {agent.name}
              </h1>
              <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
                {agent.description}
              </p>
              {(agent.ratingCount >= 3 || agent.purchasesCount >= 3) && (
                <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2">
                  {agent.ratingCount >= 3 && (
                    <RatingStars avg={agent.ratingAvg} count={agent.ratingCount} />
                  )}
                  {agent.purchasesCount >= 3 && (
                    <span className="flex items-center gap-1.5 font-mono text-[12px] text-muted-foreground/80">
                      <Users className="h-3 w-3" />
                      {agent.purchasesCount} подключений
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="my-10 border-t border-border/30" />

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
                      <Check
                        className="mt-[3px] h-3.5 w-3.5 shrink-0"
                        style={{ color: cc }}
                      />
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
                      className="flex items-center gap-2.5 rounded-[2px] border border-border/40 bg-card/30 px-3.5 py-2.5 text-[13px] text-foreground/90"
                    >
                      <div
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: cc, opacity: 0.85 }}
                      />
                      {field.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Reviews — скрываем секцию пока отзывов мало; форма доступна купившим */}
            {(agent.ratingCount >= 3 || hasPurchased) && (
              <div className="mt-14 border-t border-border/30 pt-10">
                <div className="flex items-baseline justify-between gap-4">
                  <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                    Отзывы
                    {agent.ratingCount >= 3 && (
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
                {agent.ratingCount >= 3 && (
                  <div className="mt-5">
                    <ReviewsList reviews={mappedReviews} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sticky sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-16 lg:top-20 space-y-4">
              <div className="overflow-hidden rounded-[2px] border border-border/40 bg-card/40">
                <div className="h-[2px]" style={{ background: cc, opacity: 0.85 }} />
                <div className="p-5">
                {agent.sellerId ? (
                  <ExternalAgentCTA
                    externalUrl={agent.externalUrl}
                    sellerName={sellerName}
                  />
                ) : (
                  <>
                    <PurchaseButton
                      agentId={agent.id}
                      pricingModel="subscription"
                      priceMonthly={displayPriceMonthly}
                      priceOnetime={null}
                      isLoggedIn={!!user}
                      accentColor={cc}
                    />

                    <div className="mt-5 space-y-2.5 border-t border-border/30 pt-5 font-mono text-[11.5px]">
                      <div className="grid grid-cols-[100px_1fr] items-baseline gap-x-4 min-h-[20px]">
                        <span className="text-muted-foreground">Категория</span>
                        <span style={{ color: cc, opacity: 0.95 }}>{catLabel}</span>
                      </div>
                      {agent.purchasesCount >= 3 && (
                        <div className="grid grid-cols-[100px_1fr] items-baseline gap-x-4 min-h-[20px]">
                          <span className="text-muted-foreground">Подключений</span>
                          <span className="text-foreground/85">{agent.purchasesCount}</span>
                        </div>
                      )}
                    </div>

                    <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
                      Хостинг и AI включены. Оплата картой или криптой, отмена в любое время.
                    </p>
                  </>
                )}
                </div>
              </div>

              {!agent.sellerId && (
                <div className="rounded-[2px] border border-border/40 bg-card/30 p-5">
                  <h3 className="font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                    Как начать
                  </h3>
                  <ul className="mt-4 space-y-3.5">
                    {[
                      "Подключить агента",
                      "Заполнить настройки",
                      "Агент работает 24/7",
                    ].map((step) => (
                      <li key={step} className="flex items-start gap-3">
                        <span
                          className="mt-[7px] h-1 w-1 shrink-0 rounded-full"
                          style={{ background: cc, opacity: 0.7 }}
                        />
                        <span className="text-[13px] leading-snug text-foreground/85">
                          {step}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
