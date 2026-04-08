"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { RefreshCw, ChevronDown } from "lucide-react";

type ContainerStatus = "running" | "stopped" | "error" | "not_found";

const STATUS_LABELS: Record<ContainerStatus, { label: string; color: string }> = {
  running: { label: "Работает", color: "text-green-500" },
  stopped: { label: "Остановлен", color: "text-yellow-500" },
  error: { label: "Ошибка", color: "text-red-500" },
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

  // Автообновление каждые 5 секунд
  useEffect(() => {
    fetchLogs();
    if (!autoRefresh) return;
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, [fetchLogs, autoRefresh]);

  // Автоскролл вниз при новых логах
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
    <div className="rounded-xl border border-border p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Логи контейнера
        </h2>
        <div className="flex items-center gap-3">
          {/* Статус контейнера */}
          <span className={`text-xs font-medium ${statusInfo.color}`}>
            {statusInfo.label}
          </span>

          {/* Автообновление */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
              autoRefresh
                ? "bg-primary/10 text-primary"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            <RefreshCw className={`h-3 w-3 ${autoRefresh ? "animate-spin" : ""}`} style={autoRefresh ? { animationDuration: "3s" } : undefined} />
            {autoRefresh ? "Авто" : "Пауза"}
          </button>

          {/* Ручное обновление */}
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Лог-контейнер */}
      <div
        className="mt-3 max-h-80 overflow-y-auto rounded-lg bg-[#0d0d14] p-4 font-mono text-xs leading-5"
        onScroll={(e) => {
          const el = e.currentTarget;
          const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
          setAutoScroll(atBottom);
        }}
      >
        {logLines.length === 0 ? (
          <div className="text-muted-foreground">
            {containerStatus === "not_found"
              ? "Контейнер не запущен. Нажмите «Запустить» для старта."
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
                  ? "text-yellow-400"
                  : "text-gray-300"
              }`}
            >
              {line}
            </div>
          ))
        )}
        <div ref={logsEndRef} />
      </div>

      {/* Кнопка прокрутки вниз */}
      {!autoScroll && logLines.length > 0 && (
        <button
          onClick={() => {
            setAutoScroll(true);
            logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }}
          className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ChevronDown className="h-3 w-3" />
          К последним логам
        </button>
      )}
    </div>
  );
}
