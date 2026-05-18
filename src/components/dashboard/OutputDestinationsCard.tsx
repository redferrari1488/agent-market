"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  CircleDot,
  Hash,
  Mail,
  MessageSquare,
  Send,
  Webhook,
  XCircle,
} from "lucide-react";

/**
 * OutputDestinationsCard — универсальный компонент дашборда подписки.
 *
 * Показывает «куда поступают результаты работы агента» независимо от
 * конкретного провайдера (Telegram сейчас, в будущем Slack / Discord /
 * email / webhook).
 *
 * Принципы:
 *  - Data-driven. Компонент не знает, что такое Telegram — принимает
 *    массив абстрактных `OutputTarget` и рисует их единообразно.
 *  - Provider-agnostic иконки (paper-plane, circle-dot, hash, …) —
 *    единый визуальный стиль, без бренд-логотипов.
 *  - Если targets пустой → НЕ рендерится вообще.
 *  - loading: true → skeleton той же формы.
 */

export type OutputTarget = {
  id: string;
  kind: "primary" | "secondary";
  provider:
    | "telegram"
    | "slack"
    | "discord"
    | "email"
    | "webhook"
    | "generic";
  title: string;
  subtitle?: string;
  url?: string;
  rawId: string;
  status: "ok" | "warning" | "error";
  statusMessage?: string;
};

type Props = {
  targets: OutputTarget[];
  loading?: boolean;
  /** Заголовок секции. Можно скрыть, передав null. */
  heading?: string | null;
  className?: string;
};

const PROVIDER_ICON: Record<OutputTarget["provider"], typeof Send> = {
  telegram: Send,
  slack: Hash,
  discord: MessageSquare,
  email: Mail,
  webhook: Webhook,
  generic: CircleDot,
};

const PROVIDER_LABEL: Record<OutputTarget["provider"], string> = {
  telegram: "telegram",
  slack: "slack",
  discord: "discord",
  email: "email",
  webhook: "webhook",
  generic: "канал",
};

const STATUS_LABEL: Record<OutputTarget["status"], string> = {
  ok: "доступен",
  warning: "внимание",
  error: "нет доступа",
};

export function OutputDestinationsCard({
  targets,
  loading = false,
  heading = "Куда поступают результаты",
  className,
}: Props) {
  if (loading) {
    return (
      <Section heading={heading} className={className}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </Section>
    );
  }

  // Контракт: пустой массив → ничего не рендерим.
  if (!targets || targets.length === 0) return null;

  // Primary всегда раньше secondary, иначе в исходном порядке.
  const sorted = [...targets].sort((a, b) => {
    if (a.kind === b.kind) return 0;
    return a.kind === "primary" ? -1 : 1;
  });

  return (
    <Section heading={heading} className={className}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((t) => (
          <TargetCard key={t.id} target={t} />
        ))}
      </div>
    </Section>
  );
}

// ── Section wrapper ─────────────────────────────────────────────────────

function Section({
  heading,
  children,
  className,
}: {
  heading: string | null;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      {heading != null && (
        <h3 className="mb-3 font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
          {heading}
        </h3>
      )}
      {children}
    </section>
  );
}

// ── Single target card ──────────────────────────────────────────────────

function TargetCard({ target: t }: { target: OutputTarget }) {
  const Icon = PROVIDER_ICON[t.provider];
  const titleNode = t.url ? (
    <Link
      href={t.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex max-w-full items-center gap-1.5 underline decoration-foreground/20 underline-offset-[3px] transition-colors hover:decoration-foreground/60 hover:text-foreground"
    >
      <span className="truncate">{t.title}</span>
      <ArrowUpRight className="h-3 w-3 shrink-0 text-muted-foreground/70 transition-colors group-hover:text-foreground" />
    </Link>
  ) : (
    <span className="truncate">{t.title}</span>
  );

  return (
    <article
      className="relative flex flex-col gap-3 rounded-[2px] border bg-[#161412] p-5"
      style={{ borderColor: "rgba(244,236,222,0.08)" }}
    >
      {/* Top row — provider icon + label + status */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground">
          <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.6} />
          <span className="truncate">{PROVIDER_LABEL[t.provider]}</span>
          {t.kind === "secondary" && (
            <>
              <span className="text-muted-foreground/40">·</span>
              <span className="truncate text-muted-foreground/70">служебный</span>
            </>
          )}
        </div>
        <StatusBadge status={t.status} />
      </div>

      {/* Title + subtitle */}
      <div className="flex flex-col gap-1">
        <div className="text-[13.5px] font-medium leading-[1.35] text-foreground">
          {titleNode}
        </div>
        {t.subtitle && (
          <div className="text-[12px] leading-[1.45] text-muted-foreground">
            {t.subtitle}
          </div>
        )}
      </div>

      {/* Tech footer — raw id */}
      <div className="mt-auto pt-1">
        <div className="font-mono text-[10px] tracking-[0.04em] text-muted-foreground/55">
          <span className="text-muted-foreground/40">id&nbsp;·&nbsp;</span>
          <span className="break-all">{t.rawId}</span>
        </div>
      </div>

      {/* Status banner — only when warning/error */}
      {(t.status === "warning" || t.status === "error") && t.statusMessage && (
        <StatusBanner status={t.status} message={t.statusMessage} />
      )}
    </article>
  );
}

// ── Status dot/badge in card header ────────────────────────────────────

function StatusBadge({ status }: { status: OutputTarget["status"] }) {
  if (status === "ok") {
    return (
      <span
        className="relative inline-flex shrink-0 items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-emerald-300/85"
        title={STATUS_LABEL.ok}
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
        <span className="hidden sm:inline">{STATUS_LABEL.ok}</span>
      </span>
    );
  }
  if (status === "warning") {
    return (
      <span
        className="inline-flex shrink-0 items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-amber-200/90"
        title={STATUS_LABEL.warning}
      >
        <AlertTriangle className="h-3 w-3" strokeWidth={2} />
        <span className="hidden sm:inline">{STATUS_LABEL.warning}</span>
      </span>
    );
  }
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-rose-300"
      title={STATUS_LABEL.error}
    >
      <XCircle className="h-3 w-3" strokeWidth={2} />
      <span className="hidden sm:inline">{STATUS_LABEL.error}</span>
    </span>
  );
}

// ── Status banner ──────────────────────────────────────────────────────

function StatusBanner({
  status,
  message,
}: {
  status: "warning" | "error";
  message: string;
}) {
  const isWarning = status === "warning";
  return (
    <div
      className="rounded-[2px] border px-2.5 py-1.5 font-mono text-[10.5px] leading-[1.45] tracking-[0.02em]"
      style={
        isWarning
          ? {
              borderColor: "rgba(252, 211, 77, 0.20)",
              background: "rgba(252, 211, 77, 0.04)",
              color: "rgba(254, 240, 138, 0.90)",
            }
          : {
              borderColor: "rgba(244, 63, 94, 0.30)",
              background: "rgba(244, 63, 94, 0.05)",
              color: "rgba(253, 164, 175, 1)",
            }
      }
    >
      {message}
    </div>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div
      className="flex flex-col gap-3 rounded-[2px] border bg-[#161412] p-5"
      style={{ borderColor: "rgba(244,236,222,0.08)" }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="h-3.5 w-3.5 animate-pulse rounded-[2px] bg-foreground/[0.06]" />
          <div className="h-2.5 w-16 animate-pulse rounded-[2px] bg-foreground/[0.06]" />
        </div>
        <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-foreground/[0.06]" />
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="h-3.5 w-3/4 animate-pulse rounded-[2px] bg-foreground/[0.08]" />
        <div className="h-2.5 w-1/2 animate-pulse rounded-[2px] bg-foreground/[0.05]" />
      </div>
      <div className="mt-auto h-2 w-2/3 animate-pulse rounded-[2px] bg-foreground/[0.04]" />
    </div>
  );
}
