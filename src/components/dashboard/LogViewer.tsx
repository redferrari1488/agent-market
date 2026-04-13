"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { RefreshCw, ChevronDown, Terminal } from "lucide-react";

type ContainerStatus = "running" | "stopped" | "error" | "not_found";

const STATUS_LABELS: Record<ContainerStatus, { label: string; color: string; dot: string }> = {
  running: { label: "Работает", color: "text-emerald-400", dot: "bg-emerald-400" },
  stopped: { label: "Остановлен", color: "text-amber-400", dot: "bg-amber-400" },
  error: { label: "Ошибка", color: "text-red-400", dot: "bg-red-400" },
  not_found: { label: "Не запущен", color: "text-muted-foreground", dot: "bg-muted-foreground" },
};

export function LogViewer({ subscriptionId }: { subscriptionId: string }) {
  const [logs, setLogs] = useState<string>("");
  const [containerStatus, setContainerStatus] = useState<ContainerStatus>("not_found");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/subscriptions/${subscriptionId}/logs?tail=100`);
      if (!res.ok) return;
      const json = await res.json();
      if (json.data) {
        setLogs(json.data.logs || "");
        setContainerStatus(json.data.status || "not_found");
      }
    } catch {
      // Молча игнорируем — покажем старые логи
    } finally {
      setLoading(false);
    }
  }, [subscriptionId]);

  useEffect(() => {
    fetchLogs();
    if (!autoRefresh) return;
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, [fetchLogs, autoRefresh]);

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, autoScroll]);

  const statusInfo = STATUS_LABELS[containerStatus];
  const logLines = logs.split("\n").filter((line) => line.trim().length > 0);

  return (
    <div className="overflow-hidden rounded-lg border border-border/40">
      <div className="flex items-center justify-between gap-3 border-b border-border/40 bg-card/60 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2.5 min-w-0">
          <Terminal className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
          <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
            Логи
          </h2>
          <span className="text-muted-foreground/30">·</span>
          <span className={`flex items-center gap-1.5 text-[11.5px] font-medium ${statusInfo.color}`}>
            <span className="relative flex h-1.5 w-1.5">
              {containerStatus === "running" && (
                <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${statusInfo.dot} opacity-60`} />
              )}
              <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${statusInfo.dot}`} />
            </span>
            {statusInfo.label}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`inline-flex h-7 items-center gap-1 rounded-md px-2 font-mono text-[10.5px] font-medium uppercase tracking-wider transition-colors ${
              autoRefresh
                ? "bg-foreground/10 text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <RefreshCw
              className={`h-3 w-3 ${autoRefresh ? "animate-spin" : ""}`}
              style={autoRefresh ? { animationDuration: "3s" } : undefined}
            />
            {autoRefresh ? "Live" : "Pause"}
          </button>
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground disabled:opacity-50"
            aria-label="Обновить"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div
        className="relative max-h-[28rem] overflow-y-auto bg-[#030308] p-4 font-mono text-[11.5px] leading-[1.6] sm:p-5"
        onScroll={(e) => {
          const el = e.currentTarget;
          const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
          setAutoScroll(atBottom);
        }}
      >
        {logLines.length === 0 ? (
          <div className="py-6 text-center text-[12px] text-muted-foreground/60">
            {containerStatus === "not_found"
              ? "Агент не запущен. Нажмите «Запустить», чтобы начать."
              : "Пока нет логов."}
          </div>
        ) : (
          logLines.map((line, i) => {
            const lower = line.toLowerCase();
            const isError = lower.includes("error") || lower.includes("fail");
            const isWarn = lower.includes("warn");
            return (
              <div
                key={i}
                className={`flex gap-3 whitespace-pre-wrap break-all ${
                  isError ? "text-red-400" : isWarn ? "text-amber-400" : "text-foreground/70"
                }`}
              >
                <span className="shrink-0 select-none text-muted-foreground/30 tabular-nums">
                  {String(i + 1).padStart(3, "0")}
                </span>
                <span className="min-w-0 flex-1">{line}</span>
              </div>
            );
          })
        )}
        <div ref={logsEndRef} />
      </div>

      {!autoScroll && logLines.length > 0 && (
        <button
          onClick={() => {
            setAutoScroll(true);
            logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }}
          className="flex w-full items-center justify-center gap-1 border-t border-border/40 bg-card/60 py-2 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronDown className="h-3 w-3" />К последним логам
        </button>
      )}
    </div>
  );
}
