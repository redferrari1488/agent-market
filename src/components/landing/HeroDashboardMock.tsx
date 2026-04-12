"use client";

import { useEffect, useState } from "react";
import {
  MessageSquare,
  PenTool,
  Activity,
  Circle,
  Square,
  RotateCw,
} from "lucide-react";

const LOG_LINES = [
  { ts: "12:04:21", text: "bot.started  model=claude-haiku", ok: false },
  { ts: "12:04:22", text: "telegram.connected  @support_bot", ok: false },
  { ts: "12:04:58", text: "msg.received  from=@anna_k  len=142", ok: true },
  { ts: "12:05:01", text: "ai.response  tokens=188  1.4s", ok: true },
  { ts: "12:05:01", text: "msg.sent  to=@anna_k", ok: true },
  { ts: "12:06:12", text: "msg.received  from=@dmitry  len=64", ok: true },
  { ts: "12:06:14", text: "ai.response  tokens=96  1.1s", ok: true },
  { ts: "12:06:14", text: "msg.sent  to=@dmitry", ok: true },
  { ts: "12:07:33", text: "heartbeat  status=healthy  uptime=4h22m", ok: false },
];

const SIDEBAR_AGENTS = [
  { name: "AI Support Bot", icon: MessageSquare, status: "running" as const },
  { name: "Content Writer", icon: PenTool, status: "running" as const },
  { name: "Competitor Monitor", icon: Activity, status: "stopped" as const },
];

export function HeroDashboardMock() {
  const [logCount, setLogCount] = useState(0);

  useEffect(() => {
    if (logCount >= LOG_LINES.length) {
      const t = setTimeout(() => setLogCount(0), 2400);
      return () => clearTimeout(t);
    }
    const t = setTimeout(
      () => setLogCount((c) => c + 1),
      logCount === 0 ? 600 : 550 + Math.random() * 350,
    );
    return () => clearTimeout(t);
  }, [logCount]);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-[#0b0b0f] shadow-2xl shadow-black/50">
      {/* Title bar */}
      <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-2.5">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
          <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
          <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
        </div>
        <div className="ml-2 flex-1 rounded-md bg-white/[0.04] px-3 py-0.5 text-[11px] text-white/30">
          agentmarket.ru/dashboard
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="hidden w-[180px] shrink-0 border-r border-white/[0.06] sm:block">
          <div className="px-3 pt-4 pb-2 text-[10px] font-medium uppercase tracking-widest text-white/25">
            Мои агенты
          </div>
          {SIDEBAR_AGENTS.map((a) => (
            <div
              key={a.name}
              className={`mx-2 flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12px] ${a.name === "AI Support Bot" ? "bg-white/[0.06] text-white" : "text-white/40"}`}
            >
              <a.icon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{a.name}</span>
              <Circle
                className={`ml-auto h-2 w-2 shrink-0 ${a.status === "running" ? "fill-emerald-400 text-emerald-400" : "fill-white/20 text-white/20"}`}
              />
            </div>
          ))}
          <div className="mt-4 border-t border-white/[0.06] px-3 pt-3">
            <div className="text-[10px] font-medium uppercase tracking-widest text-white/25">
              Статистика
            </div>
            <div className="mt-2 space-y-1.5 text-[11px] text-white/40">
              <div className="flex justify-between">
                <span>Uptime</span>
                <span className="text-white/70">99.8%</span>
              </div>
              <div className="flex justify-between">
                <span>Сообщений</span>
                <span className="text-white/70">1,247</span>
              </div>
              <div className="flex justify-between">
                <span>RAM</span>
                <span className="text-white/70">84 MB</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Agent header */}
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3 sm:px-5">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-medium text-white truncate">AI Support Bot</div>
                <div className="text-[11px] text-white/30">claude-haiku-4-5</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                Running
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-2.5 sm:px-5">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.08] px-2.5 py-1 text-[11px] text-white/50"
            >
              <Square className="h-2.5 w-2.5" />
              Stop
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.08] px-2.5 py-1 text-[11px] text-white/50"
            >
              <RotateCw className="h-2.5 w-2.5" />
              Restart
            </button>
            <div className="ml-auto text-[11px] text-white/25">
              CPU 2% · RAM 84 MB
            </div>
          </div>

          {/* Logs */}
          <div className="px-4 py-3 sm:px-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-medium uppercase tracking-widest text-white/25">
                Logs
              </span>
              <span className="text-[10px] text-emerald-400/60">live</span>
            </div>
            <div className="h-[140px] overflow-hidden rounded-lg bg-black/30 px-3 py-2.5 font-mono text-[10.5px] leading-[1.7]">
              {LOG_LINES.slice(0, logCount).map((line, i) => (
                <div
                  key={`${logCount}-${i}`}
                  className={line.ok ? "text-white/50" : "text-white/30"}
                >
                  <span className="text-white/20">{line.ts}</span>{" "}
                  {line.text}
                </div>
              ))}
              {logCount < LOG_LINES.length && (
                <span className="inline-block h-3 w-[5px] animate-pulse bg-white/30" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
