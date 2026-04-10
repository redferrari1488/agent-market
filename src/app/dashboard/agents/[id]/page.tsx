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
      agentSetupSchema: agents.setupSchema,
    })
    .from(subscriptions)
    .leftJoin(agents, eq(subscriptions.agentId, agents.id))
    .where(and(eq(subscriptions.id, id), eq(subscriptions.userId, user.id)))
    .limit(1);

  if (!row || !row.agentName) notFound();

  const setupSchema = (row.agentSetupSchema as SetupField[]) || [];
  const needsSetup = row.status === "pending_setup";

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[400px] overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[300px] w-[600px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-violet-600/10 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-violet-400"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Мои агенты
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">{row.agentName}</h1>
          <p className="mt-2 text-muted-foreground">{row.agentDescription}</p>
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
    </div>
  );
}
