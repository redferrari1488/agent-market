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
import { createServerClient } from "@/lib/supabase";
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
  const supabase = await createServerClient();
  const { data: agent } = await supabase
    .from("agents")
    .select("name, description")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!agent) return { title: "Агент не найден" };
  return {
    title: `${agent.name} — AgentMarket`,
    description: agent.description,
  };
}

export default async function AgentPage({ params }: { params: Params }) {
  const { slug } = await params;
  const supabase = await createServerClient();

  const { data: agent } = await supabase
    .from("agents")
    .select(
      "id, slug, name, description, long_description, category, pricing_model, price_monthly, price_onetime, rating_avg, rating_count, purchases_count, features, setup_schema, seller_id"
    )
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!agent) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Проверяем купил ли юзер этого агента (для ReviewForm)
  let hasPurchased = false;
  if (user) {
    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .eq("agent_id", agent.id)
      .limit(1)
      .maybeSingle();
    hasPurchased = !!existingSub;
  }

  const { data: reviews } = await supabase
    .from("reviews")
    .select("id, rating, text, created_at, profiles(name, avatar_url)")
    .eq("agent_id", agent.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: seller } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", agent.seller_id)
    .single();

  const cat = categoryConfig[agent.category] || categoryConfig.support;
  const CategoryIcon = cat.icon;
  const features: string[] = (agent.features as string[]) || [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Назад */}
      <Link
        href="/agents"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Каталог
      </Link>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Основной контент */}
        <div className="lg:col-span-2">
          {/* Шапка */}
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CategoryIcon className="h-3.5 w-3.5" />
              {cat.label}
              {seller?.name && (
                <>
                  <span className="text-border">·</span>
                  {seller.name}
                </>
              )}
            </div>
            <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{agent.name}</h1>
            <p className="mt-2 text-muted-foreground">{agent.description}</p>
            <div className="mt-3 flex items-center gap-4">
              <RatingStars avg={agent.rating_avg} count={agent.rating_count} />
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                {agent.purchases_count}
              </span>
            </div>
          </div>

          {/* Разделитель */}
          <div className="my-6 border-t border-border" />

          {/* Описание */}
          {agent.long_description && (
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Описание
              </h2>
              <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">
                {agent.long_description}
              </div>
            </div>
          )}

          {/* Возможности */}
          {features.length > 0 && (
            <div className="mt-8">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Возможности
              </h2>
              <ul className="mt-3 space-y-2">
                {features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="text-foreground/80">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Что потребуется */}
          {agent.setup_schema && (agent.setup_schema as unknown[]).length > 0 && (
            <div className="mt-8">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Для настройки потребуется
              </h2>
              <ul className="mt-3 space-y-1.5">
                {(agent.setup_schema as { key: string; label: string; type: string; required?: boolean }[]).map(
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

          {/* Отзывы */}
          <div className="mt-8 border-t border-border pt-8">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Отзывы
              {agent.rating_count > 0 && (
                <span className="ml-1 font-normal">({agent.rating_count})</span>
              )}
            </h2>
            {hasPurchased && (
              <div className="mt-4">
                <ReviewForm agentId={agent.id} />
              </div>
            )}
            <div className="mt-4">
              <ReviewsList reviews={reviews || []} />
            </div>
          </div>
        </div>

        {/* Сайдбар */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 rounded-xl border border-border p-5">
            <PurchaseButton
              agentId={agent.id}
              pricingModel={agent.pricing_model || "subscription"}
              priceMonthly={agent.price_monthly}
              priceOnetime={agent.price_onetime}
              isLoggedIn={!!user}
            />

            <div className="mt-4 space-y-2.5 border-t border-border pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Категория</span>
                <span>{cat.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Подключений</span>
                <span>{agent.purchases_count}</span>
              </div>
              {seller?.name && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Продавец</span>
                  <span>{seller.name}</span>
                </div>
              )}
            </div>

            <p className="mt-4 text-[11px] text-muted-foreground">
              Оплата через Stripe. Отмена в любое время.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
