import { notifyAdmin } from "./admin-notify";
import { logger } from "./logger";

// Critical-event alerter. Используется на 500-х в API, на amount/currency
// tampering в webhook'ах, на permanent-fail в recurring cron. Идёт через тот же
// канал что notifyAdmin (TELEGRAM_BOT_TOKEN + TELEGRAM_ADMIN_CHAT_ID), но с
// префиксом [ALERT] и in-process rate-limit, чтобы спайк ошибок не зафлудил
// чат — один и тот же ключ шлётся не чаще раза в 5 минут, остальные глотаются
// с увеличением счётчика, который улетает с первым allowed alert.

const WINDOW_MS = 5 * 60 * 1000;

type WindowState = { firstAt: number; suppressed: number };
const windows = new Map<string, WindowState>();

export type AlertSeverity = "warn" | "critical";

export type AlertInput = {
  key: string;
  severity?: AlertSeverity;
  title: string;
  details?: Record<string, unknown>;
};

export function alert({ key, severity = "warn", title, details }: AlertInput): void {
  const now = Date.now();
  const existing = windows.get(key);

  if (existing && now - existing.firstAt < WINDOW_MS) {
    existing.suppressed += 1;
    return;
  }

  const suppressed = existing?.suppressed ?? 0;
  windows.set(key, { firstAt: now, suppressed: 0 });

  const tag = severity === "critical" ? "[ALERT/CRIT]" : "[ALERT]";
  const subject = `${tag} ${title}`;
  const body = formatBody({ key, severity, details, suppressed });

  notifyAdmin({ subject, text: body }).catch((err) => {
    logger.warn({ err, key }, "alerter dispatch failed");
  });
}

function formatBody(args: {
  key: string;
  severity: AlertSeverity;
  details?: Record<string, unknown>;
  suppressed: number;
}): string {
  const lines = [
    `key: ${args.key}`,
    `severity: ${args.severity}`,
    `host: ${process.env.NEXT_PUBLIC_APP_URL ?? "unknown"}`,
    `time: ${new Date().toISOString()}`,
  ];

  if (args.suppressed > 0) {
    lines.push(`suppressed_since_last: ${args.suppressed}`);
  }

  if (args.details && Object.keys(args.details).length > 0) {
    lines.push("");
    lines.push("details:");
    for (const [k, v] of Object.entries(args.details)) {
      lines.push(`  ${k}: ${formatValue(v)}`);
    }
  }

  return lines.join("\n");
}

function formatValue(v: unknown): string {
  if (v == null) return String(v);
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (v instanceof Error) return `${v.name}: ${v.message}`;
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}
