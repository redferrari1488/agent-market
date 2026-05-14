"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Play, RotateCw, XCircle } from "lucide-react";
import { LogViewer } from "@/components/dashboard/LogViewer";

const CANCEL_CONFIRM =
  "Отменить подписку? Контейнер будет остановлен, авто-списания прекратятся. Чтобы вернуться — оформите подписку заново.";

export function ManageView({
  subscriptionId,
  status,
  purchaseType,
}: {
  subscriptionId: string;
  status: string;
  purchaseType: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const action = async (endpoint: "start" | "stop" | "restart") => {
    if (endpoint === "stop" && !window.confirm(CANCEL_CONFIRM)) return;

    setLoading(endpoint);
    setError(null);
    try {
      const res = await fetch(
        `/api/subscriptions/${subscriptionId}/${endpoint}`,
        { method: "POST" }
      );
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Ошибка");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setLoading(null);
    }
  };

  const isActive = status === "active";
  const isPaused = status === "paused";
  const isCancelled = status === "cancelled";

  return (
    <div className="space-y-4">
      <div className="rounded-[2px] border border-[rgba(244,236,222,0.08)] bg-[#161412] p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="font-mono text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Управление
            </div>
            <p className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.06em] text-muted-foreground/70">
              {purchaseType === "subscription" ? "подписка" : "разовая покупка"}
              {isCancelled && " · отменена"}
              {isPaused && " · приостановлена биллингом"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {isPaused && (
              <button
                onClick={() => action("start")}
                disabled={loading !== null}
                className="inline-flex h-9 items-center gap-2 rounded-[2px] bg-foreground px-4 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-background transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {loading === "start" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Play className="h-3.5 w-3.5" />
                )}
                Запустить
              </button>
            )}
            {isActive && (
              <>
                <button
                  onClick={() => action("restart")}
                  disabled={loading !== null}
                  className="inline-flex h-9 items-center gap-2 rounded-[2px] border border-[rgba(244,236,222,0.08)] bg-[#1a1815] px-3.5 font-mono text-[11px] font-medium uppercase tracking-[0.08em] transition-colors hover:border-[rgba(244,236,222,0.14)] disabled:opacity-50"
                >
                  {loading === "restart" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RotateCw className="h-3.5 w-3.5" />
                  )}
                  <span className="hidden sm:inline">Рестарт</span>
                </button>
                <button
                  onClick={() => action("stop")}
                  disabled={loading !== null}
                  className="inline-flex h-9 items-center gap-2 rounded-[2px] border border-rose-500/30 bg-[#1a1815] px-3.5 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-rose-300 transition-colors hover:border-rose-500/60 hover:text-rose-200 disabled:opacity-50"
                >
                  {loading === "stop" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5" />
                  )}
                  <span className="hidden sm:inline">Отменить подписку</span>
                  <span className="sm:hidden">Отменить</span>
                </button>
              </>
            )}
          </div>
        </div>

        {isCancelled && (
          <p className="mt-4 border-t border-[rgba(244,236,222,0.06)] pt-4 text-[13px] leading-relaxed text-muted-foreground">
            Подписка отменена. Авто-списания прекращены, контейнер остановлен.
            Чтобы вернуть агента — оформите подписку заново в каталоге.
          </p>
        )}

        {error && (
          <div className="mt-4 rounded-[2px] border border-rose-500/30 bg-rose-500/[0.04] p-3 font-mono text-[12px] text-rose-300">
            {error}
          </div>
        )}
      </div>

      <LogViewer subscriptionId={subscriptionId} />
    </div>
  );
}
