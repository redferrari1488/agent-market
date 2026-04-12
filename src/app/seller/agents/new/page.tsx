import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getUser } from "@/lib/auth-server";
import { AgentForm } from "@/components/seller/AgentForm";

export const dynamic = "force-dynamic";

export default async function NewAgentPage() {
  const user = await getUser();
  if (!user) redirect("/auth/login?next=/seller/agents/new");

  const [profile] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (!profile || (profile.role !== "seller" && profile.role !== "admin")) {
    redirect("/seller");
  }

  return (
    <section className="mx-auto max-w-3xl px-5 sm:px-6">
      <div className="py-10 sm:py-14">
        <div className="mb-8">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Продавцам
          </p>
          <h1 className="mt-2 text-[2rem] font-bold tracking-[-0.03em] sm:text-[2.5rem]">
            Новый агент
          </h1>
          <p className="mt-2 text-[15px] text-muted-foreground">
            Заполните информацию и создайте черновик. После модерации агент появится в каталоге.
          </p>
        </div>

        <AgentForm />
      </div>
    </section>
  );
}
