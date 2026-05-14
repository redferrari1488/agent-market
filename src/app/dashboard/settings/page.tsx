import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { account, profiles } from "@/lib/db/schema";
import { getUser } from "@/lib/auth-server";
import { isSyntheticTelegramEmail } from "@/lib/account-deletion";
import { SettingsToggleRow } from "./toggle-row";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Настройки аккаунта — hireon",
  description: "Управление профилем.",
};

const displayFont =
  "var(--font-manrope), 'Manrope', system-ui, sans-serif";

const providerLabel: Record<string, string> = {
  credential: "Email и пароль",
  google: "Google",
  github: "GitHub",
};

const SIDE_NAV = [
  { id: "profile", label: "Профиль", active: true },
  { id: "security", label: "Безопасность" },
  { id: "notifications", label: "Уведомления" },
  { id: "billing", label: "Биллинг", muted: true },
  { id: "api", label: "API · токены", muted: true },
  { id: "danger", label: "Удаление аккаунта", muted: true },
];

const SECURITY_CELLS = [
  { lbl: "Активных сессий", v: "3", meta: "macOS · iOS · Linux" },
  { lbl: "Двухфакторка", v: "Off", meta: "рекомендуем включить" },
  {
    lbl: "Последний вход",
    v: "сегодня · 09:42",
    meta: "Москва · 188.123.x.x",
    mono: true,
  },
];

const NOTIFICATIONS = [
  { id: "payouts", label: "Выплаты", channel: "Email + Telegram", on: true },
  { id: "reviews", label: "Новые отзывы", channel: "Email", on: true },
  {
    id: "moderation",
    label: "Модерация агента",
    channel: "Email + Telegram",
    on: true,
  },
  {
    id: "marketing",
    label: "Маркетинговые рассылки",
    channel: "Раз в две недели",
    on: false,
  },
];

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
    <div className="mx-auto grid max-w-[1080px] grid-cols-1 gap-10 px-5 pt-14 pb-24 sm:px-8 lg:grid-cols-[220px_1fr] lg:gap-14">
      <aside className="lg:sticky lg:top-22 lg:self-start">
        <Link
          href="/dashboard"
          className="group mb-6 inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.1em] text-[rgba(241,235,224,0.36)] transition-colors hover:text-[rgba(241,235,224,0.78)]"
        >
          <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-0.5" />
          Дашборд
        </Link>
        <nav className="hidden flex-col border-l border-[rgba(244,236,222,0.06)] lg:flex">
          <div className="px-4 pt-3.5 pb-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-[rgba(241,235,224,0.20)]">
            Настройки
          </div>
          {SIDE_NAV.map((it) => (
            <a
              key={it.id}
              href={`#${it.id}`}
              aria-current={it.active ? "page" : undefined}
              className={`-ml-px block border-l px-4 py-2.5 text-[13.5px] transition-[color,border-color,background] ${
                it.active
                  ? "border-l-[oklch(0.74_0.13_195)] bg-[rgba(244,236,222,0.02)] text-[var(--hc-fg,#f1ebe0)]"
                  : "border-l-transparent text-[rgba(241,235,224,0.56)] hover:text-[var(--hc-fg,#f1ebe0)]"
              } ${it.muted ? "opacity-65" : ""}`}
            >
              {it.label}
            </a>
          ))}
        </nav>
      </aside>

      <section className="min-w-0">
        <header>
          <p className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[rgba(241,235,224,0.36)]">
            Настройки · Аккаунт
          </p>
          <h1
            className="mt-3.5 text-[clamp(32px,3.6vw,44px)] font-semibold leading-[1.05] tracking-[-0.028em] text-[var(--hc-fg,#f1ebe0)]"
            style={{ fontFamily: displayFont }}
          >
            Профиль и доступ
          </h1>
          <p className="mt-3 text-[15px] leading-[1.55] text-[rgba(241,235,224,0.78)]">
            Управление учётной записью, входом и уведомлениями.
          </p>
        </header>

        {/* PROFILE */}
        <Panel id="profile" title="Профиль" path="/dashboard/settings">
          <dl className="overflow-hidden rounded-[10px] border border-[rgba(244,236,222,0.06)] bg-[#1a1815] text-[14px]">
            {profileRows.map((row, i) => (
              <DlRow
                key={row.label}
                label={row.label}
                value={row.value ?? "—"}
                mono={row.mono}
                last={i === profileRows.length - 1}
              />
            ))}
          </dl>
          <PanelNote>Данные шифруются на стороне сервера</PanelNote>
        </Panel>

        {/* SECURITY */}
        <Panel id="security" title="Безопасность" path="сессии · 2FA">
          <div className="grid grid-cols-1 overflow-hidden rounded-[10px] border border-[rgba(244,236,222,0.06)] bg-[#1a1815] sm:grid-cols-3">
            {SECURITY_CELLS.map((c, i) => (
              <div
                key={c.lbl}
                className={`p-5 ${
                  i < SECURITY_CELLS.length - 1
                    ? "border-b border-[rgba(244,236,222,0.06)] sm:border-b-0 sm:border-r"
                    : ""
                }`}
              >
                <div className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-[rgba(241,235,224,0.36)]">
                  {c.lbl}
                </div>
                <div
                  className={`mt-1.5 font-semibold leading-none tracking-[-0.018em] text-[var(--hc-fg,#f1ebe0)] ${
                    c.mono
                      ? "font-mono text-[14px] tracking-normal"
                      : "text-[22px]"
                  }`}
                  style={c.mono ? undefined : { fontFamily: displayFont }}
                >
                  {c.v}
                </div>
                <div className="mt-1 font-mono text-[10.5px] text-[rgba(241,235,224,0.36)]">
                  {c.meta}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <DemoBtn>Включить 2FA</DemoBtn>
            <DemoBtn>Закрыть все сессии</DemoBtn>
          </div>
        </Panel>

        {/* NOTIFICATIONS */}
        <Panel id="notifications" title="Уведомления" path="email · telegram">
          <dl className="overflow-hidden rounded-[10px] border border-[rgba(244,236,222,0.06)] bg-[#1a1815] text-[14px]">
            {NOTIFICATIONS.map((n, i) => (
              <SettingsToggleRow
                key={n.id}
                label={n.label}
                channel={n.channel}
                defaultOn={n.on}
                last={i === NOTIFICATIONS.length - 1}
              />
            ))}
          </dl>
        </Panel>

        {/* DANGER */}
        <div
          id="danger"
          className="mt-10 flex flex-col items-stretch justify-between gap-5 rounded-[10px] border border-[rgba(244,236,222,0.06)] bg-[#1a1815] p-6 sm:flex-row sm:items-center sm:gap-6"
        >
          <div>
            <h3 className="m-0 text-[14px] font-semibold text-[var(--hc-fg,#f1ebe0)]">
              Удалить аккаунт
            </h3>
            <p className="mt-1 max-w-[50ch] text-[13px] text-[rgba(241,235,224,0.56)]">
              Безвозвратно. Все ваши агенты, подписки и история выплат будут
              удалены. Действие нельзя отменить.
            </p>
          </div>
          <DemoBtn
            className="border-[oklch(0.72_0.16_25_/_0.35)] text-[oklch(0.78_0.16_25)] hover:border-[oklch(0.72_0.16_25_/_0.7)] hover:bg-[oklch(0.72_0.16_25_/_0.08)]"
          >
            Удалить аккаунт
          </DemoBtn>
        </div>
      </section>
    </div>
  );
}

function Panel({
  id,
  title,
  path,
  children,
}: {
  id: string;
  title: string;
  path: string;
  children: React.ReactNode;
}) {
  return (
    <div id={id} className="mt-10 scroll-mt-22">
      <div className="mb-3.5 flex items-center justify-between gap-3">
        <h2 className="m-0 font-mono text-[10.5px] font-medium uppercase tracking-[0.12em] text-[rgba(241,235,224,0.56)]">
          {title}
        </h2>
        <span className="font-mono text-[10px] tracking-[0.08em] text-[rgba(241,235,224,0.36)]">
          {path}
        </span>
      </div>
      {children}
    </div>
  );
}

function DlRow({
  label,
  value,
  mono,
  last,
}: {
  label: string;
  value: string;
  mono?: boolean;
  last?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-1.5 px-5 py-4 sm:grid sm:grid-cols-[160px_1fr] sm:items-center sm:gap-4 ${
        last ? "" : "border-b border-[rgba(244,236,222,0.06)]"
      }`}
    >
      <dt className="font-mono text-[10.5px] font-medium uppercase tracking-[0.1em] text-[rgba(241,235,224,0.36)]">
        {label}
      </dt>
      <dd
        className={`m-0 break-all text-[var(--hc-fg,#f1ebe0)] ${
          mono ? "font-mono text-[13px]" : ""
        }`}
      >
        {value || "—"}
      </dd>
    </div>
  );
}

function PanelNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 inline-flex items-center gap-2 font-mono text-[10.5px] tracking-[0.04em] text-[rgba(241,235,224,0.36)]">
      <span className="inline-block h-1 w-1 rounded-full bg-[rgba(241,235,224,0.20)]" />
      {children}
    </div>
  );
}

function DemoBtn({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      disabled
      title="UI-демо · функционал скоро"
      className={`inline-flex h-10 cursor-not-allowed items-center gap-2 rounded-md border border-[rgba(244,236,222,0.10)] bg-transparent px-4 text-[13.5px] font-medium text-[var(--hc-fg,#f1ebe0)] transition-[border-color,background] hover:border-[rgba(244,236,222,0.16)] hover:bg-[rgba(244,236,222,0.04)] ${className}`}
    >
      {children}
    </button>
  );
}
