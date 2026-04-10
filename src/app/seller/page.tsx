import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { agents, profiles, subscriptions, payouts } from "@/lib/db/schema";
import { eq, and, desc, inArray, sql } from "drizzle-orm";
import { getUser } from "@/lib/auth-server";
import {
  Plus,
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  FileEdit,
  XCircle,
  Store,
} from "lucide-react";
import { StatsCards } from "@/components/seller/StatsCards";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Панель продавца — AgentMarket",
  description: "Управление AI-агентами, статистика продаж и доходов.",
};

const statusConfig: Record<
  string,
  { label: string; icon: React.ElementType; color: string }
> = {
  draft: { label: "Черновик", icon: FileEdit, color: "text-muted-foreground" },
  review: { label: "На модерации", icon: Clock, color: "text-amber-400" },
  published: { label: "Опубликован", icon: CheckCircle2, color: "text-emerald-400" },
  rejected: { label: "Отклонён", icon: XCircle, color: "text-red-400" },
};

export default async function SellerPage() {
  const user = await getUser();
  if (!user) redirect("/auth/login?next=/seller");

  // Проверяем роль
  const [profile] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  // Если не продавец — показываем промо-страницу
  if (!profile || (profile.role !== "seller" && profile.role !== "admin")) {
    return <BecomeSellerPage />;
  }

  // Агенты продавца
  const sellerAgents = await db
    .select()
    .from(agents)
    .where(eq(agents.sellerId, user.id))
    .orderBy(desc(agents.createdAt));

  const agentIds = sellerAgents.map((a) => a.id);

  // Статистика
  let totalSubs = 0;
  let activeSubs = 0;
  let totalRevenue = 0;

  if (agentIds.length > 0) {
    const subsRows = await db
      .select({ status: subscriptions.status, amount: subscriptions.amount })
      .from(subscriptions)
      .where(inArray(subscriptions.agentId, agentIds));

    totalSubs = subsRows.length;
    activeSubs = subsRows.filter(
      (s) => s.status === "active" || s.status === "pending_setup"
    ).length;
    totalRevenue = subsRows.reduce((sum, s) => sum + (s.amount || 0), 0);
  }

  const payoutRows = await db
    .select({ total: sql<number>`coalesce(sum(${payouts.amount}), 0)` })
    .from(payouts)
    .where(and(eq(payouts.sellerId, user.id), eq(payouts.status, "completed")));

  const totalPaidOut = payoutRows[0]?.total || 0;

  const stats = {
    totalAgents: sellerAgents.length,
    publishedAgents: sellerAgents.filter((a) => a.status === "published").length,
    draftAgents: sellerAgents.filter((a) => a.status === "draft").length,
    reviewAgents: sellerAgents.filter((a) => a.status === "review").length,
    totalSubs,
    activeSubs,
    totalRevenue,
    sellerRevenue: Math.floor(totalRevenue * 0.85),
    totalPaidOut,
  };

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[400px] overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[350px] w-[800px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="absolute right-0 top-1/4 h-[250px] w-[250px] rounded-full bg-emerald-600/5 blur-[100px]" />
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Панель{" "}
              <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
                продавца
              </span>
            </h1>
            <p className="mt-2 text-muted-foreground">
              Управление агентами и доходом
            </p>
          </div>
          <Link
            href="/seller/agents/new"
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-gradient-to-r from-violet-600 to-blue-600 px-5 text-sm font-bold text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/40 hover:brightness-110"
          >
            <Plus className="h-4 w-4" />
            Новый агент
          </Link>
        </div>

        <StatsCards stats={stats} />

        {/* Список агентов */}
        <div className="mt-10">
          <h2 className="mb-5 text-xl font-bold">Ваши агенты</h2>

          {sellerAgents.length === 0 ? (
            <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 p-14 text-center backdrop-blur-sm">
              <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-60 -translate-x-1/2 rounded-full bg-violet-500/10 blur-3xl" />
              <div className="relative">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-400">
                  <Package className="h-7 w-7" />
                </div>
                <h3 className="mt-5 text-lg font-bold">Нет агентов</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Создайте своего первого AI-агента и начните зарабатывать.
                </p>
                <Link
                  href="/seller/agents/new"
                  className="mt-6 inline-flex h-10 items-center rounded-full bg-gradient-to-r from-violet-600 to-blue-600 px-5 text-sm font-bold text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/40 hover:brightness-110"
                >
                  Создать агента
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sellerAgents.map((agent) => {
                const st = statusConfig[agent.status] || statusConfig.draft;
                const StatusIcon = st.icon;
                const price = agent.priceMonthly
                  ? `${(agent.priceMonthly / 100).toFixed(0)} ₽/мес`
                  : agent.priceOnetime
                    ? `${(agent.priceOnetime / 100).toFixed(0)} ₽`
                    : "—";

                return (
                  <Link
                    key={agent.id}
                    href={`/seller/agents/${agent.id}/edit`}
                    className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 p-5 backdrop-blur-sm transition-all hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/5"
                  >
                    <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-violet-500/0 blur-2xl transition-all group-hover:bg-violet-500/10" />
                    <div className="relative">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="truncate text-base font-bold">{agent.name}</h3>
                        <div className={`flex shrink-0 items-center gap-1 text-xs font-medium ${st.color}`}>
                          <StatusIcon className="h-3.5 w-3.5" />
                          {st.label}
                        </div>
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
                        {agent.description}
                      </p>
                      <div className="mt-4 flex items-center justify-between border-t border-border/30 pt-3 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{price}</span>
                        <span>{agent.purchasesCount} покупок</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BecomeSellerPage() {
  const steps = [
    {
      title: "1. Создайте агента",
      desc: "Опишите, загрузите Docker-образ, настройте поля для покупателей.",
      color: "text-violet-400 bg-violet-500/10",
      glow: "bg-violet-500/10",
    },
    {
      title: "2. Модерация",
      desc: "Мы проверим агента и опубликуем его в каталоге.",
      color: "text-blue-400 bg-blue-500/10",
      glow: "bg-blue-500/10",
    },
    {
      title: "3. Получайте доход",
      desc: "Покупатели подключают агента — вы получаете 85% с каждого платежа.",
      color: "text-emerald-400 bg-emerald-500/10",
      glow: "bg-emerald-500/10",
    },
  ];

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/4 rounded-full bg-violet-600/15 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 shadow-2xl shadow-violet-500/40">
          <Store className="h-8 w-8 text-white" />
        </div>
        <h1 className="mt-8 text-4xl font-bold tracking-tight sm:text-5xl">
          Продавайте{" "}
          <span className="bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
            AI-агентов
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
          Создавайте AI-агентов, которые работают 24/7 в Docker-контейнерах.
          Покупатели платят подписку или разово — вы получаете 85% от каждого платежа.
        </p>

        <div className="mt-12 grid gap-4 text-left sm:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.title}
              className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm transition-all hover:border-violet-500/30"
            >
              <div
                className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl ${step.glow}`}
              />
              <div className="relative">
                <h3 className="text-base font-bold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        <BecomeSellerButton />
      </div>
    </div>
  );
}

function BecomeSellerButton() {
  return (
    <form
      action={async () => {
        "use server";
        const user = await getUser();
        if (!user) redirect("/auth/login?next=/seller");

        await db
          .update(profiles)
          .set({ role: "seller", updatedAt: new Date() })
          .where(eq(profiles.id, user.id));

        redirect("/seller");
      }}
    >
      <button
        type="submit"
        className="mt-12 inline-flex h-12 items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-blue-600 px-8 text-sm font-bold text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/40 hover:brightness-110"
      >
        Стать продавцом
      </button>
    </form>
  );
}
