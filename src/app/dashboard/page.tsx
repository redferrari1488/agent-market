import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { subscriptions, agents } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getUser } from "@/lib/auth-server";
import { Bot, CheckCircle2, Clock, AlertCircle, XCircle } from "lucide-react";

export const dynamic = "force-dynamic";

const statusConfig: Record<
  string,
  { label: string; icon: React.ElementType; color: string }
> = {
  pending_setup: { label: "Требует настройки", icon: Clock, color: "text-yellow-500" },
  active: { label: "Работает", icon: CheckCircle2, color: "text-green-500" },
  paused: { label: "Остановлен", icon: AlertCircle, color: "text-muted-foreground" },
  cancelled: { label: "Отменён", icon: XCircle, color: "text-red-500" },
  expired: { label: "Истёк", icon: XCircle, color: "text-red-500" },
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
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold sm:text-3xl">Мои агенты</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Управление подписками и разовыми покупками
        </p>
      </div>

      {params.checkout === "success" && (
        <div className="mb-6 rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-sm">
          <div className="flex items-center gap-2 font-medium text-green-500">
            <CheckCircle2 className="h-4 w-4" />
            Оплата прошла успешно
          </div>
          <p className="mt-1 text-muted-foreground">
            Настройте агента, чтобы он начал работу.
          </p>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="rounded-xl border border-border p-12 text-center">
          <Bot className="mx-auto h-10 w-10 text-muted-foreground" />
          <h3 className="mt-4 text-base font-bold">Пока нет агентов</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Выберите агента в каталоге и подключите его за минуту.
          </p>
          <Link
            href="/agents"
            className="mt-4 inline-flex h-9 items-center rounded-full bg-primary px-4 text-sm font-bold text-white hover:opacity-90"
          >
            В каталог
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
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
                className="group rounded-xl border border-border p-4 transition-colors hover:bg-secondary"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-[15px] font-bold">{sub.agentName}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {sub.agentDescription}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className={`flex items-center gap-1.5 text-xs ${st.color}`}>
                    <StatusIcon className="h-3.5 w-3.5" />
                    {st.label}
                  </div>
                  <span className="text-xs text-muted-foreground">{price}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
