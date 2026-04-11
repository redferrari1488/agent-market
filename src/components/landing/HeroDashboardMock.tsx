"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  CheckCircle2,
  MessageSquare,
  Pause,
  RefreshCw,
} from "lucide-react";

const LOG_LINES: { level: "info" | "ok" | "warn"; text: string }[] = [
  { level: "info", text: "[12:04:21] bot.started model=claude-haiku-4-5" },
  { level: "info", text: "[12:04:22] telegram.connected @support_bot" },
  { level: "ok", text: "[12:04:58] msg.received from=@anna_k chars=142" },
  { level: "info", text: "[12:04:59] ai.request tokens_in=512" },
  { level: "ok", text: "[12:05:01] ai.response tokens_out=188 latency=1.4s" },
  { level: "ok", text: "[12:05:01] msg.sent to=@anna_k" },
  { level: "info", text: "[12:06:12] msg.received from=@dmitry chars=64" },
  { level: "ok", text: "[12:06:14] ai.response tokens_out=96 latency=1.1s" },
  { level: "ok", text: "[12:06:14] msg.sent to=@dmitry" },
  { level: "info", text: "[12:07:33] heartbeat status=healthy uptime=4h22m" },
];

export function HeroDashboardMock() {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (visibleCount >= LOG_LINES.length) {
      const restart = setTimeout(() => setVisibleCount(0), 3000);
      return () => clearTimeout(restart);
    }
    const t = setTimeout(
      () => setVisibleCount((c) => c + 1),
      visibleCount === 0 ? 500 : 700 + Math.random() * 400,
    );
    return () => clearTimeout(t);
  }, [visibleCount]);

  return (
    <div className="relative">
      {/* Outer glow halo */}
      <div className="pointer-events-none absolute -inset-8 -z-10">
        <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-violet-600/20 via-blue-600/10 to-transparent blur-3xl" />
      </div>

      {/* Browser chrome */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a12]/90 shadow-2xl shadow-violet-950/40 backdrop-blur-sm">
        <div className="flex items-center gap-2 border-b border-white/5 bg-white/[0.02] px-4 py-3">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <div className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <div className="h-2.5 w-2.5 rounded-full bg-white/15" />
          </div>
          <div className="ml-3 flex-1 truncate rounded-md bg-white/5 px-3 py-1 text-[11px] text-muted-foreground">
            agentmarket.ru/dashboard/agents/…
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4 p-5">
          {/* Agent card */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold">AI Support Bot</div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    claude-haiku-4-5 · BYOK
                  </div>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-400">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                running
              </span>
            </div>

            {/* Control bar */}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3 text-[11px] text-muted-foreground"
              >
                <Pause className="h-3 w-3" />
                Stop
              </button>
              <button
                type="button"
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3 text-[11px] text-muted-foreground"
              >
                <RefreshCw className="h-3 w-3" />
                Restart
              </button>
              <div className="ml-auto flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Activity className="h-3 w-3" />
                CPU 2% · RAM 84MB
              </div>
            </div>
          </div>

          {/* Logs panel */}
          <div className="rounded-xl border border-white/10 bg-black/40">
            <div className="flex items-center justify-between border-b border-white/5 px-4 py-2">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Live logs
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-400">
                <CheckCircle2 className="h-3 w-3" />
                streaming
              </div>
            </div>
            <div className="h-[180px] overflow-hidden px-4 py-3 font-mono text-[10.5px] leading-relaxed">
              {LOG_LINES.slice(0, visibleCount).map((line, i) => (
                <motion.div
                  key={`${visibleCount}-${i}`}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={
                    line.level === "ok"
                      ? "text-emerald-400/90"
                      : line.level === "warn"
                        ? "text-amber-400/90"
                        : "text-muted-foreground"
                  }
                >
                  {line.text}
                </motion.div>
              ))}
              {visibleCount < LOG_LINES.length && (
                <motion.span
                  animate={{ opacity: [1, 0.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="inline-block h-3 w-1.5 bg-emerald-400/70"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
