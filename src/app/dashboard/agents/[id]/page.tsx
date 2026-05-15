import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { subscriptions, agents } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getUser } from "@/lib/auth-server";
import { SetupWizard } from "./SetupWizard";
import { ManageView } from "./ManageView";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

type SetupField = {
  key: string;
  label: string;
  type: "text" | "textarea" | "password" | "select";
  options?: string[];
  required?: boolean;
};

const CATEGORY_LABELS: Record<string, string> = {
  support: "Поддержка",
  content: "Контент",
  analytics: "Аналитика",
  sales: "Продажи",
  monitoring: "Мониторинг",
};

const STATUS_LABELS: Record<string, string> = {
  pending_setup: "Требует настройки",
  active: "Работает",
  paused: "Приостановлен биллингом",
  cancelled: "Отменён",
  expired: "Истёк",
};

export default async function ManageSubscriptionPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const user = await getUser();

  if (!user) redirect("/");

  const [row] = await db
    .select({
      id: subscriptions.id,
      status: subscriptions.status,
      purchaseType: subscriptions.purchaseType,
      containerId: subscriptions.containerId,
      startedAt: subscriptions.startedAt,
      providerPaymentId: subscriptions.providerPaymentId,
      providerSubscriptionId: subscriptions.providerSubscriptionId,
      agentId: agents.id,
      agentName: agents.name,
      agentSlug: agents.slug,
      agentDescription: agents.description,
      agentCategory: agents.category,
      agentSetupSchema: agents.setupSchema,
    })
    .from(subscriptions)
    .leftJoin(agents, eq(subscriptions.agentId, agents.id))
    .where(and(eq(subscriptions.id, id), eq(subscriptions.userId, user.id)))
    .limit(1);

  if (!row || !row.agentName) notFound();

  const setupSchema = (row.agentSetupSchema as SetupField[]) || [];
  // SetupWizard разблокирован только после реального подтверждения оплаты
  // (webhook payment.succeeded заполнил provider_payment_id). Иначе показываем
  // экран ожидания — без этой проверки checkout без оплаты пускал бы юзера
  // в Setup и автозапускал контейнер.
  const isPaidPendingSetup =
    row.status === "pending_setup" && row.providerPaymentId != null;
  const isAwaitingPayment =
    row.status === "pending_setup" && row.providerPaymentId == null;
  const categoryLabel = CATEGORY_LABELS[row.agentCategory || ""] || row.agentCategory || "—";
  const statusLabel = isAwaitingPayment
    ? "Ожидание оплаты"
    : STATUS_LABELS[row.status] || row.status;

  return (
    <section className="mx-auto max-w-3xl px-5 sm:px-6">
      <div className="py-10 sm:py-14">
        <Link
          href="/dashboard"
          className="group inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          Дашборд
        </Link>

        <div className="mt-8 mb-10">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground">
            <span>{categoryLabel}</span>
            <span className="text-border">/</span>
            <span className="inline-flex items-center gap-2 text-foreground">
              <span className="relative inline-flex h-1.5 w-1.5">
                {row.status === "active" && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-foreground/70" />
                )}
                <span
                  className={`relative inline-flex h-1.5 w-1.5 rounded-full ${
                    row.status === "active"
                      ? "bg-foreground"
                      : "bg-muted-foreground/60"
                  }`}
                />
              </span>
              {statusLabel}
            </span>
            <span className="text-border">·</span>
            <span className="text-muted-foreground/70">
              ID {row.id.slice(0, 8)}
            </span>
          </div>

          <h1 className="mt-4 text-[1.75rem] font-bold leading-[1.05] tracking-[-0.025em] sm:text-[2.25rem]">
            {row.agentName}
          </h1>
          {row.agentDescription && (
            <p className="mt-3 max-w-[64ch] text-[14px] leading-relaxed text-muted-foreground">
              {row.agentDescription}
            </p>
          )}
        </div>

        {isAwaitingPayment ? (
          <div className="rounded-[2px] border border-[rgba(244,236,222,0.08)] bg-[#161412] p-6">
            <div className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground">
              Статус
            </div>
            <p className="mt-2 text-[14px] leading-relaxed">
              Ожидаем подтверждения оплаты от YooKassa. После подтверждения
              откроется мастер настройки агента.
            </p>
            <p className="mt-3 text-[12.5px] leading-relaxed text-muted-foreground">
              Если страница оплаты была закрыта без завершения — оформите
              подписку заново в каталоге.
            </p>
          </div>
        ) : isPaidPendingSetup ? (
          <SetupWizard
            subscriptionId={row.id}
            schema={setupSchema}
            agentSlug={row.agentSlug}
          />
        ) : (
          <ManageView
            subscriptionId={row.id}
            status={row.status}
            purchaseType={row.purchaseType}
            hasSavedCard={row.providerSubscriptionId != null}
          />
        )}
      </div>
    </section>
  );
}
