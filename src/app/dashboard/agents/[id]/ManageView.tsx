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
      {/* Статус */}
      <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 p-5 backdrop-blur-sm">
        <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-violet-500/5 blur-3xl" />
        <div className="relative">
          <h2 className="text-xs font-bold uppercase tracking-wider text-violet-400/80">
            Статус
          </h2>
          <div className="mt-3 flex items-center justify-between">
            <div>
              <div className="text-lg font-bold capitalize">{status}</div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {purchaseType === "subscription" ? "Подписка" : "Разовая покупка"}
              </p>
            </div>

            <div className="flex gap-2">
              {isPaused && (
                <button
                  onClick={() => action("start")}
                  disabled={loading !== null}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full bg-gradient-to-r from-violet-600 to-blue-600 px-4 text-sm font-bold text-white shadow-md shadow-violet-500/25 transition-all hover:brightness-110 disabled:opacity-50"
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
                    className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border/50 bg-white/5 px-4 text-sm font-medium backdrop-blur-sm transition-colors hover:border-violet-500/30 hover:bg-white/10 disabled:opacity-50"
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
                    className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border/50 bg-white/5 px-4 text-sm font-medium backdrop-blur-sm transition-colors hover:border-red-500/30 hover:bg-white/10 disabled:opacity-50"
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
            <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Логи контейнера */}
      <LogViewer subscriptionId={subscriptionId} />
    </div>
  );
}
