import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { agents, profiles, subscriptions, payouts } from "@/lib/db/schema";
import { eq, and, desc, inArray, sql } from "drizzle-orm";
import { getUser } from "@/lib/auth-server";
import { sellerPayout } from "@/lib/compute";
import { addMoney, type MoneyByCurrency } from "@/lib/money";
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
import { BecomeSellerSteps } from "@/components/seller/BecomeSellerSteps";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Панель продавца - hireon",
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
    .select({
      role: profiles.role,
      yookassaAccountId: profiles.yookassaAccountId,
      cryptomusWalletAddress: profiles.cryptomusWalletAddress,
    })
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
  let totalRevenue: MoneyByCurrency = {};
  let sellerRevenue: MoneyByCurrency = {};
  let hasRealSale = false;

  if (agentIds.length > 0) {
    // JOIN нужен чтобы знать seller_price отдельно от total — compute-часть
    // не должна идти в split, поэтому умножать total на 0.88 некорректно.
    const subsRows = await db
      .select({
        status: subscriptions.status,
        amount: subscriptions.amount,
        currency: subscriptions.currency,
        sellerPrice: subscriptions.sellerPrice,
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
    totalRevenue = subsRows.reduce(
      (sum, s) => addMoney(sum, s.currency, s.amount || 0),
      {} as MoneyByCurrency,
    );
    sellerRevenue = subsRows.reduce((sum, s) => {
      const sellerPrice = s.sellerPrice ?? (
        s.purchaseType === "subscription" ? s.agentPriceMonthly : s.agentPriceOnetime
      );
      return sellerPrice != null
        ? addMoney(sum, s.currency, sellerPayout(sellerPrice))
        : sum;
    }, {} as MoneyByCurrency);
    hasRealSale = subsRows.some(
      (s) =>
        (s.status === "active" ||
          s.status === "cancelled" ||
          s.status === "expired") &&
        (s.sellerPrice ?? 0) > 0,
    );
  }

  const payoutRows = await db
    .select({
      amount: payouts.amount,
      currency: payouts.currency,
    })
    .from(payouts)
    .where(and(eq(payouts.sellerId, user.id), eq(payouts.status, "completed")));

  const totalPaidOut = payoutRows.reduce(
    (sum, row) => addMoney(sum, row.currency, row.amount),
    {} as MoneyByCurrency,
  );

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

        {hasRealSale &&
          !profile.yookassaAccountId &&
          !profile.cryptomusWalletAddress && (
            <div className="mt-6 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-[13px] text-amber-400">
              У тебя есть продажи — самое время настроить выплаты.{" "}
              <Link
                href="/seller/onboarding"
                className="font-medium underline underline-offset-4"
              >
                Подключить
              </Link>
            </div>
          )}

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
  return (
    <section className="mx-auto max-w-4xl px-5 sm:px-6">
      <div className="py-20 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-border/40 text-muted-foreground">
          <Store className="h-5 w-5" />
        </div>
        <h1 className="mt-6 text-[2.5rem] font-bold tracking-[-0.03em] sm:text-[3rem]">
          Размещайте агентов
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
          Каталог в pre-launch режиме: вы публикуете AI-агента, получаете лиды
          от покупателей и закрываете сделки напрямую. После открытия
          платформой ИП — переключаемся на split-эквайринг с автоматическими
          выплатами.
        </p>

        <BecomeSellerSteps />

        <SellerPricingTable />

        <BecomeSellerButton />
      </div>
    </section>
  );
}

function SellerPricingTable() {
  const tiers = [
    {
      name: "Free",
      price: "0 ₽",
      period: "навсегда",
      features: ["1 агент в каталоге", "Заявки от покупателей", "Базовая модерация"],
    },
    {
      name: "Pro",
      price: "990 ₽",
      period: "в месяц",
      features: ["До 5 агентов", "Приоритет в модерации", "Telegram-уведомления о лидах"],
      highlighted: true,
    },
    {
      name: "Featured",
      price: "2 990 ₽",
      period: "в месяц",
      features: ["До 20 агентов", "Топ выдачи каталога", "Бейдж «Featured»", "Приоритетная поддержка"],
    },
  ];

  return (
    <div className="mt-16 grid gap-4 text-left sm:grid-cols-3">
      {tiers.map((tier) => (
        <div
          key={tier.name}
          className={`rounded-xl border p-6 ${
            tier.highlighted
              ? "border-primary/40 bg-primary/[0.03]"
              : "border-border/40 bg-card"
          }`}
        >
          <div className="text-[13px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
            {tier.name}
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-[28px] font-bold tracking-tight text-foreground">
              {tier.price}
            </span>
            <span className="text-[13px] text-muted-foreground">{tier.period}</span>
          </div>
          <ul className="mt-5 space-y-2 text-[13px] text-muted-foreground">
            {tier.features.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-foreground/60" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      ))}
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
        className="mt-10 inline-flex h-11 items-center gap-2 rounded-lg bg-foreground px-6 text-[14px] font-medium text-background transition-opacity hover:opacity-90"
      >
        Стать продавцом
      </button>
    </form>
  );
}
