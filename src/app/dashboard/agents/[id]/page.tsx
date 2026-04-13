import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MessageSquare,
  PenTool,
  BarChart3,
  ShoppingCart,
  Activity,
} from "lucide-react";
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

const categoryConfig: Record<
  string,
  { label: string; icon: React.ElementType; accent: string; bg: string; ring: string }
> = {
  support: { label: "Поддержка", icon: MessageSquare, accent: "text-blue-400", bg: "bg-blue-500/10", ring: "ring-blue-500/20" },
  content: { label: "Контент", icon: PenTool, accent: "text-violet-400", bg: "bg-violet-500/10", ring: "ring-violet-500/20" },
  analytics: { label: "Аналитика", icon: BarChart3, accent: "text-emerald-400", bg: "bg-emerald-500/10", ring: "ring-emerald-500/20" },
  sales: { label: "Продажи", icon: ShoppingCart, accent: "text-amber-400", bg: "bg-amber-500/10", ring: "ring-amber-500/20" },
  monitoring: { label: "Мониторинг", icon: Activity, accent: "text-cyan-400", bg: "bg-cyan-500/10", ring: "ring-cyan-500/20" },
};

const statusLabels: Record<string, { label: string; color: string; dot: string }> = {
  pending_setup: { label: "Требует настройки", color: "text-amber-400", dot: "bg-amber-400" },
  active: { label: "Работает", color: "text-emerald-400", dot: "bg-emerald-400" },
  paused: { label: "Остановлен", color: "text-muted-foreground", dot: "bg-muted-foreground" },
  cancelled: { label: "Отменён", color: "text-red-400", dot: "bg-red-400" },
  expired: { label: "Истёк", color: "text-red-400", dot: "bg-red-400" },
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
  const needsSetup = row.status === "pending_setup";
  const cat = categoryConfig[row.agentCategory || "support"] || categoryConfig.support;
  const CatIcon = cat.icon;
  const status = statusLabels[row.status] || statusLabels.pending_setup;

  return (
    <section className="mx-auto max-w-3xl px-5 sm:px-6">
      <div className="py-10 sm:py-14">
        <Link
          href="/dashboard"
          className="group inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          Мои агенты
        </Link>

        <div className="mt-8 mb-8 flex items-start gap-4 sm:gap-5">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg sm:h-14 sm:w-14 ${cat.bg} ${cat.accent} ring-1 ${cat.ring}`}
          >
            <CatIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] uppercase tracking-[0.15em]">
              <span className={cat.accent}>{cat.label}</span>
              <span className="text-border">/</span>
              <span className={`flex items-center gap-1.5 ${status.color}`}>
                <span className="relative flex h-1.5 w-1.5">
                  {row.status === "active" && (
                    <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${status.dot} opacity-60`} />
                  )}
                  <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${status.dot}`} />
                </span>
                {status.label}
              </span>
            </div>
            <h1 className="mt-3 text-[1.75rem] font-bold leading-[1.1] tracking-[-0.03em] sm:text-[2.25rem]">
              {row.agentName}
            </h1>
            <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
              {row.agentDescription}
            </p>
          </div>
        </div>

        {needsSetup ? (
          <SetupWizard subscriptionId={row.id} schema={setupSchema} />
        ) : (
          <ManageView
            subscriptionId={row.id}
            status={row.status}
            purchaseType={row.purchaseType}
          />
        )}
      </div>
    </section>
  );
}
