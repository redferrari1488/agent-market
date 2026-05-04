"use client";

import { useEffect, useRef, useState } from "react";

type Tone = "info" | "ok" | "warn" | "err";
type Line = { t: string; sym: string; tone: Tone; txt: string };

function classify(text: string): { tone: Tone; sym: string } {
  const lower = text.toLowerCase();
  if (lower.includes("error") || lower.includes("fail") || lower.includes("exception")) {
    return { tone: "err", sym: "✗" };
  }
  if (lower.includes("warn") || lower.includes("retry") || lower.includes("rate limit")) {
    return { tone: "warn", sym: "⚠" };
  }
  if (
    lower.includes("✓") ||
    lower.includes("ok") ||
    lower.includes("delivered") ||
    lower.includes("sent") ||
    lower.includes("done") ||
    lower.includes("success")
  ) {
    return { tone: "ok", sym: "✓" };
  }
  return { tone: "info", sym: "▸" };
}

function parseLog(raw: string): Line {
  // Docker logs have a leading ISO timestamp: "2026-05-04T12:05:01.123Z msg"
  const m = raw.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/);
  let t = "";
  let txt = raw;
  if (m) {
    t = m[1].slice(11, 19); // HH:MM:SS
    txt = raw.slice(m[0].length).trim().replace(/^\.\d+Z\s*/, "");
  }
  if (!t) {
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, "0");
    t = `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  }
  const { tone, sym } = classify(txt);
  return { t, sym, tone, txt };
}

function nowStamp() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

type ContainerStatus = "running" | "stopped" | "error" | "not_found";

export function LogTerminal({
  subscriptionId,
  agentSlug,
  tall = false,
  onStatusChange,
}: {
  subscriptionId: string;
  agentSlug: string;
  tall?: boolean;
  onStatusChange?: (s: ContainerStatus) => void;
}) {
  const [lines, setLines] = useState<Line[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<ContainerStatus>("not_found");
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchLogs = async () => {
      try {
        const res = await fetch(`/api/subscriptions/${subscriptionId}/logs?tail=100`);
        if (!res.ok || cancelled) return;
        const json = await res.json();
        if (cancelled) return;
        const raw: string = json?.data?.logs || "";
        const newStatus: ContainerStatus = json?.data?.status || "not_found";
        setStatus(newStatus);
        onStatusChange?.(newStatus);
        const parsed = raw
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l.length > 0)
          .map(parseLog)
          .slice(-80);
        setLines(parsed);
      } catch {
        // ignore — keep prior lines
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchLogs();
    const id = setInterval(fetchLogs, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [subscriptionId, onStatusChange]);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [lines]);

  const live = status === "running";

  return (
    <div className="hc-logs">
      <div className="hc-logs-head">
        <span className="hc-mono hc-small hc-mute">$ hireon logs --follow {agentSlug}</span>
        <span
          className="hc-logs-stat"
          style={{
            color: live
              ? "var(--hc-ok)"
              : status === "error"
                ? "var(--hc-err)"
                : "var(--hc-mute)",
          }}
        >
          <span
            className={`hc-dot ${live ? "hc-dot-pulse" : ""}`}
            style={{
              background: live
                ? "var(--hc-ok)"
                : status === "error"
                  ? "var(--hc-err)"
                  : "var(--hc-mute2)",
              width: 5,
              height: 5,
            }}
          />
          <span className="hc-mono hc-small">
            {live ? "LIVE" : status === "stopped" ? "STOPPED" : status === "error" ? "ERROR" : "OFFLINE"}
          </span>
        </span>
      </div>
      <div className={`hc-logs-body ${tall ? "is-tall" : ""}`} ref={bodyRef}>
        {loading && lines.length === 0 ? (
          <div className="hc-logline">
            <span className="hc-logline-t">[--:--:--]</span>
            <span className="hc-logline-sym">·</span>
            <span className="hc-logline-txt hc-mute">загрузка логов...</span>
          </div>
        ) : lines.length === 0 ? (
          <div className="hc-logline">
            <span className="hc-logline-t">[{nowStamp()}]</span>
            <span className="hc-logline-sym">·</span>
            <span className="hc-logline-txt hc-mute">
              {status === "not_found"
                ? "контейнер не запущен — нажмите «запустить»"
                : "пока нет логов"}
            </span>
          </div>
        ) : (
          lines.map((l, i) => (
            <div key={i} className={`hc-logline tone-${l.tone}`}>
              <span className="hc-logline-t">[{l.t}]</span>
              <span className="hc-logline-sym">{l.sym}</span>
              <span className="hc-logline-txt">{l.txt}</span>
            </div>
          ))
        )}
        {live && (
          <div className="hc-logline">
            <span className="hc-logline-t">[{nowStamp()}]</span>
            <span className="hc-cursor">▌</span>
          </div>
        )}
      </div>
    </div>
  );
}
