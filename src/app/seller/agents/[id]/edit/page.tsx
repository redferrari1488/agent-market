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
    draft: "border-border/40 text-muted-foreground",
    review: "border-amber-500/30 bg-amber-500/5 text-amber-400",
    published: "border-emerald-500/30 bg-emerald-500/5 text-emerald-400",
    rejected: "border-red-500/30 bg-red-500/5 text-red-400",
  };

  return (
    <section className="mx-auto max-w-3xl px-5 sm:px-6">
      <div className="py-10 sm:py-14">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <h1 className="text-[2rem] font-bold tracking-[-0.03em]">Редактирование</h1>
            <span
              className={`rounded-md border px-2.5 py-1 text-[11px] font-medium ${
                statusColors[agent.status] || statusColors.draft
              }`}
            >
              {statusLabels[agent.status] || agent.status}
            </span>
          </div>
          <p className="mt-2 text-[15px] text-muted-foreground">{agent.name}</p>
        </div>

        <AgentForm
          initial={{
            id: agent.id,
            name: agent.name,
            slug: agent.slug,
            description: agent.description || "",
            longDescription: agent.longDescription || "",
            category: agent.category || "support",
            priceMonthly: agent.priceMonthly,
            dockerImage: agent.dockerImage || "",
            features: (agent.features as string[]) || [],
            keywords: agent.keywords ?? [],
            setupSchema: (agent.setupSchema as SetupField[]) || [],
            envTemplate: (agent.envTemplate as Record<string, string>) || {},
            status: agent.status,
          }}
        />
      </div>
    </section>
  );
}
