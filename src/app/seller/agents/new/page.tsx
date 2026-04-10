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
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[400px] overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[350px] w-[700px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-violet-600/10 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Новый{" "}
            <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
              агент
            </span>
          </h1>
          <p className="mt-2 text-muted-foreground">
            Заполните информацию и создайте черновик. После модерации агент появится в каталоге.
          </p>
        </div>

        <AgentForm />
      </div>
    </div>
  );
}
