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
    <section className="mx-auto max-w-3xl px-5 sm:px-6">
      <div className="py-10 sm:py-14">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-1 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Мои агенты
        </Link>

        <div className="mb-8">
          <h1 className="text-[2rem] font-bold tracking-[-0.03em]">{row.agentName}</h1>
          <p className="mt-2 text-[15px] text-muted-foreground">{row.agentDescription}</p>
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
