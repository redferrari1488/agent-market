"use client";

// CallAnalyticsMock — TG-phone. Агент скоринга звонков постит карточку анализа:
// typing → карточка → бары заполняются 0→7/10 и 0→3/10 + детали проявляются.
// slug: call-analytics-roistat.

import { MONO, SANS, TypingDots, usePhases } from "./shared";

function Meter({
  label,
  value,
  max,
  accent,
  fill,
}: {
  label: string;
  value: number;
  max: number;
  accent: string;
  fill: boolean;
}) {
  const pct = (value / max) * 100;
  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 6,
        }}
      >
        <span style={{ fontFamily: SANS, fontSize: 12.5, color: "#cfd6dd" }}>{label}</span>
        <span
          style={{
            fontFamily: MONO,
            fontSize: 12.5,
            color: "#fff",
            fontVariantNumeric: "tabular-nums",
            fontWeight: 600,
          }}
        >
          {value}/{max}
        </span>
      </div>
      <div
        style={{
          height: 6,
          borderRadius: 99,
          background: "rgba(255,255,255,.08)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            borderRadius: 99,
            background: accent,
            width: (fill ? pct : 0) + "%",
            transition: "width 800ms cubic-bezier(.22,.61,.36,1)",
          }}
        />
      </div>
    </div>
  );
}

export function CallAnalyticsMock({
  accent,
  reducedMotion,
}: {
  accent: string;
  reducedMotion: boolean;
}) {
  const phase = usePhases([950, 520, 1500], 2, reducedMotion);
  const showCard = phase >= 1;
  const fill = phase >= 2;
  const showDetail = phase >= 2;

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
      <style>{`@keyframes caRise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
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
            ⌁
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: "#fff" }}>Call Analyst</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.6)" }}>агент · онлайн</div>
          </div>
        </div>
        <div
          className="v3-chat"
          style={{
            padding: "14px 12px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
            minHeight: 300,
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
                animation: reducedMotion ? "none" : "caRise .35s ease both",
              }}
            >
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: 11,
                  color: accent,
                  marginBottom: 10,
                  letterSpacing: ".2px",
                }}
              >
                <span style={{ color: accent }}>● </span>
                Roistat → Анализ готов ·{" "}
                <span style={{ color: "rgba(255,255,255,.5)" }}>4:23</span>
              </div>
              <Meter label="Тон менеджера" value={7} max={10} accent={accent} fill={fill} />
              <Meter label="Заинтересованность" value={3} max={10} accent={accent} fill={fill} />
              <div
                style={{
                  fontFamily: SANS,
                  fontSize: 12,
                  color: "#aeb6bd",
                  fontStyle: "italic",
                  borderLeft: "2px solid " + accent,
                  paddingLeft: 9,
                  margin: "12px 0 10px",
                  opacity: showDetail ? 1 : 0,
                  transition: "opacity .4s ease .15s",
                }}
              >
                «…а сколько это будет стоить в итоге?» — клиент, 03:51
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  fontFamily: SANS,
                  fontSize: 12.5,
                  color: "#e8e6e3",
                  fontWeight: 600,
                  opacity: showDetail ? 1 : 0,
                  transition: "opacity .4s ease .25s",
                }}
              >
                <span style={{ color: accent, fontFamily: MONO }}>✓</span>
                Упустил вопрос о цене
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
