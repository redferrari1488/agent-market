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
    draft: "border-white/[0.08] bg-[#16161b] text-muted-foreground",
    review: "border-amber-300/20 bg-amber-300/[0.04] text-amber-200/90",
    published: "border-white/[0.18] bg-white/[0.04] text-foreground",
    rejected: "border-rose-500/30 bg-rose-500/[0.04] text-rose-300",
  };

  return (
    <section className="mx-auto max-w-3xl px-5 sm:px-6">
      <div className="py-10 sm:py-14">
        <div className="mb-8">
          <p className="font-mono text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Продавцам · Редактирование
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="text-[1.75rem] font-bold leading-[1.05] tracking-[-0.025em] sm:text-[2.25rem]">
              {agent.name}
            </h1>
            <span
              className={`rounded-[2px] border px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.06em] ${
                statusColors[agent.status] || statusColors.draft
              }`}
            >
              {statusLabels[agent.status] || agent.status}
            </span>
          </div>
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
