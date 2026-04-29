import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { profiles, sellerApplications } from "@/lib/db/schema";
import { getUser } from "@/lib/auth-server";
import { CheckCircle2, XCircle, Mail, Send, Link as LinkIcon, User as UserIcon } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Заявки продавцов - hireon",
};

const statusLabels: Record<string, string> = {
  pending: "Ожидает",
  approved: "Одобрена",
  rejected: "Отклонена",
};

const statusColors: Record<string, string> = {
  pending: "text-amber-400 border-amber-500/30 bg-amber-500/[0.04]",
  approved: "text-emerald-400 border-emerald-500/30 bg-emerald-500/[0.04]",
  rejected: "text-red-400 border-red-500/30 bg-red-500/[0.04]",
};

async function decide(formData: FormData) {
  "use server";

  const user = await getUser();
  if (!user) redirect("/auth/login?next=/admin/applications");

  const [adminProfile] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);
  if (!adminProfile || adminProfile.role !== "admin") redirect("/");

  const id = String(formData.get("id") || "");
  const action = String(formData.get("action") || "");
  if (!id || (action !== "approve" && action !== "reject")) return;

  const [application] = await db
    .select({
      id: sellerApplications.id,
      userId: sellerApplications.userId,
      status: sellerApplications.status,
    })
    .from(sellerApplications)
    .where(eq(sellerApplications.id, id))
    .limit(1);
  if (!application || application.status !== "pending") return;

  const newStatus = action === "approve" ? "approved" : "rejected";
  const now = new Date();

  await db
    .update(sellerApplications)
    .set({
      status: newStatus,
      decidedAt: now,
      decidedBy: user.id,
      updatedAt: now,
    })
    .where(eq(sellerApplications.id, id));

  if (action === "approve" && application.userId) {
    await db
      .update(profiles)
      .set({ role: "seller", updatedAt: now })
      .where(eq(profiles.id, application.userId));
  }

  revalidatePath("/admin/applications");
}

export default async function ApplicationsPage() {
  const user = await getUser();
  if (!user) redirect("/auth/login?next=/admin/applications");

  const [profile] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);
  if (!profile || profile.role !== "admin") redirect("/");

  const pending = await db
    .select()
    .from(sellerApplications)
    .where(eq(sellerApplications.status, "pending"))
    .orderBy(desc(sellerApplications.createdAt));

  const decided = await db
    .select()
    .from(sellerApplications)
    .where(and(eq(sellerApplications.status, "approved")))
    .orderBy(desc(sellerApplications.decidedAt))
    .limit(20);

  const rejected = await db
    .select()
    .from(sellerApplications)
    .where(eq(sellerApplications.status, "rejected"))
    .orderBy(desc(sellerApplications.decidedAt))
    .limit(20);

  return (
    <section className="mx-auto max-w-5xl px-5 sm:px-6">
      <div className="py-10 sm:py-14">
        <div className="mb-8">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Администрирование
          </p>
          <h1 className="mt-2 text-[2rem] font-bold tracking-[-0.03em] sm:text-[2.5rem]">
            Заявки продавцов
          </h1>
          <p className="mt-2 text-[14px] text-muted-foreground">
            {pending.length === 0
              ? "Новых заявок нет."
              : `${pending.length} ожидает рассмотрения.`}
          </p>
        </div>

        {pending.length > 0 && (
          <div className="mb-12">
            <h2 className="mb-4 text-[15px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              Ожидают
            </h2>
            <div className="space-y-4">
              {pending.map((app) => (
                <ApplicationCard key={app.id} app={app} actionable />
              ))}
            </div>
          </div>
        )}

        {decided.length > 0 && (
          <div className="mb-12">
            <h2 className="mb-4 text-[15px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              Одобренные ({decided.length})
            </h2>
            <div className="space-y-3">
              {decided.map((app) => (
                <ApplicationCard key={app.id} app={app} compact />
              ))}
            </div>
          </div>
        )}

        {rejected.length > 0 && (
          <div className="mb-12">
            <h2 className="mb-4 text-[15px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              Отклонённые ({rejected.length})
            </h2>
            <div className="space-y-3">
              {rejected.map((app) => (
                <ApplicationCard key={app.id} app={app} compact />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

type Application = typeof sellerApplications.$inferSelect;

function ApplicationCard({
  app,
  actionable = false,
  compact = false,
}: {
  app: Application;
  actionable?: boolean;
  compact?: boolean;
}) {
  const created = new Date(app.createdAt).toLocaleString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="rounded-xl border border-border/40 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[15px] font-semibold">
            <UserIcon className="h-4 w-4 text-muted-foreground" />
            {app.name}
          </div>
          <div className="mt-1 text-[12px] text-muted-foreground">
            {created}
            {app.userId ? " · аккаунт привязан" : " · анонимная заявка"}
          </div>
        </div>
        <span
          className={`rounded-md border px-2 py-0.5 text-[11px] font-medium ${
            statusColors[app.status] || ""
          }`}
        >
          {statusLabels[app.status] || app.status}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[13px] text-muted-foreground">
        <a
          href={`mailto:${app.contactEmail}`}
          className="inline-flex items-center gap-1.5 hover:text-foreground"
        >
          <Mail className="h-3.5 w-3.5" />
          {app.contactEmail}
        </a>
        {app.contactTelegram && (
          <a
            href={`https://t.me/${app.contactTelegram.replace(/^@/, "")}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-foreground"
          >
            <Send className="h-3.5 w-3.5" />
            {app.contactTelegram}
          </a>
        )}
        {app.existingUrl && (
          <a
            href={app.existingUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 truncate hover:text-foreground"
          >
            <LinkIcon className="h-3.5 w-3.5" />
            <span className="truncate">{app.existingUrl}</span>
          </a>
        )}
      </div>

      {!compact && (
        <p className="mt-4 whitespace-pre-wrap rounded-lg border border-border/30 bg-muted/20 p-3.5 text-[13.5px] leading-relaxed text-foreground/90">
          {app.agentDescription}
        </p>
      )}

      {actionable && (
        <div className="mt-4 flex gap-2.5">
          <form action={decide}>
            <input type="hidden" name="id" value={app.id} />
            <input type="hidden" name="action" value="approve" />
            <button
              type="submit"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-500/10 px-4 text-[13px] font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Одобрить
            </button>
          </form>
          <form action={decide}>
            <input type="hidden" name="id" value={app.id} />
            <input type="hidden" name="action" value="reject" />
            <button
              type="submit"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-red-500/10 px-4 text-[13px] font-medium text-red-400 transition-colors hover:bg-red-500/20"
            >
              <XCircle className="h-3.5 w-3.5" />
              Отклонить
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
