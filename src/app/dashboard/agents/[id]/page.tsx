import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createServerClient } from "@/lib/supabase";
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
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: sub } = await supabase
    .from("subscriptions")
    .select(
      "id, status, purchase_type, container_id, started_at, agents(id, name, slug, description, setup_schema)"
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!sub) notFound();

  const agent = Array.isArray(sub.agents) ? sub.agents[0] : sub.agents;
  if (!agent) notFound();

  const setupSchema = (agent.setup_schema as SetupField[]) || [];
  const needsSetup = sub.status === "pending_setup";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Мои агенты
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">{agent.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{agent.description}</p>
      </div>

      {needsSetup ? (
        <SetupWizard subscriptionId={sub.id} schema={setupSchema} />
      ) : (
        <ManageView
          subscriptionId={sub.id}
          status={sub.status}
          purchaseType={sub.purchase_type}
        />
      )}
    </div>
  );
}
