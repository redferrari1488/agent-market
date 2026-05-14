import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { agents, profiles, subscriptions, payouts, sellerApplications } from "@/lib/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
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
  ArrowRight,
} from "lucide-react";
import { StatsCards } from "@/components/seller/StatsCards";
import { BecomeSellerLanding } from "@/components/seller/BecomeSellerLanding";

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
  review: { label: "На модерации", icon: Clock, color: "text-amber-300/80" },
  published: { label: "Опубликован", icon: CheckCircle2, color: "text-foreground" },
  rejected: { label: "Отклонён", icon: XCircle, color: "text-rose-300" },
};

export default async function SellerPage({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }>;
}) {
  const user = await getUser();

  // Unauth: показываем витрину «Стать продавцом» с CTA «войти и подать заявку».
  // Раньше был redirect на /auth/login, из-за чего страница была недоступна
  // как маркетинговая для незалогиненных посетителей.
  if (!user) {
    return (
      <BecomeSellerPage
        userEmail={null}
        userName={null}
        hasPendingApplication={false}
        applicationDate={null}
        isAuthenticated={false}
      />
    );
  }

  const [profile] = await db
    .select({
      role: profiles.role,
      yookassaAccountId: profiles.yookassaAccountId,
      cryptomusWalletAddress: profiles.cryptomusWalletAddress,
    })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  // Admin-only preview of the BecomeSellerLanding (vitrina) for QA on mobile
  // when the admin's actual role would otherwise route them to the dashboard.
  const isAdminPreview =
    profile?.role === "admin" && (await searchParams).preview !== undefined;

  if (
    !profile ||
    isAdminPreview ||
    (profile.role !== "seller" && profile.role !== "admin")
  ) {
    const [pendingApp] = await db
      .select({ id: sellerApplications.id, createdAt: sellerApplications.createdAt })
      .from(sellerApplications)
      .where(
        and(
          eq(sellerApplications.userId, user.id),
          eq(sellerApplications.status, "pending"),
        ),
      )
      .orderBy(desc(sellerApplications.createdAt))
      .limit(1);

    return (
      <BecomeSellerPage
        userEmail={user.email ?? null}
        userName={user.name ?? null}
        hasPendingApplication={!!pendingApp}
        applicationDate={pendingApp?.createdAt ?? null}
        isAuthenticated={true}
      />
    );
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
            <p className="font-mono text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Продавцам
            </p>
            <h1 className="mt-3 text-[1.75rem] font-bold leading-[1.05] tracking-[-0.025em] sm:text-[2.25rem]">
              Панель продавца
            </h1>
            <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
              Управление агентами и доходом
            </p>
          </div>
          <Link
            href="/seller/agents/new"
            className="inline-flex h-10 shrink-0 items-center gap-2 self-start rounded-[2px] bg-foreground px-5 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-background transition-opacity hover:opacity-90 sm:self-auto"
          >
            <Plus className="h-3.5 w-3.5" />
            Новый агент
          </Link>
        </div>

        <StatsCards stats={stats} />

        {hasRealSale &&
          !profile.yookassaAccountId &&
          !profile.cryptomusWalletAddress && (
            <div className="mt-6 rounded-[2px] border border-amber-300/20 bg-amber-300/[0.04] p-4 font-mono text-[12px] uppercase tracking-[0.04em] text-amber-200/90">
              У тебя есть продажи — настрой выплаты.{" "}
              <Link
                href="/seller/onboarding"
                className="font-medium text-amber-100 underline underline-offset-4"
              >
                Подключить
              </Link>
            </div>
          )}

        <div className="mt-10">
          <h2 className="mb-5 font-mono text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Ваши агенты
          </h2>

          {sellerAgents.length === 0 ? (
            <div className="rounded-[2px] border border-[rgba(244,236,222,0.08)] bg-[#161412] p-14 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[2px] border border-[rgba(244,236,222,0.08)] text-muted-foreground">
                <Package className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-[15px] font-semibold">Нет агентов</h3>
              <p className="mt-1.5 text-[13px] text-muted-foreground">
                Создайте своего первого AI-агента и начните зарабатывать.
              </p>
              <Link
                href="/seller/agents/new"
                className="group mt-6 inline-flex h-10 items-center gap-2 rounded-[2px] bg-foreground px-5 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-background transition-opacity hover:opacity-90"
              >
                Создать агента
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
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
                    className="group flex flex-col rounded-[2px] border border-[rgba(244,236,222,0.08)] bg-[#161412] p-5 transition-colors hover:border-[rgba(244,236,222,0.18)]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="truncate text-[14px] font-semibold">{agent.name}</h3>
                      <div className={`flex shrink-0 items-center gap-1 font-mono text-[10.5px] uppercase tracking-[0.06em] ${st.color}`}>
                        <StatusIcon className="h-3 w-3" />
                        {st.label}
                      </div>
                    </div>
                    <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
                      {agent.description}
                    </p>
                    <div className="mt-4 flex items-center justify-between border-t border-[rgba(244,236,222,0.06)] pt-3 font-mono text-[11px] uppercase tracking-[0.06em] text-muted-foreground">
                      <span className="text-foreground">{price}</span>
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

function BecomeSellerPage({
  userEmail,
  userName,
  hasPendingApplication,
  applicationDate,
  isAuthenticated,
}: {
  userEmail: string | null;
  userName: string | null;
  hasPendingApplication: boolean;
  applicationDate: Date | null;
  isAuthenticated: boolean;
}) {
  return (
    <BecomeSellerLanding
      defaultEmail={userEmail}
      defaultName={userName}
      hasPendingApplication={hasPendingApplication}
      applicationDate={applicationDate}
      isAuthenticated={isAuthenticated}
    />
  );
}

