"use client";

// CompetitorMonitorMock — TG-phone. Агент мониторинга цен постит алерт о снижении
// цены у конкурента: typing → карточка → зачёркивание 1500₽ → 1200₽ + −20%.
// slug: competitor-monitor.

import { MONO, SANS, TypingDots, usePhases } from "./shared";

export function CompetitorMonitorMock({
  accent,
  reducedMotion,
}: {
  accent: string;
  reducedMotion: boolean;
}) {
  const phase = usePhases([900, 700, 1600], 2, reducedMotion);
  const showCard = phase >= 1;
  const struck = phase >= 2;

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
      <style>{`@keyframes cmRise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
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
            ⚷
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: "#fff" }}>Price Watch</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.6)" }}>агент · мониторит 24 SKU</div>
          </div>
        </div>
        <div
          className="v3-chat"
          style={{
            padding: "14px 12px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
            minHeight: 280,
          }}
        >
          {!showCard && <TypingDots accent={accent} />}
          {showCard && (
            <div
              style={{
                background: "#182533",
                borderRadius: "4px 14px 14px 14px",
                padding: 12,
                border: "1px solid rgba(255,255,255,.05)",
                animation: reducedMotion ? "none" : "cmRise .35s ease both",
              }}
            >
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: 11,
                  color: accent,
                  marginBottom: 11,
                  letterSpacing: ".2px",
                }}
              >
                ⚠ Изменение цены ·{" "}
                <span style={{ color: "rgba(255,255,255,.55)" }}>vendor-x.ru · 2 мин назад</span>
              </div>
              <div
                style={{
                  fontFamily: SANS,
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: "#e8e6e3",
                  marginBottom: 14,
                }}
              >
                Курс по аналитике
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ position: "relative", display: "inline-block" }}>
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: 16,
                      color: "#8a939b",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    1 500 ₽
                  </span>
                  <span
                    style={{
                      position: "absolute",
                      left: -1,
                      right: -1,
                      top: "52%",
                      height: 1.5,
                      background: "#8a939b",
                      transformOrigin: "left",
                      transform: "scaleX(" + (struck ? 1 : 0) + ")",
                      transition: "transform .45s ease",
                    }}
                  />
                </div>
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: 16,
                    color: "#6b7280",
                    opacity: struck ? 1 : 0,
                    transition: "opacity .3s ease .2s",
                  }}
                >
                  ↓
                </span>
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: 20,
                    color: accent,
                    fontWeight: 700,
                    fontVariantNumeric: "tabular-nums",
                    opacity: struck ? 1 : 0,
                    transform: struck ? "translateY(0)" : "translateY(4px)",
                    transition: "all .35s ease .25s",
                  }}
                >
                  1 200 ₽
                </span>
              </div>
              <div
                style={{
                  marginTop: 13,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  opacity: struck ? 1 : 0,
                  transition: "opacity .35s ease .35s",
                }}
              >
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: 13,
                    fontWeight: 700,
                    color: accent,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  −20%
                </span>
                <span style={{ fontFamily: SANS, fontSize: 12, color: "#9aa2a9" }}>
                  дешевле нашего на 300 ₽
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
