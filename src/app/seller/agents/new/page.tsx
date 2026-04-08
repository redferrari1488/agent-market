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
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Новый агент</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Заполните информацию и создайте черновик. После модерации агент появится в каталоге.
        </p>
      </div>

      <AgentForm />
    </div>
  );
}
