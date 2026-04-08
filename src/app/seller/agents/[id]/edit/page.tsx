import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { agents, profiles } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getUser } from "@/lib/auth-server";
import { AgentForm } from "@/components/seller/AgentForm";
import type { SetupField } from "@/components/seller/SetupSchemaBuilder";

export const dynamic = "force-dynamic";

export default async function EditAgentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUser();
  if (!user) redirect("/auth/login?next=/seller/agents/${id}/edit");

  const [profile] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (!profile || (profile.role !== "seller" && profile.role !== "admin")) {
    redirect("/seller");
  }

  const [agent] = await db
    .select()
    .from(agents)
    .where(and(eq(agents.id, id), eq(agents.sellerId, user.id)))
    .limit(1);

  if (!agent) notFound();

  const statusLabels: Record<string, string> = {
    draft: "Черновик",
    review: "На модерации",
    published: "Опубликован",
    rejected: "Отклонён",
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Редактирование</h1>
          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium">
            {statusLabels[agent.status] || agent.status}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{agent.name}</p>
      </div>

      <AgentForm
        initial={{
          id: agent.id,
          name: agent.name,
          slug: agent.slug,
          description: agent.description || "",
          longDescription: agent.longDescription || "",
          category: agent.category || "support",
          pricingModel: agent.pricingModel,
          priceMonthly: agent.priceMonthly,
          priceOnetime: agent.priceOnetime,
          dockerImage: agent.dockerImage || "",
          features: (agent.features as string[]) || [],
          setupSchema: (agent.setupSchema as SetupField[]) || [],
          envTemplate: (agent.envTemplate as Record<string, string>) || {},
          status: agent.status,
        }}
      />
    </div>
  );
}
