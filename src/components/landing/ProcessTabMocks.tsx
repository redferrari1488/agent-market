"use client";

import {
  MessageSquare,
  PenTool,
  BarChart3,
  Star,
  Search,
  ShieldCheck,
  KeyRound,
  Check,
  Activity,
  Square,
  RotateCw,
} from "lucide-react";

/* ────────────────────────────────────────────────────────────
   SHELL — common window chrome used by every mock
   ──────────────────────────────────────────────────────────── */
function Shell({ url, children }: { url: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-2xl shadow-black/20 dark:shadow-black/50">
      <div className="flex items-center gap-2 border-b border-border/60 px-3.5 py-2">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57] shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.18)]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#febc2e] shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.18)]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#28c840] shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.18)]" />
        </div>
        <div className="ml-1.5 flex-1 truncate rounded-md bg-foreground/[0.04] px-2.5 py-0.5 text-[10.5px] text-muted-foreground/50">
          {url}
        </div>
      </div>
      {children}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   1. CATALOG MOCK — "Выбираете"
   Filter chips, search bar, three agent cards (one highlighted).
   ──────────────────────────────────────────────────────────── */
const CATALOG_AGENTS = [
  {
    name: "AI Support Bot",
    cat: "Поддержка",
    icon: MessageSquare,
    accent: "text-blue-400",
    bg: "bg-blue-500/10",
    rating: "4.9",
    reviews: 128,
    price: "990",
    features: ["Telegram & WhatsApp", "База знаний"],
    highlighted: false,
  },
  {
    name: "Content Writer",
    cat: "Контент",
    icon: PenTool,
    accent: "text-violet-400",
    bg: "bg-violet-500/10",
    rating: "4.8",
    reviews: 64,
    price: "1 490",
    features: ["Посты по графику", "SEO-оптимизация"],
    highlighted: true,
  },
  {
    name: "Analytics Pro",
    cat: "Аналитика",
    icon: BarChart3,
    accent: "text-emerald-400",
    bg: "bg-emerald-500/10",
    rating: "4.7",
    reviews: 41,
    price: "1 290",
    features: ["Отчёты в чат", "Оповещения"],
    highlighted: false,
  },
];

const CATALOG_FILTERS = ["Все", "Поддержка", "Контент", "Аналитика"];

export function CatalogMock() {
  return (
    <Shell url="hireon.agency/agents">
      <div className="flex items-center gap-2 border-b border-border/60 px-3.5 py-2.5">
        <div className="flex flex-1 items-center gap-1.5 rounded-md border border-border/50 bg-background/40 px-2.5 py-1">
          <Search className="h-3 w-3 text-muted-foreground/50" />
          <span className="text-[10.5px] text-muted-foreground/50">поиск агента...</span>
        </div>
        <div className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground/50">
          24 агента
        </div>
      </div>

      <div className="flex gap-1.5 overflow-hidden border-b border-border/60 px-3.5 py-2.5">
        {CATALOG_FILTERS.map((f, i) => (
          <span
            key={f}
            className={
              i === 0
                ? "rounded-md bg-foreground/10 px-2 py-0.5 text-[10.5px] font-medium text-foreground"
                : "rounded-md px-2 py-0.5 text-[10.5px] text-muted-foreground/60"
            }
          >
            {f}
          </span>
        ))}
      </div>

      <div className="space-y-2 p-3">
        {CATALOG_AGENTS.map((a) => (
          <div
            key={a.name}
            className={
              a.highlighted
                ? "relative rounded-lg border border-foreground/30 bg-foreground/[0.03] p-3 ring-1 ring-foreground/10"
                : "relative rounded-lg border border-border/50 bg-background/40 p-3"
            }
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${a.bg} ${a.accent}`}
              >
                <a.icon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="truncate text-[12px] font-medium text-foreground">
                    {a.name}
                  </div>
                  <span className="flex items-center gap-1 text-[10.5px] text-muted-foreground">
                    <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                    <span className="tabular-nums">{a.rating}</span>
                    <span className="text-muted-foreground/60">· {a.reviews}</span>
                  </span>
                </div>
                <div className="mt-0.5 font-mono text-[9.5px] uppercase tracking-[0.1em] text-muted-foreground/60">
                  {a.cat}
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-[14px] font-semibold tracking-tight tabular-nums">
                      {a.price}
                    </span>
                    <span className="text-[10px] text-muted-foreground/70">₽/мес</span>
                  </div>
                  {a.highlighted && (
                    <span className="rounded-md bg-foreground px-2 py-0.5 text-[10px] font-medium text-background">
                      выбрать
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Shell>
  );
}

/* ────────────────────────────────────────────────────────────
   2. SETUP MOCK — "Подключаете"
   Three-step indicator, two masked key fields, progress, action.
   ──────────────────────────────────────────────────────────── */
const SETUP_STEPS = ["Параметры", "Ключи", "Запуск"];

const SETUP_FIELDS = [
  {
    label: "Канал для публикаций",
    value: "@brand_blog",
    filled: true,
  },
  {
    label: "OpenAI API key",
    value: "sk-proj-••••••••••••••u3K2",
    filled: true,
  },
  {
    label: "Тон и стиль",
    value: "экспертный, дружелюбный",
    filled: true,
  },
];

export function SetupMock() {
  return (
    <Shell url="hireon.agency/dashboard/setup">
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-violet-500/10 text-violet-400">
            <PenTool className="h-3.5 w-3.5" />
          </div>
          <div>
            <div className="text-[12px] font-medium text-foreground">Content Writer</div>
            <div className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-muted-foreground/60">
              шаг 2 из 3
            </div>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-md bg-foreground/[0.05] px-2 py-1 text-[10px] text-muted-foreground">
          <ShieldCheck className="h-3 w-3 text-emerald-400" />
          AES-256
        </span>
      </div>

      <div className="flex items-center gap-1.5 border-b border-border/60 px-4 py-3">
        {SETUP_STEPS.map((s, i) => {
          const state = i < 1 ? "done" : i === 1 ? "active" : "todo";
          return (
            <div key={s} className="flex flex-1 items-center gap-1.5">
              <div
                className={
                  state === "done"
                    ? "flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400"
                    : state === "active"
                      ? "flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-foreground text-background"
                      : "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground/50"
                }
              >
                {state === "done" ? (
                  <Check className="h-2.5 w-2.5" strokeWidth={3} />
                ) : (
                  <span className="text-[8.5px] font-bold tabular-nums">{i + 1}</span>
                )}
              </div>
              <span
                className={
                  state === "active"
                    ? "text-[10.5px] font-medium text-foreground"
                    : "text-[10.5px] text-muted-foreground/60"
                }
              >
                {s}
              </span>
              {i < SETUP_STEPS.length - 1 && (
                <div className="ml-1 h-px flex-1 bg-border/60" />
              )}
            </div>
          );
        })}
      </div>

      <div className="space-y-3 px-4 py-4">
        {SETUP_FIELDS.map((f) => (
          <div key={f.label}>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[10.5px] font-medium text-foreground/80">
                {f.label}
              </span>
              {f.filled && (
                <span className="flex items-center gap-1 text-[9.5px] text-emerald-400">
                  <Check className="h-2.5 w-2.5" strokeWidth={3} />
                  принято
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 rounded-md border border-border/50 bg-background/40 px-2.5 py-1.5">
              <KeyRound className="h-3 w-3 shrink-0 text-muted-foreground/50" />
              <span className="truncate font-mono text-[10.5px] text-foreground/70">
                {f.value}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-border/60 px-4 py-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground/60">
            прогресс
          </span>
          <span className="text-[10.5px] font-medium text-foreground/80">67%</span>
        </div>
        <div className="h-[3px] overflow-hidden rounded-full bg-border/60">
          <div className="h-full w-2/3 bg-foreground" />
        </div>
        <div className="mt-3 flex items-center justify-end">
          <span className="rounded-md bg-foreground px-3 py-1 text-[10.5px] font-medium text-background">
            продолжить
          </span>
        </div>
      </div>
    </Shell>
  );
}

/* ────────────────────────────────────────────────────────────
   3. RUNNING MOCK — "Работает"
   Compact dashboard: status, stats row, live log feed.
   ──────────────────────────────────────────────────────────── */
const RUN_STATS = [
  { label: "Время работы", value: "12ч 05м" },
  { label: "Постов", value: "47" },
  { label: "Ср. генерация", value: "3.4с" },
  { label: "Успешно", value: "98.7%" },
];

const RUN_LOGS = [
  { ts: "12:07:33", text: "проверка  всё работает  12ч 05мин" },
  { ts: "12:06:14", text: "опубликован пост #47  @brand_blog" },
  { ts: "12:05:01", text: "сгенерирован черновик  тема: кейсы" },
  { ts: "12:04:22", text: "подключение к каналу  @brand_blog" },
];

export function RunningMock() {
  return (
    <Shell url="hireon.agency/dashboard/agents/content-writer">
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-violet-500/10 text-violet-400">
            <PenTool className="h-3.5 w-3.5" />
          </div>
          <div>
            <div className="text-[12px] font-medium text-foreground">Content Writer</div>
            <div className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-muted-foreground/60">
              контент
            </div>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2 py-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          В работе
        </span>
      </div>

      <div className="grid grid-cols-2 border-b border-border/60 sm:grid-cols-4">
        {RUN_STATS.map((s, i) => (
          <div
            key={s.label}
            className={
              i < RUN_STATS.length - 1
                ? "border-r border-border/40 px-3 py-2.5 last:border-r-0 sm:border-b-0"
                : "px-3 py-2.5"
            }
          >
            <div className="text-[9.5px] text-muted-foreground/60">{s.label}</div>
            <div className="mt-0.5 text-[12.5px] font-medium tabular-nums text-foreground/85">
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1.5 border-b border-border/60 px-4 py-2">
        <span className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
          <Square className="h-2.5 w-2.5" />
          стоп
        </span>
        <span className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
          <RotateCw className="h-2.5 w-2.5" />
          перезапуск
        </span>
        <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-emerald-600/70 dark:text-emerald-400/70">
          <Activity className="h-2.5 w-2.5" />
          в реальном времени
        </span>
      </div>

      <div className="px-4 py-3">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground/60">
            активность
          </span>
          <span className="font-mono text-[9.5px] text-muted-foreground/40">
            последние 4 события
          </span>
        </div>
        <div className="space-y-[3px] rounded-md bg-foreground/[0.03] px-2.5 py-2 font-mono text-[10px] leading-[1.6]">
          {RUN_LOGS.map((l) => (
            <div key={l.ts} className="text-foreground/55">
              <span className="text-muted-foreground/40">{l.ts}</span>{" "}
              {l.text}
            </div>
          ))}
          <span className="inline-block h-2.5 w-[4px] animate-pulse bg-foreground/30" />
        </div>
      </div>
    </Shell>
  );
}

/* ────────────────────────────────────────────────────────────
   ROUTER — pick the mock for the active tab
   ──────────────────────────────────────────────────────────── */
export const PROCESS_MOCKS = [CatalogMock, SetupMock, RunningMock] as const;
