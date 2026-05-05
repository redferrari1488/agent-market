"use client";

import { useState } from "react";
import { useLiveLog, LogFeed, ActivityTicker } from "./FlowHorizontal";
import "./cockpit-landing.css";

type Agent = {
  id: string;
  name: string;
  cat: string;
  status: "running" | "paused";
  accent: boolean;
};

const AGENTS: Agent[] = [
  {
    id: "support",
    name: "Поддержка клиентов",
    cat: "поддержка · telegram",
    status: "running",
    accent: true,
  },
  {
    id: "content",
    name: "Контент-копирайтер",
    cat: "контент · еженедельно",
    status: "running",
    accent: false,
  },
  {
    id: "digest",
    name: "Дайджест новостей",
    cat: "новости · ленты",
    status: "paused",
    accent: false,
  },
];

export function HeroCockpit() {
  const [activeId, setActiveId] = useState("support");
  const active = AGENTS.find((a) => a.id === activeId)!;
  const lines = useLiveLog(undefined, 2200, 24);

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
        {/* status bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 16px",
            borderBottom: "1px solid var(--hc-line-1)",
            background: "var(--hc-bg-2)",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span
              className="hf-mono"
              style={{
                fontSize: 10,
                color: "var(--hc-fg-3)",
                textTransform: "uppercase",
                letterSpacing: "0.16em",
              }}
            >
              hireon · cockpit
            </span>
            <span
              style={{ width: 1, height: 10, background: "var(--hc-line-2)" }}
            />
            <span
              className="hf-mono"
              style={{ fontSize: 10, color: "var(--hc-fg-2)" }}
            >
              workspace / hireon-demo
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <ActivityTicker />
            <span
              className="hf-mono"
              style={{
                fontSize: 9.5,
                color: "var(--hc-fg-3)",
                textTransform: "uppercase",
                letterSpacing: "0.14em",
              }}
            >
              build 2026.05 · регион eu-1
            </span>
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
              <a
                href="/agents"
                className="hf-btn"
                style={{
                  marginTop: 6,
                  alignSelf: "flex-start",
                  textDecoration: "none",
                }}
              >
                каталог
              </a>
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
                flexWrap: "wrap",
              }}
            >
              <div style={{ minWidth: 0 }}>
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
                      color: "var(--hc-cyan)",
                      textTransform: "uppercase",
                      letterSpacing: "0.16em",
                    }}
                  >
                    в&nbsp;работе · 14 дней
                  </span>
                </div>
                <div
                  className="hf-section"
                  style={{
                    fontSize: 28,
                    color: "var(--hc-fg)",
                    marginBottom: 4,
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

            {/* metrics grid */}
            <div className="hf-metrics-grid">
              <MetricCell
                label="uptime · 30д"
                value="99.94%"
                sub="↑ 0.02 vs prev"
                chart={<Spark data={[97, 98, 98.2, 99.1, 99.4, 99.6, 99.8, 99.94]} />}
              />
              <MetricCell
                label="сообщений · 24ч"
                value="1 284"
                sub="пик 14:20"
                chart={<MiniBars data={[8, 12, 9, 18, 22, 30, 28, 34, 26, 22, 18, 24]} />}
                border
              />
              <MetricCell
                label="avg отклик"
                value="1.2с"
                sub="p95 · 2.4с"
                chart={<Spark data={[1.6, 1.5, 1.4, 1.3, 1.4, 1.2, 1.1, 1.2]} />}
                border
              />
              <MetricCell
                label="успешность"
                value="98.7%"
                sub="34 / 12 847 fail"
                chart={<Spark data={[96, 97, 97.5, 97.8, 98.1, 98.4, 98.6, 98.7]} />}
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
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span
                  className="hf-mono"
                  style={{
                    fontSize: 10,
                    color: "var(--hc-fg-2)",
                    textTransform: "uppercase",
                    letterSpacing: "0.16em",
                  }}
                >
                  live · stdout
                </span>
                <span
                  style={{
                    width: 1,
                    height: 10,
                    background: "var(--hc-line-2)",
                  }}
                />
                <span
                  className="hf-mono"
                  style={{ fontSize: 10, color: "var(--hc-fg-3)" }}
                >
                  tail -f /agents/support.log
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span
                  className="hf-pulse"
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "var(--hc-cyan)",
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
                  streaming
                </span>
              </div>
            </div>

            <LogFeed lines={lines} height={280} dense={false} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusDot({
  status,
  accent,
}: {
  status: "running" | "paused";
  accent: boolean;
}) {
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
      }}
    />
  );
}

function AgentRow({
  a,
  active,
  onClick,
}: {
  a: Agent;
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
    <svg width={w} height={h} style={{ display: "block" }}>
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
  const max = Math.max(...data);
  const bw = w / data.length - 2;
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
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
