import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { getUser } from "@/lib/auth-server";
import { OnboardingReviewForm } from "@/components/admin/OnboardingReviewForm";

export const dynamic = "force-dynamic";

const entityTypeLabels: Record<string, string> = {
  ip: "ИП",
  ooo: "ООО",
  self_employed: "Самозанятый",
};

const onboardingFieldLabels: Record<string, string> = {
  entityType: "Тип",
  legalName: "Название",
  inn: "ИНН",
  legalAddress: "Адрес",
  email: "Email",
  phone: "Телефон",
  accountId: "YooKassa account ID (от продавца)",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function formatValue(key: string, value: unknown) {
  if (value == null || value === "") {
    return "—";
  }

  if (key === "entityType" && typeof value === "string") {
    return entityTypeLabels[value] ?? value;
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return JSON.stringify(value);
}

export default async function AdminSellerOnboardingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  const [targetProfile] = await db
    .select({
      id: profiles.id,
      email: profiles.email,
      name: profiles.name,
      onboardingData: profiles.onboardingData,
      onboardingStatus: profiles.onboardingStatus,
      yookassaAccountId: profiles.yookassaAccountId,
      updatedAt: profiles.updatedAt,
    })
    .from(profiles)
    .where(eq(profiles.id, id))
    .limit(1);

  if (!targetProfile || targetProfile.onboardingStatus !== "pending_review") {
    notFound();
  }

  const onboardingData = isRecord(targetProfile.onboardingData)
    ? targetProfile.onboardingData
    : {};
  const fields = Object.entries(onboardingData);
  const initialYookassaAccountId =
    targetProfile.yookassaAccountId ??
    (typeof onboardingData.accountId === "string" ? onboardingData.accountId : "");

  return (
    <section className="mx-auto max-w-4xl px-5 sm:px-6">
      <div className="py-10 sm:py-14">
        <div className="mb-8">
          <Link
            href="/admin/sellers/onboarding"
            className="inline-flex items-center gap-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Админ
          </Link>
          <h1 className="mt-3 text-[2rem] font-bold tracking-[-0.03em] sm:text-[2.5rem]">
            Заявка от {targetProfile.name || targetProfile.email}
          </h1>
          <p className="mt-2 text-[15px] text-muted-foreground">
            {targetProfile.email}
          </p>
        </div>

        <div className="space-y-6">
          <section className="rounded-lg border border-border/40 p-5">
            <h2 className="text-[18px] font-semibold tracking-tight">Данные продавца</h2>
            <dl className="mt-5 divide-y divide-border/40">
              {fields.length === 0 ? (
                <div className="py-4 text-[13px] text-muted-foreground">
                  Данные не были сохранены.
                </div>
              ) : (
                fields.map(([key, value]) => (
                  <div
                    key={key}
                    className="grid gap-1 py-4 sm:grid-cols-[220px_minmax(0,1fr)] sm:gap-4"
                  >
                    <dt className="text-[12px] font-medium text-muted-foreground">
                      {onboardingFieldLabels[key] ?? key}
                    </dt>
                    <dd className="break-words text-[14px] leading-relaxed text-foreground">
                      {formatValue(key, value)}
                    </dd>
                  </div>
                ))
              )}
            </dl>
          </section>

          <section className="rounded-lg border border-border/40 p-5">
            <h2 className="text-[18px] font-semibold tracking-tight">Решение</h2>
            <p className="mt-2 text-[13px] text-muted-foreground">
              Одобрите заявку и при необходимости укажите YooKassa account ID, либо сохраните причину отказа.
            </p>
            <div className="mt-5">
              <OnboardingReviewForm
                profileId={targetProfile.id}
                initialYookassaAccountId={initialYookassaAccountId}
              />
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
