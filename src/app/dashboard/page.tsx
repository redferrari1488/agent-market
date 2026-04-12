import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { subscriptions, agents } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getUser } from "@/lib/auth-server";
import { Bot, CheckCircle2, Clock, AlertCircle, XCircle, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Мои агенты - AgentMarket",
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
    <section className="mx-auto max-w-5xl px-5 sm:px-6">
      <div className="py-10 sm:py-14">
        <div className="mb-8">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Дашборд
          </p>
          <h1 className="mt-2 text-[2rem] font-bold tracking-[-0.03em] sm:text-[2.5rem]">
            Мои агенты
          </h1>
          <p className="mt-2 text-[15px] text-muted-foreground">
            Управление подписками и разовыми покупками
          </p>
        </div>

        {params.checkout === "success" && (
          <div className="mb-6 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 text-[13px]">
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
          <div className="rounded-lg border border-border/40 p-14 text-center">
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
              const price =
                sub.purchaseType === "subscription"
                  ? `${((sub.agentPriceMonthly || 0) / 100).toFixed(0)} ₽/мес`
                  : `${((sub.agentPriceOnetime || 0) / 100).toFixed(0)} ₽ разово`;

              return (
                <Link
                  key={sub.id}
                  href={`/dashboard/agents/${sub.id}`}
                  className="group flex flex-col rounded-lg border border-border/40 p-5 transition-colors hover:border-border"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="truncate text-[15px] font-semibold">{sub.agentName}</h3>
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-[13px] text-muted-foreground">
                    {sub.agentDescription}
                  </p>

                  <div className="mt-auto flex items-center justify-between border-t border-border/40 pt-4 mt-5">
                    <div className={`flex items-center gap-1.5 text-[12px] font-medium ${st.color}`}>
                      <StatusIcon className="h-3.5 w-3.5" />
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
