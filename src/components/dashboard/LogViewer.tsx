"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronDown, Terminal } from "lucide-react";

type ContainerStatus = "running" | "stopped" | "error" | "not_found";

const STATUS_LABELS: Record<ContainerStatus, { label: string; color: string; dot: string }> = {
  running: { label: "Работает", color: "text-foreground", dot: "bg-foreground" },
  stopped: { label: "Остановлен", color: "text-muted-foreground", dot: "bg-muted-foreground/70" },
  error: { label: "Ошибка", color: "text-rose-300", dot: "bg-rose-400" },
  not_found: { label: "Не запущен", color: "text-muted-foreground/70", dot: "bg-muted-foreground/40" },
};

export function LogViewer({ subscriptionId }: { subscriptionId: string }) {
  const [logs, setLogs] = useState<string>("");
  const [containerStatus, setContainerStatus] = useState<ContainerStatus>("not_found");
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const fetchLogs = useCallback(async () => {
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
    }
  }, [subscriptionId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, autoScroll]);

  const statusInfo = STATUS_LABELS[containerStatus];
  const logLines = logs.split("\n").filter((line) => line.trim().length > 0);

  return (
    <div className="overflow-hidden rounded-[2px] border border-[rgba(244,236,222,0.08)]">
      <div className="flex items-center justify-between gap-3 border-b border-[rgba(244,236,222,0.06)] bg-[#161412] px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2.5 min-w-0">
          <Terminal className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
          <h2 className="font-mono text-[12px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Логи
          </h2>
          <span className="text-muted-foreground/30">·</span>
          <span className={`flex items-center gap-1.5 font-mono text-[12px] uppercase tracking-[0.08em] ${statusInfo.color}`}>
            <span className="relative flex h-1.5 w-1.5">
              {containerStatus === "running" && (
                <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${statusInfo.dot} opacity-60`} />
              )}
              <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${statusInfo.dot}`} />
            </span>
            {statusInfo.label}
          </span>
        </div>
      </div>

      <div
        className="relative max-h-[28rem] overflow-y-auto bg-[#08080a] p-4 font-mono text-[11.5px] leading-[1.6] sm:p-5"
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
                  isError ? "text-rose-300" : isWarn ? "text-amber-300/80" : "text-foreground/75"
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
          className="flex w-full items-center justify-center gap-1 border-t border-[rgba(244,236,222,0.06)] bg-[#161412] py-2 font-mono text-[12px] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronDown className="h-3 w-3" />К последним логам
        </button>
      )}
    </div>
  );
}
