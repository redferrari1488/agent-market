"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  MessageSquare,
  Send,
  Bell,
  Activity,
  RefreshCw,
} from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

type Event = {
  id: number;
  text: string;
  meta: string;
  icon: React.ElementType;
  tone: "ok" | "send" | "alert" | "sync";
};

const EVENT_POOL: Omit<Event, "id">[] = [
  { text: "ответ отправлен @anna_k", meta: "1.4с", icon: Send, tone: "send" },
  { text: "пост опубликован в канал", meta: "Контент", icon: CheckCircle2, tone: "ok" },
  { text: "обработан запрос /support", meta: "0.9с", icon: MessageSquare, tone: "ok" },
  { text: "уведомление в Slack", meta: "доставлено", icon: Bell, tone: "alert" },
  { text: "ответ отправлен @dmitry", meta: "1.1с", icon: Send, tone: "send" },
  { text: "проверка состояния", meta: "ОК", icon: RefreshCw, tone: "sync" },
  { text: "ответ отправлен @alex", meta: "1.3с", icon: Send, tone: "send" },
  { text: "перенаправлено оператору", meta: "Поддержка", icon: MessageSquare, tone: "alert" },
];

const TONE_STYLES: Record<Event["tone"], { bg: string; text: string }> = {
  ok: { bg: "bg-emerald-500/10", text: "text-emerald-400" },
  send: { bg: "bg-blue-500/10", text: "text-blue-400" },
  alert: { bg: "bg-amber-500/10", text: "text-amber-400" },
  sync: { bg: "bg-violet-500/10", text: "text-violet-400" },
};

/* tiny static sparkline using svg path */
const SPARK_POINTS = [4, 7, 5, 9, 6, 11, 8, 13, 9, 14, 11, 16, 12, 14, 13, 17, 14, 19, 16, 18];

function formatTime(d: Date) {
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export function LiveActivityMock() {
  const [now, setNow] = useState<Date>(() => new Date());
  const [pool, setPool] = useState<Event[]>(() =>
    EVENT_POOL.slice(0, 5).map((e, i) => ({ ...e, id: i })),
  );
  const [eventCount, setEventCount] = useState(1247);

  /* tick the clock every second */
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  /* push a new event every 3.2 seconds */
  useEffect(() => {
    let counter = EVENT_POOL.length;
    const t = setInterval(() => {
      const next: Event = {
        ...EVENT_POOL[counter % EVENT_POOL.length],
        id: counter,
      };
      counter += 1;
      setPool((prev) => [next, ...prev.slice(0, 4)]);
      setEventCount((c) => c + Math.floor(Math.random() * 3) + 1);
    }, 3200);
    return () => clearInterval(t);
  }, []);

  const current = pool[0];
  const history = pool.slice(1);

  const sparkW = 88;
  const sparkH = 22;
  const max = Math.max(...SPARK_POINTS);
  const path = SPARK_POINTS.map((v, i) => {
    const x = (i / (SPARK_POINTS.length - 1)) * sparkW;
    const y = sparkH - (v / max) * sparkH;
    return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-2xl shadow-black/20 dark:shadow-black/50">
      {/* ─── Header strip with live pulse and ticking clock ─── */}
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="font-mono text-[10.5px] font-medium uppercase tracking-[0.18em] text-foreground">
            эфир
          </span>
          <span className="text-[10.5px] text-muted-foreground/50">·</span>
          <span className="text-[11px] text-muted-foreground/70">AI Support Bot</span>
        </div>
        <div
          suppressHydrationWarning
          className="font-mono text-[11px] tabular-nums text-muted-foreground/70"
        >
          {formatTime(now)}
        </div>
      </div>

      {/* ─── Now block: current event with pulsing accent ─── */}
      <div className="border-b border-border/60 px-5 py-5">
        <div className="font-mono text-[9.5px] uppercase tracking-[0.15em] text-muted-foreground/60">
          сейчас
        </div>
        <div className="mt-3 min-h-[44px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.5, ease }}
              className="flex items-center gap-3"
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${TONE_STYLES[current.tone].bg} ${TONE_STYLES[current.tone].text}`}
              >
                <current.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-medium text-foreground">
                  {current.text}
                </div>
                <div className="mt-0.5 font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted-foreground/60">
                  {current.meta}
                </div>
              </div>
              <motion.div
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                className="h-1.5 w-1.5 rounded-full bg-emerald-500"
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ─── History stream ─── */}
      <div className="px-5 py-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="font-mono text-[9.5px] uppercase tracking-[0.15em] text-muted-foreground/60">
            предыдущие
          </span>
          <span className="font-mono text-[9.5px] text-muted-foreground/40">
            последние 4
          </span>
        </div>
        <div className="relative h-[152px] overflow-hidden">
          <AnimatePresence initial={false}>
            {history.map((ev, i) => (
              <motion.div
                key={ev.id}
                layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1 - i * 0.18, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.5, ease }}
                className="mb-2 flex items-center gap-2.5"
              >
                <div className={`h-1 w-1 shrink-0 rounded-full ${TONE_STYLES[ev.tone].text.replace("text-", "bg-")}`} />
                <div className="min-w-0 flex-1 truncate text-[12px] text-foreground/70">
                  {ev.text}
                </div>
                <div className="shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground/40">
                  {ev.meta}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* ─── Footer: animated counter + sparkline ─── */}
      <div className="flex items-center justify-between gap-4 border-t border-border/60 bg-foreground/[0.02] px-5 py-3.5">
        <div>
          <div className="font-mono text-[9.5px] uppercase tracking-[0.15em] text-muted-foreground/60">
            событий за сегодня
          </div>
          <div className="mt-0.5 flex items-baseline gap-1.5">
            <span className="text-[20px] font-semibold tabular-nums tracking-tight">
              {eventCount.toLocaleString("ru-RU")}
            </span>
            <span className="flex items-center gap-1 text-[10.5px] text-emerald-400">
              <Activity className="h-3 w-3" />
              live
            </span>
          </div>
        </div>
        <svg width={sparkW} height={sparkH} className="text-foreground/30">
          <path
            d={path}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={`${path} L ${sparkW} ${sparkH} L 0 ${sparkH} Z`}
            fill="currentColor"
            opacity="0.08"
          />
        </svg>
      </div>
    </div>
  );
}
