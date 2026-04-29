import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  agents,
  profiles,
  sellerApplications,
  subscriptions,
} from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { getUser } from "@/lib/auth-server";
import { sellerPayout } from "@/lib/compute";
import { addMoney, formatMoneySummary, type MoneyByCurrency } from "@/lib/money";
import {
  Users,
  Package,
  ShoppingCart,
  TrendingUp,
  CheckCircle2,
  XCircle,
  FileSearch,
  ClipboardList,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Админ-панель - hireon",
};

export default async function AdminPage() {
  const user = await getUser();
  if (!user) redirect("/auth/login?next=/admin");

  const [profile] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (!profile || profile.role !== "admin") {
    redirect("/");
  }

  const [usersCount] = await db.select({ count: sql<number>`count(*)` }).from(profiles);
  const [sellersCount] = await db.select({ count: sql<number>`count(*)` }).from(profiles).where(eq(profiles.role, "seller"));
  const [pendingOnboardingCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(profiles)
    .where(eq(profiles.onboardingStatus, "pending_review"));
  const [pendingApplicationsCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(sellerApplications)
    .where(eq(sellerApplications.status, "pending"));
  const [agentsTotal] = await db.select({ count: sql<number>`count(*)` }).from(agents);
  const [agentsPublished] = await db.select({ count: sql<number>`count(*)` }).from(agents).where(eq(agents.status, "published"));

  // Для дохода платформы нужно знать seller_price отдельно от total.
  // platformRevenue = хостинг (compute passthrough) + 12% комиссии с seller_price
  //                 = Σ (sub.amount − sellerPayout(seller_price))
  // Для admin-агентов (seller_id=NULL) sellerPayout=0 → вся сумма платформе.
  const subsRows = await db
    .select({
      status: subscriptions.status,
      amount: subscriptions.amount,
      currency: subscriptions.currency,
      sellerPrice: subscriptions.sellerPrice,
      purchaseType: subscriptions.purchaseType,
      agentSellerId: agents.sellerId,
      agentPriceMonthly: agents.priceMonthly,
      agentPriceOnetime: agents.priceOnetime,
    })
    .from(subscriptions)
    .leftJoin(agents, eq(subscriptions.agentId, agents.id));

  const totalRevenue = subsRows.reduce(
    (sum, s) => addMoney(sum, s.currency, s.amount || 0),
    {} as MoneyByCurrency,
  );
  const activeCount = subsRows.filter((s) => s.status === "active").length;
  const platformRevenue = subsRows.reduce((sum, s) => {
    const amount = s.amount || 0;
    if (!s.agentSellerId) return addMoney(sum, s.currency, amount);
    const sellerPrice = s.sellerPrice ?? (
      s.purchaseType === "subscription" ? s.agentPriceMonthly : s.agentPriceOnetime
    );
    const sellerShare = sellerPrice != null ? sellerPayout(sellerPrice) : 0;
    return addMoney(sum, s.currency, amount - sellerShare);
  }, {} as MoneyByCurrency);

  const stats = [
    { label: "Пользователи", value: usersCount?.count || 0, sub: `${sellersCount?.count || 0} продавцов`, icon: Users },
    { label: "Агенты", value: agentsTotal?.count || 0, sub: `${agentsPublished?.count || 0} опубликовано`, icon: Package },
    { label: "Подписки", value: subsRows.length, sub: `${activeCount} активных`, icon: ShoppingCart },
    {
      label: "Доход платформы",
      value: formatMoneySummary(platformRevenue),
      sub: `Оборот ${formatMoneySummary(totalRevenue)}`,
      icon: TrendingUp,
    },
  ];

  const reviewQueue = await db
    .select({
      id: agents.id,
      name: agents.name,
      slug: agents.slug,
      description: agents.description,
      category: agents.category,
      pricingModel: agents.pricingModel,
      priceMonthly: agents.priceMonthly,
      priceOnetime: agents.priceOnetime,
      status: agents.status,
      sellerId: agents.sellerId,
      createdAt: agents.createdAt,
    })
    .from(agents)
    .where(eq(agents.status, "review"))
    .orderBy(desc(agents.createdAt));

  return (
    <section className="mx-auto max-w-6xl px-5 sm:px-6">
      <div className="py-10 sm:py-14">
        <div className="mb-8">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Администрирование
          </p>
          <h1 className="mt-2 text-[2rem] font-bold tracking-[-0.03em] sm:text-[2.5rem]">
            Админ-панель
          </h1>
        </div>

        {/* Модерация */}
        <div className="mb-8">
          <h2 className="mb-4 text-[18px] font-semibold tracking-tight">Модерация</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border border-border/40 bg-muted/20 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[15px] font-semibold">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    Агенты
                  </div>
                  <p className="mt-1.5 text-[13px] text-muted-foreground">
                    Очередь модерации агентов и статистика по маркетплейсу.
                  </p>
                </div>
                <span className="rounded-md border border-border/40 px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                  текущая
                </span>
              </div>
            </div>

            <Link
              href="/admin/applications"
              className="rounded-lg border border-border/40 p-5 transition-colors hover:border-border"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[15px] font-semibold">
                    <ClipboardList className="h-4 w-4 text-muted-foreground" />
                    Заявки продавцов
                  </div>
                  <p className="mt-1.5 text-[13px] text-muted-foreground">
                    Проверка заявок на размещение агентов в каталоге.
                  </p>
                </div>
                <span className="rounded-md border border-border/40 px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                  {pendingApplicationsCount?.count ? pendingApplicationsCount.count : "—"}
                </span>
              </div>
            </Link>

            <Link
              href="/admin/sellers/onboarding"
              className="rounded-lg border border-border/40 p-5 transition-colors hover:border-border"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[15px] font-semibold">
                    <FileSearch className="h-4 w-4 text-muted-foreground" />
                    Онбординг выплат
                  </div>
                  <p className="mt-1.5 text-[13px] text-muted-foreground">
                    Проверка заявок на подключение продавцов к выплатам.
                  </p>
                </div>
                <span className="rounded-md border border-border/40 px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                  {pendingOnboardingCount?.count ? pendingOnboardingCount.count : "—"}
                </span>
              </div>
            </Link>
          </div>
        </div>

        {/* Статистика */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="rounded-lg border border-border/40 p-5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                    {s.label}
                  </span>
                  <Icon className="h-4 w-4 text-muted-foreground/50" />
                </div>
                <div className="mt-3 text-[1.5rem] font-bold tracking-tight">{s.value}</div>
                <p className="mt-1 text-[11px] text-muted-foreground">{s.sub}</p>
              </div>
            );
          })}
        </div>

        {/* Очередь модерации */}
        <div className="mt-10">
          <h2 className="mb-5 flex items-center gap-2 text-[18px] font-semibold tracking-tight">
            Очередь модерации
            {reviewQueue.length > 0 && (
              <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-md bg-amber-500/10 px-1.5 font-mono text-[11px] font-medium text-amber-400">
                {reviewQueue.length}
              </span>
            )}
          </h2>

          {reviewQueue.length === 0 ? (
            <div className="rounded-lg border border-border/40 p-14 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-border/40 text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-[15px] font-semibold">Всё проверено</h3>
              <p className="mt-1.5 text-[13px] text-muted-foreground">
                Нет агентов, ожидающих модерации.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviewQueue.map((agent) => (
                <ModerationCard key={agent.id} agent={agent} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ModerationCard({
  agent,
}: {
  agent: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    category: string | null;
    pricingModel: string;
    priceMonthly: number | null;
    priceOnetime: number | null;
    sellerId: string | null;
    createdAt: Date;
  };
}) {
  const price = agent.priceMonthly
    ? `${(agent.priceMonthly / 100).toFixed(0)} ₽/мес`
    : agent.priceOnetime
      ? `${(agent.priceOnetime / 100).toFixed(0)} ₽`
      : "—";

  async function moderate(formData: FormData) {
    "use server";

    const action = formData.get("action") as string;
    const agentId = formData.get("agentId") as string;

    const u = await getUser();
    if (!u) return;

    const [p] = await db
      .select({ role: profiles.role })
      .from(profiles)
      .where(eq(profiles.id, u.id))
      .limit(1);

    if (!p || p.role !== "admin") return;

    const newStatus = action === "approve" ? "published" : "rejected";
    await db
      .update(agents)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(agents.id, agentId));

    const { redirect } = await import("next/navigation");
    redirect("/admin");
  }

  return (
    <div className="rounded-lg border border-border/40 p-5 transition-colors hover:border-border">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-[15px] font-semibold">{agent.name}</h3>
            <span className="rounded-md border border-border/40 px-2 py-0.5 text-[11px] text-muted-foreground">
              {agent.category}
            </span>
          </div>
          <p className="mt-1.5 line-clamp-2 text-[13px] text-muted-foreground">
            {agent.description}
          </p>
          <div className="mt-3 flex items-center gap-3 font-mono text-[11px] text-muted-foreground">
            <span className="font-sans font-medium text-foreground">{price}</span>
            <span>slug: {agent.slug}</span>
            <span>{agent.createdAt.toLocaleDateString("ru-RU")}</span>
          </div>
        </div>

        <form action={moderate} className="flex items-center gap-2">
          <input type="hidden" name="agentId" value={agent.id} />
          <button
            type="submit"
            name="action"
            value="approve"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-500/10 px-4 text-[12px] font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Одобрить
          </button>
          <button
            type="submit"
            name="action"
            value="reject"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-500/20 px-4 text-[12px] font-medium text-red-400 transition-colors hover:bg-red-500/5"
          >
            <XCircle className="h-3.5 w-3.5" />
            Отклонить
          </button>
        </form>
      </div>
    </div>
  );
}
