"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Play, Square, RotateCw } from "lucide-react";
import { LogViewer } from "@/components/dashboard/LogViewer";

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

  return (
    <div className="space-y-4">
      {/* Панель управления */}
      <div className="rounded-lg border border-border/40 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
              Управление
            </h2>
            <p className="mt-1 text-[12px] text-muted-foreground/70">
              {purchaseType === "subscription" ? "Подписка" : "Разовая покупка"}
            </p>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            {isPaused && (
              <button
                onClick={() => action("start")}
                disabled={loading !== null}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-foreground px-4 text-[13px] font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
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
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border/40 px-3.5 text-[13px] font-medium transition-colors hover:border-border disabled:opacity-50"
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
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border/40 px-3.5 text-[13px] font-medium text-muted-foreground transition-colors hover:border-border hover:text-foreground disabled:opacity-50"
                >
                  {loading === "stop" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Square className="h-3.5 w-3.5" />
                  )}
                  <span className="hidden sm:inline">Стоп</span>
                </button>
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-[13px] text-red-400">
            {error}
          </div>
        )}
      </div>

      {/* Логи контейнера */}
      <LogViewer subscriptionId={subscriptionId} />
    </div>
  );
}
