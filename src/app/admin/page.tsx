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
  Clock,
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
    { label: "Пользователи", value: usersCount?.count || 0, sub: `${sellersCount?.count || 0} продавцов`, icon: Users, color: "text-blue-500" },
    { label: "Агенты", value: agentsTotal?.count || 0, sub: `${agentsPublished?.count || 0} опубликовано`, icon: Package, color: "text-violet-500" },
    { label: "Подписки", value: subsData?.count || 0, sub: `${activeSubs?.count || 0} активных`, icon: ShoppingCart, color: "text-green-500" },
    { label: "Комиссия (15%)", value: `${formatPrice(Math.floor(totalRevenue * 0.15))} ₽`, sub: `Выручка ${formatPrice(totalRevenue)} ₽`, icon: TrendingUp, color: "text-amber-500" },
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
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-2">
        <Shield className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold sm:text-3xl">Админ-панель</h1>
      </div>

      {/* Статистика */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-xl border border-border p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{s.label}</span>
                <Icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <div className="mt-2 text-xl font-bold">{s.value}</div>
              <p className="mt-0.5 text-xs text-muted-foreground">{s.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Очередь модерации */}
      <div className="mt-8">
        <h2 className="mb-4 text-lg font-bold">
          Очередь модерации
          {reviewQueue.length > 0 && (
            <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-yellow-500/20 text-xs text-yellow-500">
              {reviewQueue.length}
            </span>
          )}
        </h2>

        {reviewQueue.length === 0 ? (
          <div className="rounded-xl border border-border p-12 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-green-500" />
            <h3 className="mt-4 text-base font-bold">Всё проверено</h3>
            <p className="mt-1 text-sm text-muted-foreground">
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
    <div className="rounded-xl border border-border p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-[15px] font-bold">{agent.name}</h3>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">
              {agent.category}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {agent.description}
          </p>
          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
            <span>{price}</span>
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
            className="inline-flex h-8 items-center gap-1 rounded-full bg-green-600 px-3 text-xs font-bold text-white hover:bg-green-700"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Одобрить
          </button>
          <button
            type="submit"
            name="action"
            value="reject"
            className="inline-flex h-8 items-center gap-1 rounded-full bg-red-600 px-3 text-xs font-bold text-white hover:bg-red-700"
          >
            <XCircle className="h-3.5 w-3.5" />
            Отклонить
          </button>
        </form>
      </div>
    </div>
  );
}
