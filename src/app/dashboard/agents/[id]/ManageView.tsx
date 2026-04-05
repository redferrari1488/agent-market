"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Play, Square, RotateCw } from "lucide-react";

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
      {/* Статус */}
      <div className="rounded-xl border border-border p-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Статус
        </h2>
        <div className="mt-3 flex items-center justify-between">
          <div>
            <div className="text-base font-bold capitalize">{status}</div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {purchaseType === "subscription" ? "Подписка" : "Разовая покупка"}
            </p>
          </div>

          <div className="flex gap-2">
            {isPaused && (
              <button
                onClick={() => action("start")}
                disabled={loading !== null}
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-3.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
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
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3.5 text-sm font-medium hover:bg-secondary disabled:opacity-50"
                >
                  {loading === "restart" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RotateCw className="h-3.5 w-3.5" />
                  )}
                  Рестарт
                </button>
                <button
                  onClick={() => action("stop")}
                  disabled={loading !== null}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3.5 text-sm font-medium hover:bg-secondary disabled:opacity-50"
                >
                  {loading === "stop" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Square className="h-3.5 w-3.5" />
                  )}
                  Остановить
                </button>
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">
            {error}
          </div>
        )}
      </div>

      {/* Логи (заглушка до Day 5) */}
      <div className="rounded-xl border border-border p-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Логи
        </h2>
        <div className="mt-3 rounded-lg bg-secondary p-4 font-mono text-xs text-muted-foreground">
          Логи появятся после запуска контейнера (Day 5).
        </div>
      </div>
    </div>
  );
}
