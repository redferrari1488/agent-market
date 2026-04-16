"use client";

import { useEffect, useState } from "react";
import {
  MessageSquare,
  PenTool,
  Activity,
  Circle,
  Square,
  RotateCw,
  Bell,
  ChevronRight,
} from "lucide-react";

/* ── Activity feed items ── */
const ACTIVITY = [
  { time: "just now", text: "Ответил @anna_k за 1.4s", agent: "Support Bot", type: "reply" as const },
  { time: "2m ago", text: "Пост опубликован в канал", agent: "Content Writer", type: "publish" as const },
  { time: "8m ago", text: "Ответил @dmitry за 1.1s", agent: "Support Bot", type: "reply" as const },
  { time: "14m ago", text: "Сгенерирован пост #47", agent: "Content Writer", type: "publish" as const },
  { time: "1h ago", text: "Обнаружено изменение: competitor.ru/pricing", agent: "Competitor Mon.", type: "alert" as const },
];

/* ── Log lines for the selected agent ── */
const LOG_LINES = [
  { ts: "12:04:21", text: "агент запущен" },
  { ts: "12:04:22", text: "подключение к каналу  @support_bot" },
  { ts: "12:04:58", text: "новое сообщение  от @anna_k" },
  { ts: "12:05:01", text: "ответ отправлен  @anna_k  за 1.4с" },
  { ts: "12:05:01", text: "статус: доставлено" },
  { ts: "12:06:12", text: "новое сообщение  от @dmitry" },
  { ts: "12:06:14", text: "ответ отправлен  @dmitry  за 1.1с" },
  { ts: "12:06:14", text: "статус: доставлено" },
  { ts: "12:07:33", text: "проверка  всё работает  4ч 22мин" },
];

/* ── Agent sidebar data ── */
const AGENTS = [
  {
    name: "AI Support Bot",
    icon: MessageSquare,
    status: "running" as const,
    category: "Поддержка",
    messages: "1,247",
    uptime: "4ч 22м",
  },
  {
    name: "Content Writer",
    icon: PenTool,
    status: "running" as const,
    category: "Контент",
    messages: "47 постов",
    uptime: "12ч 05м",
  },
  {
    name: "Competitor Monitor",
    icon: Activity,
    status: "paused" as const,
    category: "Мониторинг",
    messages: "-",
    uptime: "-",
  },
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
      logCount === 0 ? 600 : 500 + Math.random() * 400,
    );
    return () => clearTimeout(t);
  }, [logCount]);

  const selected = AGENTS[0];

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-[#0b0b0f] shadow-2xl shadow-black/50">
      {/* ── Title bar ── */}
      <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-2.5">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
          <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
          <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
        </div>
        <div className="ml-2 flex-1 rounded-md bg-white/[0.04] px-3 py-0.5 text-[11px] text-white/30">
          agentmarket.ru/dashboard
        </div>
        <div className="relative">
          <Bell className="h-3.5 w-3.5 text-white/20" />
          <span className="absolute -right-1 -top-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-emerald-400 text-[6px] font-bold text-black">3</span>
        </div>
      </div>

      <div className="flex">
        {/* ── Sidebar: My Agents ── */}
        <div className="hidden w-[200px] shrink-0 border-r border-white/[0.06] sm:block">
          <div className="px-3 pt-4 pb-2 text-[10px] font-medium uppercase tracking-widest text-white/25">
            Мои агенты
          </div>

          {AGENTS.map((a) => (
            <div
              key={a.name}
              className={`mx-2 mb-0.5 rounded-lg px-2.5 py-2 ${a.name === selected.name ? "bg-white/[0.06]" : ""}`}
            >
              <div className="flex items-center gap-2">
                <a.icon className={`h-3.5 w-3.5 shrink-0 ${a.name === selected.name ? "text-white" : "text-white/30"}`} />
                <span className={`truncate text-[12px] ${a.name === selected.name ? "font-medium text-white" : "text-white/40"}`}>
                  {a.name}
                </span>
                <Circle
                  className={`ml-auto h-2 w-2 shrink-0 ${
                    a.status === "running"
                      ? "fill-emerald-400 text-emerald-400"
                      : "fill-white/15 text-white/15"
                  }`}
                />
              </div>
              {a.name === selected.name && (
                <div className="ml-[22px] mt-1 space-y-0.5 text-[10px] text-white/30">
                  <div>{a.category} · {a.uptime}</div>
                </div>
              )}
            </div>
          ))}

          {/* ── Sidebar: Activity Feed ── */}
          <div className="mt-3 border-t border-white/[0.06] px-3 pt-3">
            <div className="text-[10px] font-medium uppercase tracking-widest text-white/25">
              Последние события
            </div>
            <div className="mt-2 space-y-2">
              {ACTIVITY.slice(0, 4).map((ev, i) => (
                <div key={i} className="group">
                  <div className="flex items-start gap-1.5">
                    <div className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${
                      ev.type === "alert" ? "bg-amber-400" : "bg-emerald-400/60"
                    }`} />
                    <div className="min-w-0">
                      <div className="truncate text-[10px] text-white/50">{ev.text}</div>
                      <div className="text-[9px] text-white/20">{ev.agent} · {ev.time}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Main content ── */}
        <div className="flex-1 min-w-0">
          {/* Agent header */}
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3 sm:px-5">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-medium text-white truncate">AI Support Bot</div>
                <div className="text-[11px] text-white/30">Поддержка · 1,247 сообщений · 4ч 22м</div>
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

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-white/[0.06]">
            {[
              { label: "Время работы", value: "4ч 22м" },
              { label: "Сообщений", value: "1,247" },
              { label: "Ср. ответ", value: "1.2с" },
              { label: "Успешно", value: "99.2%" },
            ].map((s) => (
              <div key={s.label} className="px-4 py-2.5 sm:px-5">
                <div className="text-[10px] text-white/25">{s.label}</div>
                <div className="mt-0.5 text-[13px] font-medium text-white/80">{s.value}</div>
              </div>
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-2 sm:px-5">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.08] px-2.5 py-1 text-[11px] text-white/50"
            >
              <Square className="h-2.5 w-2.5" />
              Стоп
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.08] px-2.5 py-1 text-[11px] text-white/50"
            >
              <RotateCw className="h-2.5 w-2.5" />
              Перезапуск
            </button>
            <div className="ml-auto flex items-center gap-1 text-[11px] text-white/25">
              <span>Логи</span>
              <ChevronRight className="h-3 w-3" />
            </div>
          </div>

          {/* Logs */}
          <div className="px-4 py-3 sm:px-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-medium uppercase tracking-widest text-white/25">
                Активность
              </span>
              <span className="flex items-center gap-1 text-[10px] text-emerald-400/60">
                <span className="relative flex h-1 w-1">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
                  <span className="relative inline-flex h-1 w-1 rounded-full bg-emerald-400" />
                </span>
                в реальном времени
              </span>
            </div>
            <div className="h-[130px] overflow-hidden rounded-lg bg-black/30 px-3 py-2.5 font-mono text-[10.5px] leading-[1.7]">
              {LOG_LINES.slice(0, logCount).map((line, i) => (
                <div
                  key={`${logCount}-${i}`}
                  className="text-white/45"
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
