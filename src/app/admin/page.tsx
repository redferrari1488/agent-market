import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  agents,
  profiles,
  subscriptions,
  payouts,
} from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { getUser } from "@/lib/auth-server";
import {
  Users,
  Package,
  ShoppingCart,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Shield,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Админ-панель — AgentMarket",
};

function formatPrice(kopecks: number) {
  return new Intl.NumberFormat("ru-RU").format(kopecks / 100);
}

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

  // Статистика
  const [usersCount] = await db.select({ count: sql<number>`count(*)` }).from(profiles);
  const [sellersCount] = await db.select({ count: sql<number>`count(*)` }).from(profiles).where(eq(profiles.role, "seller"));
  const [agentsTotal] = await db.select({ count: sql<number>`count(*)` }).from(agents);
  const [agentsPublished] = await db.select({ count: sql<number>`count(*)` }).from(agents).where(eq(agents.status, "published"));
  const [subsData] = await db.select({ count: sql<number>`count(*)`, revenue: sql<number>`coalesce(sum(${subscriptions.amount}), 0)` }).from(subscriptions);
  const [activeSubs] = await db.select({ count: sql<number>`count(*)` }).from(subscriptions).where(eq(subscriptions.status, "active"));

  const totalRevenue = subsData?.revenue || 0;

  const stats = [
    { label: "Пользователи", value: usersCount?.count || 0, sub: `${sellersCount?.count || 0} продавцов`, icon: Users, color: "text-blue-400 bg-blue-500/10", glow: "bg-blue-500/10" },
    { label: "Агенты", value: agentsTotal?.count || 0, sub: `${agentsPublished?.count || 0} опубликовано`, icon: Package, color: "text-violet-400 bg-violet-500/10", glow: "bg-violet-500/10" },
    { label: "Подписки", value: subsData?.count || 0, sub: `${activeSubs?.count || 0} активных`, icon: ShoppingCart, color: "text-emerald-400 bg-emerald-500/10", glow: "bg-emerald-500/10" },
    { label: "Комиссия (15%)", value: `${formatPrice(Math.floor(totalRevenue * 0.15))} ₽`, sub: `Выручка ${formatPrice(totalRevenue)} ₽`, icon: TrendingUp, color: "text-amber-400 bg-amber-500/10", glow: "bg-amber-500/10" },
  ];

  // Агенты на модерации
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
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[400px] overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[350px] w-[800px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-violet-600/10 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 shadow-lg shadow-violet-500/30">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Админ-{" "}
            <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
              панель
            </span>
          </h1>
        </div>

        {/* Статистика */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 p-5 backdrop-blur-sm transition-all hover:border-violet-500/20"
              >
                <div
                  className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl ${s.glow}`}
                />
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">{s.label}</span>
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${s.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-3 text-2xl font-bold">{s.value}</div>
                  <p className="mt-1 text-xs text-muted-foreground">{s.sub}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Очередь модерации */}
        <div className="mt-10">
          <h2 className="mb-5 flex items-center gap-2 text-xl font-bold">
            Очередь модерации
            {reviewQueue.length > 0 && (
              <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10 px-2 text-xs font-medium text-amber-300">
                {reviewQueue.length}
              </span>
            )}
          </h2>

          {reviewQueue.length === 0 ? (
            <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 p-14 text-center backdrop-blur-sm">
              <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-60 -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />
              <div className="relative">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <h3 className="mt-5 text-lg font-bold">Всё проверено</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Нет агентов, ожидающих модерации.
                </p>
              </div>
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
    </div>
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
    <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 p-5 backdrop-blur-sm transition-all hover:border-violet-500/20">
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-amber-500/5 blur-3xl transition-all group-hover:bg-amber-500/10" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-bold">{agent.name}</h3>
            <span className="rounded-full border border-border/50 bg-white/5 px-2.5 py-0.5 text-xs backdrop-blur-sm">
              {agent.category}
            </span>
          </div>
          <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
            {agent.description}
          </p>
          <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{price}</span>
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
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 text-xs font-bold text-white shadow-md shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40 hover:brightness-110"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Одобрить
          </button>
          <button
            type="submit"
            name="action"
            value="reject"
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-4 text-xs font-bold text-red-300 backdrop-blur-sm transition-all hover:border-red-500/50 hover:bg-red-500/20"
          >
            <XCircle className="h-3.5 w-3.5" />
            Отклонить
          </button>
        </form>
      </div>
    </div>
  );
}
