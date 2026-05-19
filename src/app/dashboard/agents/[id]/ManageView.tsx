"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Loader2,
  RotateCw,
  Settings,
  Terminal,
} from "lucide-react";
import { LogViewer } from "@/components/dashboard/LogViewer";
import {
  OutputDestinationsCard,
  type OutputTarget,
} from "@/components/dashboard/OutputDestinationsCard";

type ContainerStatus = "running" | "stopped" | "error" | "not_found" | "unknown";

const SUB_STATUS_META: Record<
  string,
  { label: string; tone: "ok" | "warn" | "danger" | "mute"; hint: string }
> = {
  active: {
    label: "Работает",
    tone: "ok",
    hint: "Агент развёрнут и принимает задачи.",
  },
  paused: {
    label: "Приостановлен",
    tone: "warn",
    hint: "Контейнер остановлен биллингом. Возобновится после оплаты.",
  },
  pending_setup: {
    label: "Ждёт настройки",
    tone: "warn",
    hint: "Заполни поля в настройках агента — после этого он запустится.",
  },
  cancelled: {
    label: "Отменён",
    tone: "mute",
    hint: "Подписка завершена. Чтобы вернуть агента — оформи подписку заново в каталоге.",
  },
  expired: {
    label: "Истёк",
    tone: "mute",
    hint: "Срок действия закончился. Можно продлить через каталог.",
  },
};

const CONTAINER_LABEL: Record<ContainerStatus, string> = {
  running: "контейнер работает",
  stopped: "контейнер остановлен",
  error: "контейнер с ошибкой",
  not_found: "контейнер не запущен",
  unknown: "статус неизвестен",
};

function toneClasses(tone: "ok" | "warn" | "danger" | "mute"): {
  dot: string;
  text: string;
  ring: string;
} {
  if (tone === "ok") {
    return {
      dot: "bg-emerald-400/90",
      text: "text-emerald-300",
      ring: "border-emerald-400/20",
    };
  }
  if (tone === "warn") {
    return {
      dot: "bg-amber-300/90",
      text: "text-amber-200",
      ring: "border-amber-300/20",
    };
  }
  if (tone === "danger") {
    return {
      dot: "bg-rose-400/90",
      text: "text-rose-300",
      ring: "border-rose-500/20",
    };
  }
  return {
    dot: "bg-muted-foreground/60",
    text: "text-muted-foreground",
    ring: "border-[rgba(244,236,222,0.08)]",
  };
}

function fmtAmount(amount: number | null, currency: string | null): string {
  if (amount == null) return "—";
  const value = (amount / 100).toLocaleString("ru-RU", {
    maximumFractionDigits: currency === "USD" ? 2 : 0,
  });
  if (currency === "USD" || currency === "usd") return `$${value}`;
  return `${value} ₽`;
}

function fmtDate(d: Date | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// API → OutputTarget. /api/subscriptions/[id]/output-info сейчас возвращает
// только Telegram-цели (CHANNEL_ID/CHAT_ID/OWNER_CHAT_ID). Когда добавятся
// другие провайдеры — расширим этот маппинг (provider можно будет читать с
// бэка вместо хардкода "telegram").
type ApiTarget = {
  kind: "output" | "notification";
  envKey: string;
  raw: string;
  title: string | null;
  url: string | null;
  type: "channel" | "supergroup" | "group" | "private" | null;
  memberCount: number | null;
  accessible: boolean;
  error: string | null;
};

function mapApiTarget(t: ApiTarget): OutputTarget {
  let subtitle: string | undefined;
  const count =
    t.memberCount != null ? t.memberCount.toLocaleString("ru-RU") : null;
  if (t.type === "channel") {
    subtitle = count ? `Канал · ${count} подписчиков` : "Канал";
  } else if (t.type === "supergroup") {
    subtitle = count ? `Супергруппа · ${count} участников` : "Супергруппа";
  } else if (t.type === "group") {
    subtitle = count ? `Группа · ${count} участников` : "Группа";
  } else if (t.type === "private") {
    subtitle = "Личные сообщения";
  }

  return {
    id: t.envKey,
    kind: t.kind === "output" ? "primary" : "secondary",
    provider: "telegram",
    title: t.title ?? t.raw,
    subtitle,
    url: t.url ?? undefined,
    rawId: t.raw,
    status: t.accessible ? "ok" : "error",
    statusMessage: t.error ?? undefined,
  };
}

export function ManageView({
  subscriptionId,
  status,
  purchaseType,
  paymentProvider,
  amount,
  currency,
  startedAt,
  expiresAt,
}: {
  subscriptionId: string;
  status: string;
  purchaseType: string;
  paymentProvider: string | null;
  amount: number | null;
  currency: string | null;
  startedAt: Date | null;
  expiresAt: Date | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [containerStatus, setContainerStatus] = useState<ContainerStatus>("unknown");
  const [showLogs, setShowLogs] = useState(false);
  const [outputTargets, setOutputTargets] = useState<OutputTarget[]>([]);
  const [outputLoading, setOutputLoading] = useState(true);
  const pollRef = useRef<number | null>(null);

  const fetchContainerStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/subscriptions/${subscriptionId}/logs?tail=1`);
      if (!res.ok) return;
      const json = await res.json();
      setContainerStatus((json.data?.status as ContainerStatus) || "unknown");
    } catch {
      // молча — оставим прошлый статус
    }
  }, [subscriptionId]);

  useEffect(() => {
    fetchContainerStatus();
    pollRef.current = window.setInterval(fetchContainerStatus, 8000);
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [fetchContainerStatus]);

  // Куда поступают результаты — Telegram getChat по env-vars из config.
  // Бэкенд возвращает пустой массив если у агента нет TG-токена → карточка не
  // покажется (контракт OutputDestinationsCard).
  useEffect(() => {
    let cancelled = false;
    setOutputLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/subscriptions/${subscriptionId}/output-info`);
        if (!res.ok) {
          if (!cancelled) setOutputTargets([]);
          return;
        }
        const json = await res.json();
        const apiTargets = Array.isArray(json.data?.targets) ? json.data.targets : [];
        const mapped: OutputTarget[] = apiTargets.map(mapApiTarget);
        if (!cancelled) setOutputTargets(mapped);
      } catch {
        if (!cancelled) setOutputTargets([]);
      } finally {
        if (!cancelled) setOutputLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [subscriptionId]);

  const action = async (endpoint: "start" | "restart") => {
    setLoading(endpoint);
    setError(null);
    try {
      const res = await fetch(
        `/api/subscriptions/${subscriptionId}/${endpoint}`,
        { method: "POST" },
      );
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Ошибка");
      }
      router.refresh();
      fetchContainerStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setLoading(null);
    }
  };

  const meta = SUB_STATUS_META[status] || SUB_STATUS_META.cancelled;
  const tone = toneClasses(meta.tone);
  const isActive = status === "active";
  const isPaused = status === "paused";
  const isCancelled = status === "cancelled" || status === "expired";
  const containerHasError =
    isActive && (containerStatus === "error" || containerStatus === "not_found");

  return (
    <div className="space-y-4">
      {/* ===== STATUS PANEL ===== */}
      <section className={`rounded-[2px] border ${tone.ring} bg-[#161412] p-5 sm:p-6`}>
        <div className="flex items-start gap-4">
          <span className="relative mt-1.5 flex h-2 w-2 shrink-0">
            {isActive && (
              <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${tone.dot} opacity-60`} />
            )}
            <span className={`relative inline-flex h-2 w-2 rounded-full ${tone.dot}`} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Статус
            </div>
            <h2 className={`mt-1 text-[20px] font-semibold leading-tight ${tone.text}`}>
              {meta.label}
            </h2>
            <p className="mt-2 max-w-[60ch] text-[13.5px] leading-relaxed text-muted-foreground">
              {meta.hint}
            </p>
            {isActive && (
              <p className="mt-2 font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground/60">
                {CONTAINER_LABEL[containerStatus]}
              </p>
            )}
            {containerHasError && (
              <div className="mt-3 flex items-start gap-2 rounded-[2px] border border-amber-300/20 bg-amber-300/[0.04] p-3 text-[12.5px] leading-relaxed text-amber-200/90">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  Контейнер не запущен или упал — обычно это значит, что не
                  заполнены обязательные поля в настройках. Открой <strong>Настройки</strong> и проверь
                  значения.
                </span>
              </div>
            )}
          </div>

          <Link
            href={`/dashboard/agents/${subscriptionId}?edit=1`}
            className="hidden shrink-0 items-center gap-2 self-start rounded-[2px] bg-foreground px-4 py-2.5 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-background transition-opacity hover:opacity-90 sm:inline-flex"
          >
            <Settings className="h-3.5 w-3.5" />
            Настройки
          </Link>
        </div>

        <Link
          href={`/dashboard/agents/${subscriptionId}?edit=1`}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-[2px] bg-foreground px-4 py-2.5 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-background transition-opacity hover:opacity-90 sm:hidden"
        >
          <Settings className="h-3.5 w-3.5" />
          Настройки
        </Link>
      </section>

      {/* ===== BILLING PANEL ===== */}
      {!isCancelled && (
        <section className="grid grid-cols-2 gap-3 rounded-[2px] border border-[rgba(244,236,222,0.08)] bg-[#161412] p-5 sm:grid-cols-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              Тип
            </div>
            <div className="mt-1 text-[13px]">
              {purchaseType === "subscription" ? "Подписка" : "Разово"}
            </div>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              Сумма
            </div>
            <div className="mt-1 text-[13px]">{fmtAmount(amount, currency)}</div>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              Начало
            </div>
            <div className="mt-1 text-[13px]">{fmtDate(startedAt)}</div>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              {purchaseType === "subscription" ? "Следующее списание" : "Истекает"}
            </div>
            <div className="mt-1 text-[13px]">{fmtDate(expiresAt)}</div>
          </div>
          {paymentProvider && (
            <div className="col-span-2 sm:col-span-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                Способ оплаты
              </div>
              <div className="mt-1 text-[13px] text-muted-foreground">
                {paymentProvider === "yookassa"
                  ? "ЮKassa (карта / СБП)"
                  : "Криптовалюта (NowPayments)"}
              </div>
            </div>
          )}
        </section>
      )}

      {error && (
        <div className="rounded-[2px] border border-rose-500/30 bg-rose-500/[0.04] p-3 font-mono text-[12px] text-rose-300">
          {error}
        </div>
      )}

      {/* ===== OUTPUT DESTINATIONS — куда поступают результаты ===== */}
      {!isCancelled && (
        <OutputDestinationsCard targets={outputTargets} loading={outputLoading} />
      )}

      {/* ===== ЛОГИ — свёрнуты по умолчанию ===== */}
      <section className="rounded-[2px] border border-[rgba(244,236,222,0.08)] bg-[#161412]">
        <button
          type="button"
          onClick={() => setShowLogs((v) => !v)}
          className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left transition-colors hover:bg-[#1a1815]"
          aria-expanded={showLogs}
        >
          <div className="flex items-center gap-2.5">
            <Terminal className="h-3.5 w-3.5 text-muted-foreground/70" />
            <span className="font-mono text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Технические логи
            </span>
            <span className="hidden font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground/60 sm:inline">
              · для отладки
            </span>
          </div>
          {showLogs ? (
            <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </button>
        {showLogs && (
          <div className="border-t border-[rgba(244,236,222,0.06)]">
            <LogViewer subscriptionId={subscriptionId} />
          </div>
        )}
      </section>

      {/* ===== УПРАВЛЕНИЕ — внизу ===== */}
      {!isCancelled && (isActive || isPaused) && (
        <section className="rounded-[2px] border border-[rgba(244,236,222,0.08)] bg-[#161412] p-5">
          <div className="font-mono text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Управление подпиской
          </div>

          <div className="mt-3 flex flex-col gap-2.5 text-[13px]">
            {isActive && (
              <button
                onClick={() => action("restart")}
                disabled={loading !== null}
                className="inline-flex h-9 w-fit items-center gap-2 rounded-[2px] border border-[rgba(244,236,222,0.08)] bg-[#1a1815] px-3.5 font-mono text-[11px] font-medium uppercase tracking-[0.08em] transition-colors hover:border-[rgba(244,236,222,0.14)] disabled:opacity-50"
              >
                {loading === "restart" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RotateCw className="h-3.5 w-3.5" />
                )}
                Перезапустить контейнер
              </button>
            )}

            {isPaused && (
              <button
                onClick={() => action("start")}
                disabled={loading !== null}
                className="inline-flex h-9 w-fit items-center gap-2 rounded-[2px] bg-foreground px-4 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-background transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {loading === "start" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RotateCw className="h-3.5 w-3.5" />
                )}
                Возобновить
              </button>
            )}

            <p className="mt-1 font-mono text-[10.5px] leading-relaxed text-muted-foreground/60">
              чтобы отвязать карту или отменить подписку — напишите на{" "}
              <a
                href="mailto:rodimovartem999@yandex.ru"
                className="text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground"
              >
                rodimovartem999@yandex.ru
              </a>
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
