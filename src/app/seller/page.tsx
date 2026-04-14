import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { agents, profiles, subscriptions, payouts } from "@/lib/db/schema";
import { eq, and, desc, inArray, sql } from "drizzle-orm";
import { getUser } from "@/lib/auth-server";
import { sellerPayout } from "@/lib/compute";
import {
  Plus,
  Package,
  Clock,
  CheckCircle2,
  FileEdit,
  XCircle,
  Store,
  ArrowRight,
} from "lucide-react";
import { StatsCards } from "@/components/seller/StatsCards";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Панель продавца - AgentMarket",
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

  const [profile] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (!profile || (profile.role !== "seller" && profile.role !== "admin")) {
    return <BecomeSellerPage />;
  }

  const sellerAgents = await db
    .select()
    .from(agents)
    .where(eq(agents.sellerId, user.id))
    .orderBy(desc(agents.createdAt));

  const agentIds = sellerAgents.map((a) => a.id);

  let totalSubs = 0;
  let activeSubs = 0;
  let totalRevenue = 0;
  let sellerRevenue = 0;

  if (agentIds.length > 0) {
    // JOIN нужен чтобы знать seller_price отдельно от total — compute-часть
    // не должна идти в split, поэтому умножать total на 0.88 некорректно.
    const subsRows = await db
      .select({
        status: subscriptions.status,
        amount: subscriptions.amount,
        purchaseType: subscriptions.purchaseType,
        agentPriceMonthly: agents.priceMonthly,
        agentPriceOnetime: agents.priceOnetime,
      })
      .from(subscriptions)
      .leftJoin(agents, eq(subscriptions.agentId, agents.id))
      .where(inArray(subscriptions.agentId, agentIds));

    totalSubs = subsRows.length;
    activeSubs = subsRows.filter(
      (s) => s.status === "active" || s.status === "pending_setup"
    ).length;
    totalRevenue = subsRows.reduce((sum, s) => sum + (s.amount || 0), 0);
    sellerRevenue = subsRows.reduce((sum, s) => {
      const sellerPrice =
        s.purchaseType === "subscription" ? s.agentPriceMonthly : s.agentPriceOnetime;
      return sum + (sellerPrice != null ? sellerPayout(sellerPrice) : 0);
    }, 0);
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
    sellerRevenue,
    totalPaidOut,
  };

  return (
    <section className="mx-auto max-w-6xl px-5 sm:px-6">
      <div className="py-10 sm:py-14">
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Продавцам
            </p>
            <h1 className="mt-2 text-[2rem] font-bold leading-[1.05] tracking-[-0.03em] sm:text-[2.5rem]">
              Панель продавца
            </h1>
            <p className="mt-2 text-[15px] text-muted-foreground">
              Управление агентами и доходом
            </p>
          </div>
          <Link
            href="/seller/agents/new"
            className="inline-flex h-10 shrink-0 items-center gap-1.5 self-start rounded-lg bg-foreground px-5 text-[13px] font-medium text-background transition-opacity hover:opacity-90 sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            Новый агент
          </Link>
        </div>

        <StatsCards stats={stats} />

        <div className="mt-10">
          <h2 className="mb-5 text-[18px] font-semibold tracking-tight">Ваши агенты</h2>

          {sellerAgents.length === 0 ? (
            <div className="rounded-lg border border-border/40 p-14 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-border/40 text-muted-foreground">
                <Package className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-[15px] font-semibold">Нет агентов</h3>
              <p className="mt-1.5 text-[13px] text-muted-foreground">
                Создайте своего первого AI-агента и начните зарабатывать.
              </p>
              <Link
                href="/seller/agents/new"
                className="group mt-6 inline-flex h-10 items-center gap-2 rounded-lg bg-foreground px-5 text-[13px] font-medium text-background transition-opacity hover:opacity-90"
              >
                Создать агента
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
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
                    className="group flex flex-col rounded-lg border border-border/40 p-5 transition-colors hover:border-border"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="truncate text-[15px] font-semibold">{agent.name}</h3>
                      <div className={`flex shrink-0 items-center gap-1 text-[12px] font-medium ${st.color}`}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        {st.label}
                      </div>
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-[13px] text-muted-foreground">
                      {agent.description}
                    </p>
                    <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3 text-[12px] text-muted-foreground">
                      <span className="font-medium text-foreground">{price}</span>
                      <span>{agent.purchasesCount} покупок</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function BecomeSellerPage() {
  const steps = [
    { n: "01", title: "Создайте агента", desc: "Опишите, загрузите агента, настройте поля для покупателей." },
    { n: "02", title: "Модерация", desc: "Мы проверим агента и опубликуем его в каталоге." },
    { n: "03", title: "Получайте доход", desc: "Покупатели подключают агента - вы получаете 88% с каждого платежа." },
  ];

  return (
    <section className="mx-auto max-w-3xl px-5 sm:px-6">
      <div className="py-20 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-border/40 text-muted-foreground">
          <Store className="h-5 w-5" />
        </div>
        <h1 className="mt-6 text-[2.5rem] font-bold tracking-[-0.03em] sm:text-[3rem]">
          Продавайте агентов
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
          Создавайте AI-агентов, которые работают 24/7 в облаке.
          Покупатели платят подписку или разово - вы получаете 88% от вашей части каждого платежа.
        </p>

        <div className="mt-12 grid gap-px overflow-hidden rounded-lg border border-border/40 text-left sm:grid-cols-3">
          {steps.map((step) => (
            <div key={step.n} className="p-6">
              <span className="font-mono text-[11px] text-muted-foreground/50">{step.n}</span>
              <h3 className="mt-2 text-[15px] font-semibold">{step.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                {step.desc}
              </p>
            </div>
          ))}
        </div>

        <BecomeSellerButton />
      </div>
    </section>
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
        className="mt-10 inline-flex h-11 items-center gap-2 rounded-lg bg-foreground px-6 text-[14px] font-medium text-background transition-opacity hover:opacity-90"
      >
        Стать продавцом
      </button>
    </form>
  );
}
