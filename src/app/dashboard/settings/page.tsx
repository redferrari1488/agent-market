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

const displayFont =
  "var(--font-manrope), 'Manrope', system-ui, sans-serif";

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

  const profileRows: { label: string; value: string | null; mono?: boolean }[] = [
    { label: "Email", value: showEmail ? profileEmail : "—", mono: true },
  ];
  if (profile?.telegramUsername) {
    profileRows.push({
      label: "Telegram",
      value: `@${profile.telegramUsername}`,
      mono: true,
    });
  }
  if (oauthProviders.length > 0) {
    profileRows.push({
      label: "Вход через",
      value: oauthProviders.map((p) => providerLabel[p] ?? p).join(", "),
    });
  }

  return (
    <section className="mx-auto max-w-3xl px-5 sm:px-6">
      <div className="py-10 sm:py-14">
        <Link
          href="/dashboard"
          className="group inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.1em] text-[rgba(241,235,224,0.36)] transition-colors hover:text-[rgba(241,235,224,0.78)]"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          Дашборд
        </Link>

        <header className="mt-8">
          <p className="font-mono text-[10.5px] font-medium uppercase tracking-[0.12em] text-[rgba(241,235,224,0.36)]">
            Настройки · Аккаунт
          </p>
          <h1
            className="mt-3.5 text-[clamp(32px,3.6vw,44px)] font-semibold leading-[1.05] tracking-[-0.028em] text-[var(--hc-fg,#f1ebe0)]"
            style={{ fontFamily: displayFont }}
          >
            Профиль и доступ
          </h1>
          <p className="mt-3 text-[15px] leading-[1.55] text-[rgba(241,235,224,0.78)]">
            Управление учётной записью.
          </p>
        </header>

        <div className="mt-10">
          <div className="mb-3.5 flex items-center justify-between gap-3">
            <h2 className="font-mono text-[10.5px] font-medium uppercase tracking-[0.12em] text-[rgba(241,235,224,0.56)]">
              Профиль
            </h2>
            <span className="font-mono text-[10px] tracking-[0.08em] text-[rgba(241,235,224,0.36)]">
              /dashboard/settings
            </span>
          </div>

          <dl className="overflow-hidden rounded-[10px] border border-[rgba(244,236,222,0.06)] bg-[#1a1815] text-[14px]">
            {profileRows.map((row, i) => (
              <div
                key={row.label}
                className={`flex flex-col gap-1.5 px-5 py-4 sm:grid sm:grid-cols-[160px_1fr] sm:items-center sm:gap-4 ${
                  i < profileRows.length - 1
                    ? "border-b border-[rgba(244,236,222,0.06)]"
                    : ""
                }`}
              >
                <dt className="font-mono text-[10.5px] font-medium uppercase tracking-[0.1em] text-[rgba(241,235,224,0.36)]">
                  {row.label}
                </dt>
                <dd
                  className={`m-0 break-all text-[var(--hc-fg,#f1ebe0)] ${row.mono ? "font-mono text-[13px]" : ""}`}
                >
                  {row.value || "—"}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-3 inline-flex items-center gap-2 font-mono text-[10.5px] tracking-[0.04em] text-[rgba(241,235,224,0.36)]">
            <span className="inline-block h-1 w-1 rounded-full bg-[rgba(241,235,224,0.20)]" />
            данные шифруются на стороне сервера
          </div>
        </div>
      </div>
    </section>
  );
}
