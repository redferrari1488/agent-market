import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { subscriptions, agents } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getUser } from "@/lib/auth-server";
import { formatMinorAmount } from "@/lib/money";
import {
  Bot,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  ArrowRight,
  MessageSquare,
  PenTool,
  BarChart3,
  ShoppingCart,
  Activity,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Мои агенты - Hireon",
  description: "Управление подписками и настройками AI-агентов.",
};

const statusConfig: Record<
  string,
  { label: string; icon: React.ElementType; color: string; dot: string }
> = {
  pending_setup: {
    label: "Требует настройки",
    icon: Clock,
    color: "text-amber-400",
    dot: "bg-amber-400",
  },
  active: {
    label: "Работает",
    icon: CheckCircle2,
    color: "text-emerald-400",
    dot: "bg-emerald-400",
  },
  paused: {
    label: "Остановлен",
    icon: AlertCircle,
    color: "text-muted-foreground",
    dot: "bg-muted-foreground",
  },
  cancelled: {
    label: "Отменён",
    icon: XCircle,
    color: "text-red-400",
    dot: "bg-red-400",
  },
  expired: {
    label: "Истёк",
    icon: XCircle,
    color: "text-red-400",
    dot: "bg-red-400",
  },
};

const categoryConfig: Record<
  string,
  { icon: React.ElementType; accent: string; bg: string }
> = {
  support: { icon: MessageSquare, accent: "text-blue-400", bg: "bg-blue-500/10" },
  content: { icon: PenTool, accent: "text-violet-400", bg: "bg-violet-500/10" },
  analytics: { icon: BarChart3, accent: "text-emerald-400", bg: "bg-emerald-500/10" },
  sales: { icon: ShoppingCart, accent: "text-amber-400", bg: "bg-amber-500/10" },
  monitoring: { icon: Activity, accent: "text-cyan-400", bg: "bg-cyan-500/10" },
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
      // amount — total (seller + compute), зафиксированный на момент checkout.
      // Источник истины для отображения цены юзеру.
      amount: subscriptions.amount,
      currency: subscriptions.currency,
      agentId: agents.id,
      agentName: agents.name,
      agentSlug: agents.slug,
      agentDescription: agents.description,
      agentCategory: agents.category,
    })
    .from(subscriptions)
    .leftJoin(agents, eq(subscriptions.agentId, agents.id))
    .where(eq(subscriptions.userId, user.id))
    .orderBy(desc(subscriptions.startedAt));

  const activeCount = rows.filter((r) => r.status === "active").length;
  const pendingCount = rows.filter((r) => r.status === "pending_setup").length;
  const pausedCount = rows.filter(
    (r) => r.status === "paused" || r.status === "cancelled" || r.status === "expired"
  ).length;

  return (
    <section className="mx-auto max-w-5xl px-5 sm:px-6">
      <div className="py-10 sm:py-14">
        <div className="mb-8">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Дашборд
          </p>
          <h1 className="mt-2 text-[2rem] font-bold leading-[1.05] tracking-[-0.03em] sm:text-[2.5rem]">
            Мои агенты
          </h1>
          <p className="mt-2 text-[15px] text-muted-foreground">
            Управление подписками и разовыми покупками
          </p>
        </div>

        {params.checkout === "success" && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
            <div className="text-[13px]">
              <div className="font-medium text-emerald-400">Оплата прошла успешно</div>
              <p className="mt-0.5 text-muted-foreground">
                Настройте агента, чтобы он начал работу.
              </p>
            </div>
          </div>
        )}

        {rows.length > 0 && (
          <div className="mb-6 grid grid-cols-1 divide-y sm:divide-y-0 sm:grid-cols-3 sm:divide-x divide-border/40 rounded-lg border border-border/40">
            {[
              { label: "Работают", value: activeCount, color: "text-emerald-400", dot: "bg-emerald-400" },
              { label: "Ждут настройки", value: pendingCount, color: "text-amber-400", dot: "bg-amber-400" },
              { label: "Приостановлены", value: pausedCount, color: "text-muted-foreground", dot: "bg-muted-foreground" },
            ].map((s) => (
              <div key={s.label} className="px-4 py-4 sm:px-6 sm:py-5">
                <div className="flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.15em] text-muted-foreground/70">
                  <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                  {s.label}
                </div>
                <div className={`mt-2 text-[1.25rem] sm:text-[1.75rem] font-bold tabular-nums tracking-tight ${s.color}`}>
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        )}

        {rows.length === 0 ? (
          <div className="rounded-lg border border-border/40 p-10 text-center sm:p-14">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-border/40 text-muted-foreground">
              <Bot className="h-5 w-5" />
            </div>
            <h3 className="mt-5 text-[15px] font-semibold">Пока нет агентов</h3>
            <p className="mt-1.5 text-[13px] text-muted-foreground">
              Выберите агента в каталоге и подключите его за минуту.
            </p>
            <Link
              href="/agents"
              className="group mt-6 inline-flex h-10 items-center gap-2 rounded-lg bg-foreground px-5 text-[13px] font-medium text-background transition-opacity hover:opacity-90"
            >
              В каталог
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {rows.map((sub) => {
              if (!sub.agentName) return null;

              const st = statusConfig[sub.status] || statusConfig.pending_setup;
              const StatusIcon = st.icon;
              const cat = categoryConfig[sub.agentCategory || "support"] || categoryConfig.support;
              const CatIcon = cat.icon;
              const amountLabel =
                sub.amount != null
                  ? formatMinorAmount(sub.amount, sub.currency)
                  : "—";
              const price =
                sub.purchaseType === "subscription"
                  ? `${amountLabel}/мес`
                  : amountLabel;

              return (
                <Link
                  key={sub.id}
                  href={`/dashboard/agents/${sub.id}`}
                  className="group flex flex-col rounded-lg border border-border/40 p-5 transition-colors hover:border-border"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${cat.bg} ${cat.accent}`}
                    >
                      <CatIcon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-[15px] font-semibold tracking-tight">
                        {sub.agentName}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
                        {sub.agentDescription}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-border/40 pt-4">
                    <div
                      className={`flex items-center gap-1.5 text-[12px] font-medium ${st.color}`}
                    >
                      <span className="relative flex h-1.5 w-1.5">
                        {sub.status === "active" && (
                          <span
                            className={`absolute inline-flex h-full w-full animate-ping rounded-full ${st.dot} opacity-60`}
                          />
                        )}
                        <span
                          className={`relative inline-flex h-1.5 w-1.5 rounded-full ${st.dot}`}
                        />
                      </span>
                      <StatusIcon className="h-3 w-3" />
                      {st.label}
                    </div>
                    <span className="font-mono text-[12px] text-muted-foreground">{price}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
