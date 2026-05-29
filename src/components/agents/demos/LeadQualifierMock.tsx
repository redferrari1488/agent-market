"use client";

// LeadQualifierMock — CRM-карта (amoCRM). Агент скоринга лида: «анализирую…» →
// flip числа → счёт 0→87/100 (count-up на setTimeout, не rAF — rAF замирает
// в фоне) → причины stagger. slug: lead-qualifier-amocrm.

import { useEffect, useState } from "react";
import { MONO, SANS, usePhases } from "./shared";

const TARGET = 87;
const REASONS = [
  "Заявка в 23:47 — вне рабочих часов",
  "Указан бюджет 50 000 ₽",
  "5 визитов на сайт за неделю",
];

export function LeadQualifierMock({
  accent,
  reducedMotion,
}: {
  accent: string;
  reducedMotion: boolean;
}) {
  const phase = usePhases([1500, 950, 2000], 2, reducedMotion);
  const scored = phase >= 1;
  const reasonsShow = phase >= 2;
  const [score, setScore] = useState(reducedMotion ? TARGET : 0);

  useEffect(() => {
    if (reducedMotion) return; // init уже = TARGET, count-up не нужен
    if (!scored) {
      // Новый цикл: сбрасываем счёт асинхронно (число всё равно скрыто за
      // «анализирую…»), чтобы следующий count-up снова стартовал с 0.
      const rid = setTimeout(() => setScore(0), 0);
      return () => clearTimeout(rid);
    }
    let cur = 0;
    let alive = true;
    let id: ReturnType<typeof setTimeout>;
    const tick = () => {
      if (!alive) return;
      cur += Math.max(1, Math.ceil((TARGET - cur) / 6));
      if (cur >= TARGET) {
        setScore(TARGET);
        return;
      }
      setScore(cur);
      id = setTimeout(tick, 34);
    };
    id = setTimeout(tick, 34);
    return () => {
      alive = false;
      clearTimeout(id);
    };
  }, [scored, reducedMotion]);

  const R = 42;
  const C = 2 * Math.PI * R;
  const offset = C * (1 - (scored ? TARGET : 0) / 100);

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
      <style>{`@keyframes lqPulse{0%,100%{opacity:.45}50%{opacity:1}}@keyframes lqFlip{from{opacity:0;transform:rotateX(80deg)}to{opacity:1;transform:rotateX(0)}}`}</style>
      <div
        style={{
          width: 300,
          maxWidth: "100%",
          borderRadius: 12,
          background: "#161412",
          overflow: "hidden",
          boxShadow: "0 24px 60px rgba(0,0,0,.55), 0 0 0 8px #0c0b09",
          outline: "1px solid rgba(255,255,255,.06)",
          fontFamily: SANS,
        }}
      >
        <div
          style={{
            background: "#1f1c19",
            padding: "11px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid rgba(255,255,255,.05)",
          }}
        >
          <span
            style={{
              fontFamily: SANS,
              fontSize: 13,
              fontWeight: 700,
              color: "#d8d4cf",
              letterSpacing: ".2px",
            }}
          >
            amoCRM
          </span>
          <span
            style={{
              fontFamily: MONO,
              fontSize: 11,
              color: "#7c8087",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            Сделка #4821
          </span>
        </div>
        <div style={{ padding: "16px 16px 8px" }}>
          <div style={{ fontFamily: SANS, fontSize: 16, fontWeight: 600, color: "#efece8" }}>
            Анна Семёнова
          </div>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 12.5,
              color: "#9aa2a9",
              marginTop: 4,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            +7 (912) 345-67-89
          </div>
          <div
            style={{
              marginTop: 9,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(255,255,255,.05)",
              borderRadius: 6,
              padding: "3px 9px",
            }}
          >
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#9aa2a9" }} />
            <span
              style={{
                fontFamily: MONO,
                fontSize: 10.5,
                color: "#b9b4ad",
                letterSpacing: ".3px",
              }}
            >
              источник · Instagram Ads
            </span>
          </div>
        </div>
        <div
          style={{
            padding: "12px 16px 6px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            borderTop: "1px solid rgba(255,255,255,.05)",
            marginTop: 10,
          }}
        >
          <div
            style={{
              fontFamily: MONO,
              fontSize: 10,
              color: "#7c8087",
              letterSpacing: ".6px",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            AI-оценка лида
          </div>
          <div style={{ position: "relative", width: 110, height: 110 }}>
            <svg width="110" height="110" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="55" cy="55" r={R} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="7" />
              <circle
                cx="55"
                cy="55"
                r={R}
                fill="none"
                stroke={accent}
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={offset}
                style={{
                  transition: reducedMotion
                    ? "none"
                    : "stroke-dashoffset .75s cubic-bezier(.22,.61,.36,1)",
                }}
              />
            </svg>
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {scored ? (
                <div
                  style={{
                    animation: reducedMotion ? "none" : "lqFlip .5s ease both",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      fontFamily: MONO,
                      fontSize: 27,
                      fontWeight: 700,
                      color: "#efece8",
                      fontVariantNumeric: "tabular-nums",
                      lineHeight: 1,
                    }}
                  >
                    {score}
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 11, color: "#7c8087" }}>/ 100</div>
                </div>
              ) : (
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: 11.5,
                    color: "#9aa2a9",
                    animation: "lqPulse 1.1s ease-in-out infinite",
                  }}
                >
                  анализирую…
                </div>
              )}
            </div>
          </div>
          <div
            style={{
              marginTop: 12,
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              opacity: scored ? 1 : 0,
              transition: "opacity .4s ease",
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: accent }} />
            <span
              style={{
                fontFamily: SANS,
                fontSize: 13,
                fontWeight: 600,
                color: accent,
                letterSpacing: ".2px",
              }}
            >
              горячий
            </span>
          </div>
        </div>
        <div
          style={{
            padding: "14px 16px 18px",
            display: "flex",
            flexDirection: "column",
            gap: 9,
          }}
        >
          {REASONS.map((r, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 9,
                opacity: reasonsShow ? 1 : 0,
                transform: reasonsShow ? "none" : "translateX(-6px)",
                transition: "all .4s ease " + i * 0.12 + "s",
              }}
            >
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 12,
                  color: accent,
                  lineHeight: 1.5,
                  flexShrink: 0,
                }}
              >
                ▸
              </span>
              <span style={{ fontFamily: SANS, fontSize: 12.5, color: "#b9b4ad", lineHeight: 1.45 }}>
                {r}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
