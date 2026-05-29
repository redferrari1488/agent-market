"use client";

// TelegramSupportMock — TG-phone. Агент поддержки отвечает клиенту в живом чате:
// 4 реплики появляются последовательно, между ходами — typing-индикатор с нужной
// стороны. slug: telegram-support-bot. Точки typing — через .v3-dot (Shell).

import { MONO, SANS, usePhases } from "./shared";

type Msg = { who: "client" | "bot"; time: string; text: string };

const MSGS: Msg[] = [
  { who: "client", time: "12:14", text: "Не работает выгрузка отчёта :(" },
  { who: "bot", time: "12:14", text: "В каком формате? (xlsx / csv / pdf)" },
  { who: "client", time: "12:14", text: "csv" },
  {
    who: "bot",
    time: "12:15",
    text: "Понял. Частая причина — пустой фильтр по дате. Проверьте период в правом верхнем углу.",
  },
];

// {n: сколько реплик показано, t: какая сторона печатает}
const FRAMES: { n: number; t: "bot" | "client" | null }[] = [
  { n: 0, t: null },
  { n: 1, t: null },
  { n: 1, t: "bot" },
  { n: 2, t: null },
  { n: 2, t: "client" },
  { n: 3, t: null },
  { n: 3, t: "bot" },
  { n: 4, t: null },
];
const DUR = [450, 950, 1100, 950, 700, 750, 1150, 2000];

function Bubble({ m }: { m: Msg }) {
  const bot = m.who === "bot";
  return (
    <div
      style={{
        alignSelf: bot ? "flex-end" : "flex-start",
        maxWidth: "78%",
        animation: "tsPop .28s ease both",
      }}
    >
      <div
        style={{
          background: bot ? "#2f5378" : "#182533",
          borderRadius: bot ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
          padding: "8px 11px 6px",
          position: "relative",
        }}
      >
        <div
          style={{
            fontFamily: SANS,
            fontSize: 12.5,
            color: bot ? "#eaf1f7" : "#dfe3e7",
            lineHeight: 1.45,
          }}
        >
          {m.text}
        </div>
        <div
          style={{
            fontFamily: MONO,
            fontSize: 9.5,
            color: bot ? "rgba(255,255,255,.5)" : "#5b6570",
            textAlign: "right",
            marginTop: 3,
          }}
        >
          {m.time}
        </div>
      </div>
    </div>
  );
}

export function TelegramSupportMock({
  accent,
  reducedMotion,
}: {
  accent: string;
  reducedMotion: boolean;
}) {
  const phase = usePhases(DUR, 2, reducedMotion);
  const frame = FRAMES[phase];
  const shown = MSGS.slice(0, frame.n);

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
      <style>{`@keyframes tsPop{from{opacity:0;transform:translateY(6px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}`}</style>
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
              position: "relative",
            }}
          >
            <span style={{ fontFamily: MONO, fontSize: 12, color: "#fff" }}>AI</span>
            <span
              style={{
                position: "absolute",
                right: -1,
                bottom: -1,
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "#42c767",
                border: "2px solid #2b5278",
              }}
            />
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: "#fff" }}>Support Bot</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.6)" }}>
              онлайн · отвечает за ~5 сек
            </div>
          </div>
        </div>
        <div
          className="v3-chat"
          style={{
            padding: "14px 12px",
            display: "flex",
            flexDirection: "column",
            gap: 7,
            minHeight: 320,
            justifyContent: "flex-end",
          }}
        >
          {shown.map((m, i) => (
            <Bubble key={i} m={m} />
          ))}
          {frame.t && (
            <div
              style={{
                alignSelf: frame.t === "bot" ? "flex-end" : "flex-start",
                background: frame.t === "bot" ? "#2f5378" : "#182533",
                borderRadius: frame.t === "bot" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                padding: "11px 13px",
                display: "flex",
                gap: 4,
                alignItems: "center",
              }}
            >
              <span className="v3-dot" style={{ background: accent }} />
              <span className="v3-dot" style={{ background: accent, animationDelay: "0.2s" }} />
              <span className="v3-dot" style={{ background: accent, animationDelay: "0.4s" }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
