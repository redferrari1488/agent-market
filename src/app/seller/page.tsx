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
  review: { label: "На модерации", icon: Clock, color: "text-yellow-500" },
  published: { label: "Опубликован", icon: CheckCircle2, color: "text-green-500" },
  rejected: { label: "Отклонён", icon: XCircle, color: "text-red-500" },
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
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Панель продавца</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Управление агентами и доходом
          </p>
        </div>
        <Link
          href="/seller/agents/new"
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-bold text-white hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Новый агент
        </Link>
      </div>

      <StatsCards stats={stats} />

      {/* Список агентов */}
      <div className="mt-8">
        <h2 className="mb-4 text-lg font-bold">Ваши агенты</h2>

        {sellerAgents.length === 0 ? (
          <div className="rounded-xl border border-border p-12 text-center">
            <Package className="mx-auto h-10 w-10 text-muted-foreground" />
            <h3 className="mt-4 text-base font-bold">Нет агентов</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Создайте своего первого AI-агента и начните зарабатывать.
            </p>
            <Link
              href="/seller/agents/new"
              className="mt-4 inline-flex h-9 items-center rounded-full bg-primary px-4 text-sm font-bold text-white hover:opacity-90"
            >
              Создать агента
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                  className="group rounded-xl border border-border p-4 transition-colors hover:bg-secondary"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="truncate text-[15px] font-bold">
                      {agent.name}
                    </h3>
                    <div className={`flex items-center gap-1 text-xs ${st.color}`}>
                      <StatusIcon className="h-3.5 w-3.5" />
                      {st.label}
                    </div>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {agent.description}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{price}</span>
                    <span>{agent.purchasesCount} покупок</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function BecomeSellerPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
      <Store className="mx-auto h-12 w-12 text-primary" />
      <h1 className="mt-6 text-2xl font-bold sm:text-3xl">
        Продавайте AI-агентов
      </h1>
      <p className="mt-3 text-muted-foreground">
        Создавайте AI-агентов, которые работают 24/7 в Docker-контейнерах.
        Покупатели платят подписку или разово — вы получаете 85% от каждого платежа.
      </p>

      <div className="mt-8 grid gap-4 text-left sm:grid-cols-3">
        {[
          {
            title: "1. Создайте агента",
            desc: "Опишите, загрузите Docker-образ, настройте поля для покупателей.",
          },
          {
            title: "2. Модерация",
            desc: "Мы проверим агента и опубликуем его в каталоге.",
          },
          {
            title: "3. Получайте доход",
            desc: "Покупатели подключают агента — вы получаете 85% с каждого платежа.",
          },
        ].map((step) => (
          <div
            key={step.title}
            className="rounded-xl border border-border p-4"
          >
            <h3 className="text-sm font-bold">{step.title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{step.desc}</p>
          </div>
        ))}
      </div>

      <BecomeSellerButton />
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
        className="mt-8 inline-flex h-10 items-center rounded-full bg-primary px-6 text-sm font-bold text-white hover:opacity-90"
      >
        Стать продавцом
      </button>
    </form>
  );
}
