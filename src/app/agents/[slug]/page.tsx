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
import { Badge } from "@/components/ui/badge";
import { createServerClient } from "@/lib/supabase";
import { ReviewsList, RatingStars } from "@/components/agents/AgentDetails";

const categoryConfig: Record<
  string,
  { label: string; icon: React.ElementType; color: string }
> = {
  support: { label: "Поддержка", icon: MessageSquare, color: "text-green-500 bg-green-500/10 border-green-500/20" },
  content: { label: "Контент", icon: PenTool, color: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
  analytics: { label: "Аналитика", icon: BarChart3, color: "text-orange-500 bg-orange-500/10 border-orange-500/20" },
  sales: { label: "Продажи", icon: ShoppingCart, color: "text-pink-500 bg-pink-500/10 border-pink-500/20" },
  monitoring: { label: "Мониторинг", icon: Activity, color: "text-violet-500 bg-violet-500/10 border-violet-500/20" },
};

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
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

export default async function AgentPage({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;
  const supabase = await createServerClient();

  // Получаем агента
  const { data: agent } = await supabase
    .from("agents")
    .select(
      "id, slug, name, description, long_description, category, price_monthly, rating_avg, rating_count, purchases_count, features, setup_schema, seller_id"
    )
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!agent) notFound();

  // Получаем отзывы
  const { data: reviews } = await supabase
    .from("reviews")
    .select("id, rating, text, created_at, profiles(name, avatar_url)")
    .eq("agent_id", agent.id)
    .order("created_at", { ascending: false })
    .limit(20);

  // Получаем имя продавца
  const { data: seller } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", agent.seller_id)
    .single();

  const cat = categoryConfig[agent.category] || categoryConfig.support;
  const CategoryIcon = cat.icon;
  const price = (agent.price_monthly / 100).toFixed(0);
  const features: string[] = (agent.features as string[]) || [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Назад */}
      <Link
        href="/agents"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Каталог
      </Link>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        {/* Основной контент */}
        <div className="lg:col-span-2">
          {/* Шапка */}
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600/10 to-blue-500/10">
              <CategoryIcon className="h-7 w-7 text-violet-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold sm:text-3xl">{agent.name}</h1>
                <Badge variant="outline" className={`text-xs ${cat.color}`}>
                  {cat.label}
                </Badge>
              </div>
              <p className="mt-1 text-muted-foreground">{agent.description}</p>
              <div className="mt-3 flex items-center gap-4">
                <RatingStars avg={agent.rating_avg} count={agent.rating_count} />
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  {agent.purchases_count} подключений
                </span>
              </div>
            </div>
          </div>

          {/* Описание */}
          {agent.long_description && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold">Описание</h2>
              <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {agent.long_description}
              </div>
            </div>
          )}

          {/* Возможности */}
          {features.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold">Возможности</h2>
              <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Что потребуется */}
          {agent.setup_schema && (agent.setup_schema as unknown[]).length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold">Что потребуется для настройки</h2>
              <ul className="mt-3 space-y-2">
                {(agent.setup_schema as { key: string; label: string; type: string; required?: boolean }[]).map(
                  (field) => (
                    <li
                      key={field.key}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <div className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                      {field.label}
                      {field.required !== false && (
                        <span className="text-xs text-red-400">*</span>
                      )}
                    </li>
                  )
                )}
              </ul>
            </div>
          )}

          {/* Отзывы */}
          <div className="mt-10">
            <h2 className="text-lg font-semibold">
              Отзывы{" "}
              {agent.rating_count > 0 && (
                <span className="text-sm font-normal text-muted-foreground">
                  ({agent.rating_count})
                </span>
              )}
            </h2>
            <div className="mt-4">
              <ReviewsList reviews={reviews || []} />
            </div>
          </div>
        </div>

        {/* Сайдбар — карточка покупки */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-xl border border-border/50 bg-card p-6">
            <div className="mb-1 text-sm text-muted-foreground">Подписка</div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold">${price}</span>
              <span className="text-muted-foreground">/мес</span>
            </div>

            <Link
              href={`/api/checkout?agent_id=${agent.id}`}
              className="mt-5 flex h-11 w-full items-center justify-center rounded-lg bg-gradient-to-r from-violet-600 to-blue-500 text-sm font-medium text-white transition-all hover:from-violet-700 hover:to-blue-600"
            >
              Подключить агента
            </Link>

            <div className="mt-5 space-y-3 border-t border-border/50 pt-5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Категория</span>
                <span>{cat.label}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Подключений</span>
                <span>{agent.purchases_count}</span>
              </div>
              {seller?.name && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Продавец</span>
                  <span>{seller.name}</span>
                </div>
              )}
            </div>

            <p className="mt-4 text-xs text-muted-foreground/60">
              Оплата через Stripe. Можно отменить в любое время.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
