"use client";

// WebsiteMonitorMock — TG-phone. Агент аптайма шлёт алерт о падении сайта:
// typing → 503 (красный, не accent — по спеке) → uptime-график рисуется слева
// направо (29 зелёных точек + 1 красный обрыв). slug: website-monitor.

import { MONO, SANS, TypingDots, usePhases } from "./shared";

const RED = "#ef4444";

// 29 «здоровых» точек + 1 красный обрыв, детерминированно.
const STEP = 8.6;
const GREEN: [number, number][] = [];
for (let i = 0; i < 29; i++) {
  GREEN.push([i * STEP, 22 + Math.sin(i * 1.3) * 4 + (i % 3) * 1.4]);
}
const BREAK: [number, number] = [29 * STEP, 56];
const greenPath = "M " + GREEN.map((p) => p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" L ");
const redPath =
  "M " +
  GREEN[28][0].toFixed(1) +
  " " +
  GREEN[28][1].toFixed(1) +
  " L " +
  BREAK[0].toFixed(1) +
  " " +
  BREAK[1].toFixed(1);

export function WebsiteMonitorMock({
  accent,
  reducedMotion,
}: {
  accent: string;
  reducedMotion: boolean;
}) {
  const phase = usePhases([900, 520, 1900], 2, reducedMotion);
  const showCard = phase >= 1;
  const drawn = phase >= 2;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 12,
      }}
    >
      <style>{`@keyframes wmRise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes wmPing{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
      <div
        style={{
          width: 290,
          maxWidth: "100%",
          borderRadius: 26,
          background: "#0e1621",
          overflow: "hidden",
          boxShadow: "0 24px 60px rgba(0,0,0,.55), 0 0 0 8px #0c0b09",
          outline: "1px solid rgba(255,255,255,.06)",
          fontFamily: SANS,
        }}
      >
        <div
          style={{
            background: "#2b5278",
            padding: "11px 14px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              flexShrink: 0,
              background: "rgba(255,255,255,.16)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: MONO,
              fontSize: 13,
              color: "#fff",
            }}
          >
            ↑
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: "#fff" }}>Uptime Watch</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.6)" }}>агент · пинг каждые 30 сек</div>
          </div>
        </div>
        <div
          className="v3-chat"
          style={{
            padding: "14px 12px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
            minHeight: 290,
          }}
        >
          {!showCard && <TypingDots accent={accent} />}
          {showCard && (
            <div
              style={{
                background: "#182533",
                borderRadius: "4px 14px 14px 14px",
                padding: 13,
                border: "1px solid rgba(255,255,255,.05)",
                animation: reducedMotion ? "none" : "wmRise .35s ease both",
              }}
            >
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: 11,
                  color: RED,
                  marginBottom: 11,
                  letterSpacing: ".2px",
                }}
              >
                ⚠ Сайт упал · <span style={{ color: "rgba(255,255,255,.5)" }}>1 мин назад</span>
              </div>
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: 19,
                  fontWeight: 700,
                  color: "#efece8",
                  letterSpacing: ".3px",
                }}
              >
                hireon.agency
              </div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  marginTop: 9,
                  background: "rgba(239,68,68,.12)",
                  border: "1px solid rgba(239,68,68,.3)",
                  borderRadius: 6,
                  padding: "4px 9px",
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: RED,
                    animation: reducedMotion ? "none" : "wmPing 1.4s ease-in-out infinite",
                  }}
                />
                <span style={{ fontFamily: MONO, fontSize: 11.5, color: RED, fontWeight: 600 }}>
                  503 Service Unavailable
                </span>
              </div>
              <div style={{ marginTop: 16 }}>
                <svg viewBox="0 0 256 66" width="100%" style={{ display: "block", overflow: "visible" }}>
                  <line
                    x1="0"
                    y1="44"
                    x2="256"
                    y2="44"
                    stroke="rgba(255,255,255,.06)"
                    strokeWidth="1"
                    strokeDasharray="3 4"
                  />
                  <path
                    d={greenPath}
                    fill="none"
                    stroke="#42c767"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    pathLength="100"
                    strokeDasharray="100"
                    strokeDashoffset={drawn ? 0 : 100}
                    style={{ transition: reducedMotion ? "none" : "stroke-dashoffset 1.2s linear" }}
                  />
                  <path
                    d={redPath}
                    fill="none"
                    stroke={RED}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    pathLength="100"
                    strokeDasharray="100"
                    strokeDashoffset={drawn ? 0 : 100}
                    style={{ transition: reducedMotion ? "none" : "stroke-dashoffset .3s linear 1.2s" }}
                  />
                  <circle
                    cx={BREAK[0]}
                    cy={BREAK[1]}
                    r="3.2"
                    fill={RED}
                    opacity={drawn ? 1 : 0}
                    style={{ transition: "opacity .2s ease 1.45s" }}
                  />
                </svg>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                <span style={{ fontFamily: MONO, fontSize: 10, color: "#5b6570" }}>−24 ч</span>
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: 11,
                    color: "#9aa2a9",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  Uptime 24ч: <span style={{ color: "#dfe3e7", fontWeight: 600 }}>98.7%</span>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
