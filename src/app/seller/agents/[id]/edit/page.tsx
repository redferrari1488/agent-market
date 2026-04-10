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

  const statusColors: Record<string, string> = {
    draft: "border-border/50 bg-white/5 text-muted-foreground",
    review: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    published: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    rejected: "border-red-500/30 bg-red-500/10 text-red-300",
  };

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[400px] overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[350px] w-[700px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-violet-600/10 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Редактирование</h1>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-medium backdrop-blur-sm ${
                statusColors[agent.status] || statusColors.draft
              }`}
            >
              {statusLabels[agent.status] || agent.status}
            </span>
          </div>
          <p className="mt-2 text-muted-foreground">{agent.name}</p>
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
    </div>
  );
}
