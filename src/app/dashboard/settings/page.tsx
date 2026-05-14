import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { account, profiles } from "@/lib/db/schema";
import { getUser } from "@/lib/auth-server";
import { isSyntheticTelegramEmail } from "@/lib/account-deletion";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Настройки аккаунта - hireon",
  description: "Управление профилем.",
};

const providerLabel: Record<string, string> = {
  credential: "Email и пароль",
  google: "Google",
  github: "GitHub",
};

export default async function DashboardSettingsPage() {
  const user = await getUser();
  if (!user) redirect("/");

  const [profile] = await db
    .select({
      email: profiles.email,
      telegramUsername: profiles.telegramUsername,
    })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  const linkedAccounts = await db
    .select({ providerId: account.providerId })
    .from(account)
    .where(eq(account.userId, user.id));

  const profileEmail = profile?.email ?? user.email ?? null;
  const showEmail =
    !!profileEmail && !isSyntheticTelegramEmail(profileEmail);
  const oauthProviders = linkedAccounts
    .map((row) => row.providerId)
    .filter((providerId) => providerId !== "credential");

  return (
    <section className="mx-auto max-w-3xl px-5 sm:px-6">
      <div className="py-10 sm:py-14">
        <Link
          href="/dashboard"
          className="group inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          Дашборд
        </Link>

        <div className="mt-8">
          <p className="font-mono text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Настройки · Аккаунт
          </p>
          <h1 className="mt-3 text-[1.75rem] font-bold leading-[1.05] tracking-[-0.025em] sm:text-[2.25rem]">
            Профиль и доступ
          </h1>
          <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
            Управление учётной записью.
          </p>
        </div>

        <div className="mt-10">
          <div className="mb-3.5 flex items-center justify-between gap-3">
            <h2 className="font-mono text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Профиль
            </h2>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground/55">
              /dashboard/settings
            </span>
          </div>
          <dl className="grid gap-0 rounded-[2px] border border-white/[0.08] bg-[#111115] text-[13px]">
            <SettingRow label="Email" value={showEmail ? profileEmail : "—"} mono breakAll />
            {profile?.telegramUsername && (
              <SettingRow label="Telegram" value={`@${profile.telegramUsername}`} mono />
            )}
            {oauthProviders.length > 0 && (
              <SettingRow
                label="Вход через"
                value={oauthProviders.map((p) => providerLabel[p] ?? p).join(", ")}
              />
            )}
          </dl>

          <div className="mt-3 flex items-center gap-2 font-mono text-[10.5px] tracking-[0.06em] text-muted-foreground/55">
            <span className="inline-block h-1 w-1 rounded-full bg-muted-foreground/40" />
            данные шифруются на стороне сервера
          </div>
        </div>
      </div>
    </section>
  );
}

function SettingRow({
  label,
  value,
  mono = false,
  breakAll = false,
}: {
  label: string;
  value: string | null;
  mono?: boolean;
  breakAll?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-white/[0.06] px-5 py-4 last:border-b-0 sm:flex-row sm:items-center sm:gap-6">
      <dt className="w-32 shrink-0 font-mono text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </dt>
      <dd
        className={`text-foreground/90 ${mono ? "font-mono text-[12.5px]" : ""} ${breakAll ? "break-all" : ""}`}
      >
        {value || "—"}
      </dd>
    </div>
  );
}
