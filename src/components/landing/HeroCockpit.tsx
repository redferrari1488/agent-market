"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import "./cockpit-landing.css";

type Status = "running" | "paused";

type MetricSeries = {
  uptime: { value: string; sub: string; data: number[] };
  messages: { value: string; sub: string; data: number[] };
  avg: { value: string; sub: string; data: number[] };
  success: { value: string; sub: string; data: number[] };
};

type LogTpl = [string, string];

type AgentDef = {
  id: string;
  name: string;
  cat: string;
  status: Status;
  accent: boolean;
  sinceDays: number;
  logFile: string;
  metrics: MetricSeries;
  logSeed: { t: string; tag: string; msg: string }[];
  logGen: LogTpl[];
};

const AGENTS: AgentDef[] = [
  {
    id: "support",
    name: "Поддержка клиентов",
    cat: "поддержка · telegram",
    status: "running",
    accent: true,
    sinceDays: 14,
    logFile: "support.log",
    metrics: {
      uptime: {
        value: "99.94%",
        sub: "↑ 0.02 vs prev",
        data: [97, 98, 98.2, 99.1, 99.4, 99.6, 99.8, 99.94],
      },
      messages: {
        value: "1 284",
        sub: "пик 14:20",
        data: [8, 12, 9, 18, 22, 30, 28, 34, 26, 22, 18, 24],
      },
      avg: {
        value: "1.2с",
        sub: "p95 · 2.4с",
        data: [1.6, 1.5, 1.4, 1.3, 1.4, 1.2, 1.1, 1.2],
      },
      success: {
        value: "98.7%",
        sub: "34 / 12 847 fail",
        data: [96, 97, 97.5, 97.8, 98.1, 98.4, 98.6, 98.7],
      },
    },
    logSeed: [
      { t: "12:04:58", tag: "INTAKE", msg: "msg @ivan_k · routed → support" },
      { t: "12:05:01", tag: "REPLY", msg: "response sent · 1.4s · gpt-tier-2" },
      { t: "12:05:03", tag: "CRM", msg: "updated #4821 · amoCRM" },
      { t: "12:05:07", tag: "INTAKE", msg: "msg @marina_w · routed → qualify" },
      { t: "12:05:09", tag: "TOOL", msg: "calendar.book · slot=вт 15:30" },
      { t: "12:05:14", tag: "REPLY", msg: "response sent · 0.9s · gpt-tier-2" },
      { t: "12:05:18", tag: "CRM", msg: "enriched · score 84" },
      { t: "12:05:22", tag: "INTAKE", msg: "msg @lebedev · routed → reject" },
    ],
    logGen: [
      ["REPLY", "response sent · 1.{r}s · gpt-tier-2"],
      ["INTAKE", "msg @{n} · routed → {q}"],
      ["CRM", "updated #{rec} · amoCRM"],
      ["TOOL", "telegram.notify · #support-warm"],
      ["CRM", "enriched · score {s}"],
    ],
  },
  {
    id: "content",
    name: "Контент-копирайтер",
    cat: "контент · еженедельно",
    status: "running",
    accent: false,
    sinceDays: 21,
    logFile: "content.log",
    metrics: {
      uptime: {
        value: "99.81%",
        sub: "↓ 0.03 vs prev",
        data: [99.7, 99.8, 99.85, 99.9, 99.82, 99.8, 99.81, 99.81],
      },
      messages: {
        value: "342",
        sub: "пик пн 09:00",
        data: [4, 12, 28, 22, 14, 8, 6, 18, 24, 20, 12, 10],
      },
      avg: {
        value: "4.6с",
        sub: "p95 · 8.1с",
        data: [5.2, 5.0, 4.8, 4.7, 4.9, 4.6, 4.5, 4.6],
      },
      success: {
        value: "99.4%",
        sub: "2 / 342 fail",
        data: [98.8, 99.0, 99.1, 99.2, 99.3, 99.4, 99.4, 99.4],
      },
    },
    logSeed: [
      { t: "09:00:12", tag: "DRAFT", msg: "брифа · 6 источников · структура ok" },
      { t: "09:00:48", tag: "WRITE", msg: "черновик #128 · 1820 слов · 11.2с" },
      { t: "09:01:14", tag: "EDIT", msg: "стиль ok · читаемость 78" },
      { t: "09:01:35", tag: "PUBLISH", msg: "telegram-канал · @hireon_blog" },
      { t: "09:02:02", tag: "DRAFT", msg: "брифа · 4 источника · структура ok" },
      { t: "09:02:31", tag: "WRITE", msg: "черновик #129 · 940 слов · 6.4с" },
      { t: "09:02:55", tag: "EDIT", msg: "стиль ok · читаемость 82" },
      { t: "09:03:18", tag: "PUBLISH", msg: "блог · /posts/digest-21" },
    ],
    logGen: [
      ["DRAFT", "брифа · {bs} источников · структура ok"],
      ["WRITE", "черновик #{rec} · {wc} слов · {r}.{s}с"],
      ["EDIT", "стиль ok · читаемость {pct}"],
      ["PUBLISH", "telegram-канал · @hireon_blog"],
      ["PUBLISH", "блог · /posts/digest-{rec}"],
    ],
  },
  {
    id: "digest",
    name: "Дайджест новостей",
    cat: "новости · ленты",
    status: "paused",
    accent: false,
    sinceDays: 9,
    logFile: "digest.log",
    metrics: {
      uptime: {
        value: "—",
        sub: "на паузе 2д",
        data: [99.4, 99.4, 99.3, 99.2, 0, 0, 0, 0],
      },
      messages: {
        value: "0",
        sub: "→ возобновить",
        data: [12, 14, 10, 18, 0, 0, 0, 0, 0, 0, 0, 0],
      },
      avg: {
        value: "—",
        sub: "—",
        data: [2.1, 2.0, 1.9, 2.0, 0, 0, 0, 0],
      },
      success: {
        value: "99.1%",
        sub: "last week",
        data: [98.7, 98.9, 99.0, 99.1, 99.1, 99.1, 99.1, 99.1],
      },
    },
    logSeed: [
      { t: "вт 18:42", tag: "FETCH", msg: "rss · 12 лент · 84 материала" },
      { t: "вт 18:43", tag: "RANK", msg: "topN=10 · score-min 0.61" },
      { t: "вт 18:44", tag: "WRITE", msg: "summary · 720 слов · 4.1с" },
      { t: "вт 18:45", tag: "PUBLISH", msg: "email · 412 подписчиков" },
      { t: "вт 18:45", tag: "PAUSE", msg: "оператор поставил на паузу" },
    ],
    logGen: [],
  },
];

const NAMES = [
  "ivan_k",
  "marina_w",
  "lebedev",
  "anna_p",
  "t.berg",
  "luiza_r",
  "morozov",
  "d.park",
  "s.lin",
  "aoki",
];
const QUEUES = ["support", "qualify", "book", "reject"];

function pad2(n: number) {
  return String(n).padStart(2, "0");
}
function fmtClock(d: Date) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

function fillTpl(tpl: string) {
  return tpl
    .replace("{r}", String(Math.floor(Math.random() * 9)))
    .replace("{s}", String(Math.floor(Math.random() * 9)))
    .replace("{n}", NAMES[Math.floor(Math.random() * NAMES.length)])
    .replace("{q}", QUEUES[Math.floor(Math.random() * QUEUES.length)])
    .replace("{rec}", String(4820 + Math.floor(Math.random() * 80)))
    .replace("{wc}", String(600 + Math.floor(Math.random() * 1400)))
    .replace("{bs}", String(3 + Math.floor(Math.random() * 6)))
    .replace("{pct}", String(70 + Math.floor(Math.random() * 28)));
}

type Line = { t: string; tag: string; msg: string };

function genLine(gens: LogTpl[]): Line {
  if (gens.length === 0) {
    return { t: fmtClock(new Date()), tag: "—", msg: "agent paused" };
  }
  const [tag, tpl] = gens[Math.floor(Math.random() * gens.length)];
  return { t: fmtClock(new Date()), tag, msg: fillTpl(tpl) };
}

export function HeroCockpit() {
  const [activeId, setActiveId] = useState("support");
  const active = AGENTS.find((a) => a.id === activeId)!;

  return (
    <div className="hireon-hero">
      <div
        style={{
          border: "1px solid var(--hc-line-2)",
          borderRadius: "var(--hc-r)",
          overflow: "hidden",
          background: "var(--hc-bg-1)",
          boxShadow: "0 1px 0 rgba(255,255,255,0.03) inset",
        }}
      >
        {/* status bar — стабильная высота, без flexWrap */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 16px",
            borderBottom: "1px solid var(--hc-line-1)",
            background: "var(--hc-bg-2)",
            gap: 12,
            minHeight: 40,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              minWidth: 0,
              flex: 1,
              overflow: "hidden",
            }}
          >
            <span
              className="hf-mono"
              style={{
                fontSize: 10,
                color: "var(--hc-fg-3)",
                textTransform: "uppercase",
                letterSpacing: "0.16em",
                whiteSpace: "nowrap",
              }}
            >
              hireon · cockpit
            </span>
            <span
              style={{ width: 1, height: 10, background: "var(--hc-line-2)", flexShrink: 0 }}
            />
            <span
              className="hf-mono"
              style={{
                fontSize: 10,
                color: "var(--hc-fg-2)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              workspace / hireon-demo
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              flexShrink: 0,
            }}
          >
            <ActivityTicker />
          </div>
        </div>

        <div className="hf-hero-grid">
          {/* sidebar */}
          <div
            style={{
              borderRight: "1px solid var(--hc-line-1)",
              background: "var(--hc-bg-1)",
            }}
          >
            <div
              style={{
                padding: "18px 14px 10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span className="hf-eyebrow">ваши агенты · 3</span>
              <span
                className="hf-mono"
                style={{ fontSize: 10, color: "var(--hc-fg-3)" }}
              >
                ↵ новый
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", paddingBottom: 8 }}>
              {AGENTS.map((a) => (
                <AgentRow
                  key={a.id}
                  a={a}
                  active={a.id === activeId}
                  onClick={() => setActiveId(a.id)}
                />
              ))}
            </div>
            <div style={{ height: 1, background: "var(--hc-line-1)" }} />
            <div
              style={{
                padding: "14px",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <div className="hf-eyebrow">маркетплейс</div>
              <div
                style={{ fontSize: 12, color: "var(--hc-fg-1)", lineHeight: 1.45 }}
              >
                42 новых агента в этом месяце
              </div>
              <Link
                href="/agents"
                className="hf-btn"
                style={{
                  marginTop: 6,
                  alignSelf: "flex-start",
                  textDecoration: "none",
                }}
              >
                каталог
              </Link>
            </div>
          </div>

          {/* main pane */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              minWidth: 0,
            }}
          >
            {/* header */}
            <div
              style={{
                padding: "18px 22px",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 24,
                borderBottom: "1px solid var(--hc-line-1)",
                minHeight: 96,
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 6,
                  }}
                >
                  <StatusDot status={active.status} accent={active.accent} />
                  <span
                    className="hf-mono"
                    style={{
                      fontSize: 10,
                      color:
                        active.status === "running"
                          ? "var(--hc-cyan)"
                          : "var(--hc-fg-3)",
                      textTransform: "uppercase",
                      letterSpacing: "0.16em",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {active.status === "running"
                      ? `в работе · ${active.sinceDays} дней`
                      : "на паузе"}
                  </span>
                </div>
                <div
                  className="hf-section"
                  style={{
                    fontSize: 28,
                    color: "var(--hc-fg)",
                    marginBottom: 4,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {active.name}
                </div>
                <div
                  className="hf-mono"
                  style={{
                    fontSize: 11,
                    color: "var(--hc-fg-2)",
                    textTransform: "uppercase",
                    letterSpacing: "0.14em",
                  }}
                >
                  {active.cat}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button className="hf-btn">остановить</button>
                <button className="hf-btn">рестарт</button>
                <button className="hf-btn">настройки</button>
              </div>
            </div>

            {/* metrics grid — пересоздаются на смене агента */}
            <div className="hf-metrics-grid" key={`metrics-${activeId}`}>
              <MetricCell
                label="uptime · 30д"
                value={active.metrics.uptime.value}
                sub={active.metrics.uptime.sub}
                chart={<Spark data={active.metrics.uptime.data} />}
              />
              <MetricCell
                label="сообщений · 24ч"
                value={active.metrics.messages.value}
                sub={active.metrics.messages.sub}
                chart={<MiniBars data={active.metrics.messages.data} />}
                border
              />
              <MetricCell
                label="avg отклик"
                value={active.metrics.avg.value}
                sub={active.metrics.avg.sub}
                chart={<Spark data={active.metrics.avg.data} />}
                border
              />
              <MetricCell
                label="успешность"
                value={active.metrics.success.value}
                sub={active.metrics.success.sub}
                chart={<Spark data={active.metrics.success.data} />}
                border
              />
            </div>

            {/* log header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 18px",
                background: "var(--hc-bg-2)",
                borderBottom: "1px solid var(--hc-line-1)",
                gap: 12,
                minHeight: 38,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  minWidth: 0,
                  flex: 1,
                  overflow: "hidden",
                }}
              >
                <span
                  className="hf-mono"
                  style={{
                    fontSize: 10,
                    color: "var(--hc-fg-2)",
                    textTransform: "uppercase",
                    letterSpacing: "0.16em",
                    whiteSpace: "nowrap",
                  }}
                >
                  {active.status === "running" ? "live · stdout" : "log · paused"}
                </span>
                <span
                  style={{
                    width: 1,
                    height: 10,
                    background: "var(--hc-line-2)",
                    flexShrink: 0,
                  }}
                />
                <span
                  className="hf-mono"
                  style={{
                    fontSize: 10,
                    color: "var(--hc-fg-3)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  tail -f /agents/{active.logFile}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  flexShrink: 0,
                }}
              >
                <span
                  className={active.status === "running" ? "hf-pulse" : ""}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background:
                      active.status === "running"
                        ? "var(--hc-cyan)"
                        : "var(--hc-fg-3)",
                    display: "inline-block",
                  }}
                />
                <span
                  className="hf-mono"
                  style={{
                    fontSize: 10,
                    color: "var(--hc-fg-2)",
                    textTransform: "uppercase",
                    letterSpacing: "0.14em",
                  }}
                >
                  {active.status === "running" ? "streaming" : "paused"}
                </span>
              </div>
            </div>

            <LogPanel key={`log-${activeId}`} agent={active} />
          </div>
        </div>
      </div>
    </div>
  );
}

function LogPanel({ agent }: { agent: AgentDef }) {
  const [lines, setLines] = useState<Line[]>(agent.logSeed);

  useEffect(() => {
    if (agent.status !== "running" || agent.logGen.length === 0) return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      if (!alive) return;
      setLines((prev) => {
        const next = [...prev, genLine(agent.logGen)];
        return next.length > 24 ? next.slice(next.length - 24) : next;
      });
      timer = setTimeout(tick, 2200 + Math.random() * 1200);
    };
    timer = setTimeout(tick, 2200);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [agent]);

  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [lines]);

  return (
    <div
      ref={ref}
      className="hf-mono hf-scroll"
      style={{
        height: 280,
        overflowY: "auto",
        overflowX: "hidden",
        background: "var(--hc-bg-0)",
        padding: "14px 18px",
        fontSize: 11.5,
        lineHeight: 1.7,
        color: "var(--hc-fg-1)",
      }}
    >
      {lines.map((l, i) => {
        const last = i === lines.length - 1;
        const isLive = agent.status === "running";
        return (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 14,
              whiteSpace: "nowrap",
              opacity: last
                ? 1
                : Math.max(0.45, 1 - (lines.length - 1 - i) * 0.04),
            }}
          >
            <span style={{ color: "var(--hc-fg-3)", flexShrink: 0 }}>{l.t}</span>
            <span
              style={{
                color: "var(--hc-fg-2)",
                width: 64,
                flexShrink: 0,
                display: "inline-block",
              }}
            >
              {l.tag}
            </span>
            <span style={{ color: "var(--hc-ok)", flexShrink: 0 }}>✓</span>
            <span
              style={{
                color: last ? "var(--hc-fg)" : "var(--hc-fg-1)",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {l.msg}
              {last && isLive && (
                <span
                  className="hf-caret"
                  style={{
                    background: "var(--hc-cyan)",
                    width: 7,
                    height: 12,
                    marginLeft: 4,
                    verticalAlign: "-1px",
                  }}
                />
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function ActivityTicker() {
  const [n, setN] = useState(12847);
  useEffect(() => {
    const t = setInterval(
      () => setN((v) => v + Math.floor(Math.random() * 4) + 1),
      1400,
    );
    return () => clearInterval(t);
  }, []);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: 10,
      }}
    >
      <span
        className="hf-pulse"
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: "var(--hc-cyan)",
          display: "inline-block",
          alignSelf: "center",
        }}
      />
      <span
        className="hf-mono hf-num"
        style={{
          fontSize: 13,
          color: "var(--hc-fg)",
          minWidth: 60,
          textAlign: "right",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {n.toLocaleString("ru-RU")}
      </span>
      <span
        className="hf-mono"
        style={{
          fontSize: 10,
          color: "var(--hc-fg-3)",
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          whiteSpace: "nowrap",
        }}
      >
        событий · сегодня
      </span>
    </div>
  );
}

function StatusDot({ status, accent }: { status: Status; accent: boolean }) {
  const c =
    status === "running"
      ? accent
        ? "var(--hc-cyan)"
        : "var(--hc-fg)"
      : "var(--hc-fg-3)";
  return (
    <span
      className={status === "running" ? "hf-pulse" : ""}
      style={{
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: c,
        display: "inline-block",
        flexShrink: 0,
      }}
    />
  );
}

function AgentRow({
  a,
  active,
  onClick,
}: {
  a: AgentDef;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        all: "unset",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 14px",
        borderLeft: active
          ? "2px solid var(--hc-cyan)"
          : "2px solid transparent",
        background: active ? "rgba(255,255,255,0.025)" : "transparent",
        transition: "background .2s ease",
      }}
    >
      <StatusDot status={a.status} accent={a.accent} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: active ? "var(--hc-fg)" : "var(--hc-fg-1)",
            letterSpacing: "-0.01em",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {a.name}
        </div>
        <div
          className="hf-mono"
          style={{
            fontSize: 10,
            color: "var(--hc-fg-3)",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            marginTop: 2,
          }}
        >
          {a.cat}
        </div>
      </div>
      <span
        className="hf-mono"
        style={{
          fontSize: 9.5,
          color: "var(--hc-fg-3)",
          textTransform: "uppercase",
          letterSpacing: "0.14em",
          flexShrink: 0,
        }}
      >
        {a.status === "running" ? "running" : "paused"}
      </span>
    </button>
  );
}

function MetricCell({
  label,
  value,
  sub,
  chart,
  border,
}: {
  label: string;
  value: string;
  sub?: string;
  chart?: React.ReactNode;
  border?: boolean;
}) {
  return (
    <div
      style={{
        padding: "18px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        minHeight: 96,
        borderLeft: border ? "1px solid var(--hc-line-1)" : "none",
        minWidth: 0,
      }}
    >
      <div className="hf-eyebrow">{label}</div>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <div
          className="hf-num"
          style={{
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            fontFamily: "var(--font-manrope), 'Manrope', system-ui, sans-serif",
            color: "var(--hc-fg)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {value}
        </div>
        {chart}
      </div>
      {sub && (
        <div
          className="hf-mono"
          style={{
            fontSize: 10,
            color: "var(--hc-fg-3)",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

function Spark({
  data,
  w = 120,
  h = 28,
}: {
  data: number[];
  w?: number;
  h?: number;
}) {
  const max = Math.max(...data),
    min = Math.min(...data);
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / (max - min || 1)) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} style={{ display: "block", flexShrink: 0 }}>
      <polyline
        points={pts}
        fill="none"
        stroke="var(--hc-cyan)"
        strokeWidth={1.25}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MiniBars({
  data,
  w = 140,
  h = 34,
}: {
  data: number[];
  w?: number;
  h?: number;
}) {
  const max = Math.max(...data, 1);
  const bw = w / data.length - 2;
  return (
    <svg width={w} height={h} style={{ display: "block", flexShrink: 0 }}>
      {data.map((v, i) => {
        const bh = Math.max(1, (v / max) * (h - 2));
        const x = i * (bw + 2);
        const y = h - bh;
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={bw}
            height={bh}
            fill={i === data.length - 1 ? "var(--hc-cyan)" : "var(--hc-fg-2)"}
          />
        );
      })}
    </svg>
  );
}
