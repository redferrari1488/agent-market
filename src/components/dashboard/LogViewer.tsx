"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { RefreshCw, ChevronDown } from "lucide-react";

type ContainerStatus = "running" | "stopped" | "error" | "not_found";

const STATUS_LABELS: Record<ContainerStatus, { label: string; color: string }> = {
  running: { label: "Работает", color: "text-emerald-400" },
  stopped: { label: "Остановлен", color: "text-amber-400" },
  error: { label: "Ошибка", color: "text-red-400" },
  not_found: { label: "Не найден", color: "text-muted-foreground" },
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
  const logLines = logs
    .split("\n")
    .filter((line) => line.trim().length > 0);

  return (
    <div className="rounded-lg border border-border/40 p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
          Логи агента
        </h2>
        <div className="flex items-center gap-3">
          <span className={`text-[12px] font-medium ${statusInfo.color}`}>
            {statusInfo.label}
          </span>

          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
              autoRefresh
                ? "bg-foreground/10 text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <RefreshCw className={`h-3 w-3 ${autoRefresh ? "animate-spin" : ""}`} style={autoRefresh ? { animationDuration: "3s" } : undefined} />
            {autoRefresh ? "Авто" : "Пауза"}
          </button>

          <button
            onClick={fetchLogs}
            disabled={loading}
            className="rounded-md p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div
        className="mt-4 max-h-80 overflow-y-auto rounded-lg border border-border/40 bg-card p-4 font-mono text-[11px] leading-5"
        onScroll={(e) => {
          const el = e.currentTarget;
          const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
          setAutoScroll(atBottom);
        }}
      >
        {logLines.length === 0 ? (
          <div className="text-muted-foreground">
            {containerStatus === "not_found"
              ? "Агент не запущен. Нажмите «Запустить» для старта."
              : "Логи пусты."}
          </div>
        ) : (
          logLines.map((line, i) => (
            <div
              key={i}
              className={`whitespace-pre-wrap break-all ${
                line.toLowerCase().includes("error")
                  ? "text-red-400"
                  : line.toLowerCase().includes("warn")
                  ? "text-amber-400"
                  : "text-foreground/70"
              }`}
            >
              {line}
            </div>
          ))
        )}
        <div ref={logsEndRef} />
      </div>

      {!autoScroll && logLines.length > 0 && (
        <button
          onClick={() => {
            setAutoScroll(true);
            logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }}
          className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
        >
          <ChevronDown className="h-3 w-3" />
          К последним логам
        </button>
      )}
    </div>
  );
}
