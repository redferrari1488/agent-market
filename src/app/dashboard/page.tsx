import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { subscriptions, agents } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getUser } from "@/lib/auth-server";
import { Bot, CheckCircle2, Clock, AlertCircle, XCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Мои агенты — AgentMarket",
  description: "Управление подписками и настройками AI-агентов.",
};

const statusConfig: Record<
  string,
  { label: string; icon: React.ElementType; color: string }
> = {
  pending_setup: { label: "Требует настройки", icon: Clock, color: "text-amber-400" },
  active: { label: "Работает", icon: CheckCircle2, color: "text-emerald-400" },
  paused: { label: "Остановлен", icon: AlertCircle, color: "text-muted-foreground" },
  cancelled: { label: "Отменён", icon: XCircle, color: "text-red-400" },
  expired: { label: "Истёк", icon: XCircle, color: "text-red-400" },
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const params = await searchParams;
  const user = await getUser();

  if (!user) redirect("/");

  const rows = await db
    .select({
      id: subscriptions.id,
      status: subscriptions.status,
      purchaseType: subscriptions.purchaseType,
      startedAt: subscriptions.startedAt,
      agentId: agents.id,
      agentName: agents.name,
      agentSlug: agents.slug,
      agentDescription: agents.description,
      agentCategory: agents.category,
      agentPriceMonthly: agents.priceMonthly,
      agentPriceOnetime: agents.priceOnetime,
    })
    .from(subscriptions)
    .leftJoin(agents, eq(subscriptions.agentId, agents.id))
    .where(eq(subscriptions.userId, user.id))
    .orderBy(desc(subscriptions.startedAt));

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[400px] overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[350px] w-[700px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-violet-600/10 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Мои{" "}
            <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
              агенты
            </span>
          </h1>
          <p className="mt-2 text-muted-foreground">
            Управление подписками и разовыми покупками
          </p>
        </div>

        {params.checkout === "success" && (
          <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm backdrop-blur-sm">
            <div className="flex items-center gap-2 font-medium text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              Оплата прошла успешно
            </div>
            <p className="mt-1 text-muted-foreground">
              Настройте агента, чтобы он начал работу.
            </p>
          </div>
        )}

        {rows.length === 0 ? (
          <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 p-14 text-center backdrop-blur-sm">
            <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-60 -translate-x-1/2 rounded-full bg-violet-500/10 blur-3xl" />
            <div className="relative">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-400">
                <Bot className="h-7 w-7" />
              </div>
              <h3 className="mt-5 text-lg font-bold">Пока нет агентов</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Выберите агента в каталоге и подключите его за минуту.
              </p>
              <Link
                href="/agents"
                className="mt-6 inline-flex h-10 items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-blue-600 px-5 text-sm font-bold text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/40 hover:brightness-110"
              >
                В каталог
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {rows.map((sub) => {
              if (!sub.agentName) return null;

              const st = statusConfig[sub.status] || statusConfig.pending_setup;
              const StatusIcon = st.icon;
              const price =
                sub.purchaseType === "subscription"
                  ? `${((sub.agentPriceMonthly || 0) / 100).toFixed(0)} ₽/мес`
                  : `${((sub.agentPriceOnetime || 0) / 100).toFixed(0)} ₽ разово`;

              return (
                <Link
                  key={sub.id}
                  href={`/dashboard/agents/${sub.id}`}
                  className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 p-5 backdrop-blur-sm transition-all hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/5"
                >
                  <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-violet-500/0 blur-2xl transition-all group-hover:bg-violet-500/10" />
                  <div className="relative">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="truncate text-base font-bold">{sub.agentName}</h3>
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
                      {sub.agentDescription}
                    </p>

                    <div className="mt-5 flex items-center justify-between border-t border-border/30 pt-4">
                      <div className={`flex items-center gap-1.5 text-xs font-medium ${st.color}`}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        {st.label}
                      </div>
                      <span className="text-xs text-muted-foreground">{price}</span>
                    </div>
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
