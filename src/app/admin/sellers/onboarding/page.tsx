import Link from "next/link";
import { redirect } from "next/navigation";
import { and, desc, eq, isNull } from "drizzle-orm";
import { ChevronRight, FileSearch } from "lucide-react";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { getUser } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

const entityTypeLabels: Record<string, string> = {
  ip: "ИП",
  ooo: "ООО",
  self_employed: "Самозанятый",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function formatInnPreview(inn: unknown) {
  if (typeof inn !== "string" || inn.length === 0) {
    return "ИНН не указан";
  }

  return inn.length > 6 ? `${inn.slice(0, 6)}...` : inn;
}

function formatRelativeTime(date: Date) {
  const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat("ru", { numeric: "auto" });
  const absSeconds = Math.abs(diffSeconds);

  if (absSeconds < 60) {
    return formatter.format(diffSeconds, "second");
  }

  const diffMinutes = Math.round(diffSeconds / 60);
  if (Math.abs(diffMinutes) < 60) {
    return formatter.format(diffMinutes, "minute");
  }

  const diffHours = Math.round(diffSeconds / 3600);
  if (Math.abs(diffHours) < 24) {
    return formatter.format(diffHours, "hour");
  }

  return formatter.format(Math.round(diffSeconds / 86400), "day");
}

export default async function AdminSellerOnboardingPage() {
  const user = await getUser();
  if (!user) redirect("/auth/login?next=/admin/sellers/onboarding");

  const [profile] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (!profile || profile.role !== "admin") {
    redirect("/");
  }

  const rows = await db
    .select({
      id: profiles.id,
      email: profiles.email,
      name: profiles.name,
      onboardingData: profiles.onboardingData,
      updatedAt: profiles.updatedAt,
    })
    .from(profiles)
    .where(and(
      eq(profiles.onboardingStatus, "pending_review"),
      isNull(profiles.deletedAt),
    ))
    .orderBy(desc(profiles.updatedAt));

  return (
    <section className="mx-auto max-w-6xl px-5 sm:px-6">
      <div className="py-10 sm:py-14">
        <div className="mb-8">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Админ
          </p>
          <h1 className="mt-2 text-[2rem] font-bold tracking-[-0.03em] sm:text-[2.5rem]">
            Онбординг продавцов
          </h1>
          <p className="mt-2 text-[15px] text-muted-foreground">
            Заявки на подключение к выплатам, ожидающие ручной проверки
          </p>
        </div>

        {rows.length === 0 ? (
          <div className="rounded-lg border border-border/40 p-12 text-center sm:p-14">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-border/40 text-muted-foreground">
              <FileSearch className="h-5 w-5" />
            </div>
            <h2 className="mt-5 text-[15px] font-semibold">Нет заявок на рассмотрение</h2>
            <p className="mt-1.5 text-[13px] text-muted-foreground">
              Когда продавец отправит реквизиты на ручную проверку, заявка появится здесь.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => {
              const onboardingData = isRecord(row.onboardingData) ? row.onboardingData : {};
              const entityType =
                typeof onboardingData.entityType === "string"
                  ? entityTypeLabels[onboardingData.entityType] ?? onboardingData.entityType
                  : "Тип не указан";

              return (
                <Link
                  key={row.id}
                  href={`/admin/sellers/onboarding/${row.id}`}
                  className="group flex items-start justify-between gap-4 rounded-lg border border-border/40 p-5 transition-colors hover:border-border"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="truncate text-[15px] font-semibold">
                          {row.name || row.email}
                        </h2>
                        {row.name && (
                          <p className="mt-1 text-[13px] text-muted-foreground">{row.email}</p>
                        )}
                      </div>
                      <span className="rounded-md border border-border/40 px-2 py-0.5 text-[11px] text-muted-foreground">
                        {entityType}
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-3 font-mono text-[11px] text-muted-foreground">
                      <span>ИНН: {formatInnPreview(onboardingData.inn)}</span>
                      <span>{formatRelativeTime(row.updatedAt)}</span>
                    </div>
                  </div>
                  <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
