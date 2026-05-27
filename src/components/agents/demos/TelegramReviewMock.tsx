"use client";

// TG-mock — первый V3 demo. Для агента review-responder-2gis.
// Стейт-машина: typing → ready → sent. 2 цикла, потом freeze на sent.
// Restart через `key` извне (см. AgentCardShell — увеличивает restartTrigger
// при hover/focus на demo-панели → key меняется → компонент перемонтируется).
//
// prefers-reduced-motion: сразу `ready`, без анимации dots, без auto-loop.

import { useEffect, useState } from "react";

type DemoMessage = {
  author: string;
  time: string;
  text: string;
};

type Phase = "typing" | "ready" | "sent";

type Props = {
  accent: string;
  review: DemoMessage;
  reply: DemoMessage;
  reducedMotion: boolean;
};

export function TelegramReviewMock({ accent, review, reply, reducedMotion }: Props) {
  const [state, setState] = useState<Phase>(reducedMotion ? "ready" : "typing");

  useEffect(() => {
    if (reducedMotion) return;
    let cancelled = false;
    let cycle = 0;
    const tids: ReturnType<typeof setTimeout>[] = [];
    const next = (s: Phase, t: number) =>
      new Promise<void>((res) => {
        const id = setTimeout(() => {
          if (cancelled) return;
          setState(s);
          res();
        }, t);
        tids.push(id);
      });

    (async () => {
      while (!cancelled && cycle < 2) {
        await next("ready", 2200);
        if (cancelled) return;
        await next("sent", 3200);
        if (cancelled) return;
        cycle += 1;
        if (cycle < 2) {
          await next("typing", 2400);
        }
      }
    })();

    return () => {
      cancelled = true;
      tids.forEach(clearTimeout);
    };
  }, [reducedMotion]);

  const accentBorder = `color-mix(in srgb, ${accent} 50%, transparent)`;

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
      <div
        style={{
          width: 290,
          background: "#17212b",
          borderRadius: 26,
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.5), 0 0 0 8px #0c0b09",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "12px 14px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "#2b5278",
            color: "#fff",
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 99,
              background: accent,
              color: "#0a0a09",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-onest), sans-serif",
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            AI
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>2GIS Reply Bot</div>
            <div style={{ fontSize: 11, opacity: 0.7 }}>
              {state === "typing" ? "печатает черновик…" : "онлайн"}
            </div>
          </div>
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} aria-hidden="true">
            <path d="M3 5h18M3 12h18M3 19h18" />
          </svg>
        </div>

        <div
          className="v3-chat"
          style={{
            flex: 1,
            padding: "14px 12px",
            background: "#0e1621",
            display: "flex",
            flexDirection: "column",
            gap: 8,
            minHeight: 320,
          }}
        >
          <div style={{ alignSelf: "flex-start", maxWidth: "85%" }}>
            <div
              style={{
                padding: "8px 12px",
                background: "#182533",
                borderRadius: "12px 12px 12px 4px",
                color: "#fff",
                fontSize: 12,
                lineHeight: 1.4,
              }}
            >
              ★☆☆☆☆ <b>новый отзыв в 2GIS</b>
              <br />
              <span style={{ opacity: 0.7, fontSize: 11 }}>
                {review.author} · {review.time}
              </span>
              <div
                style={{
                  marginTop: 6,
                  padding: "6px 8px",
                  background: "rgba(255,255,255,0.04)",
                  borderRadius: 6,
                  fontSize: 11.5,
                }}
              >
                «{review.text}»
              </div>
            </div>
          </div>

          {state !== "typing" && (
            <div style={{ alignSelf: "flex-end", maxWidth: "85%" }}>
              <div
                style={{
                  padding: "8px 12px",
                  background: state === "sent" ? "#2b5278" : "#182533",
                  borderRadius: "12px 12px 4px 12px",
                  color: "#fff",
                  fontSize: 12,
                  lineHeight: 1.45,
                  border: state === "ready" ? `1px solid ${accentBorder}` : "none",
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    opacity: 0.6,
                    marginBottom: 4,
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    fontFamily: "var(--font-mono), monospace",
                  }}
                >
                  {state === "sent" ? "✓ отправлено в 2GIS" : "черновик · готов"}
                </div>
                {reply.text}
                <div
                  style={{
                    marginTop: 4,
                    fontSize: 10,
                    opacity: 0.6,
                    textAlign: "right",
                  }}
                >
                  {reply.time}
                </div>
              </div>
            </div>
          )}

          {state === "typing" && (
            <div style={{ alignSelf: "flex-end", maxWidth: "60%" }}>
              <div
                style={{
                  padding: "10px 14px",
                  background: "#182533",
                  borderRadius: "12px 12px 4px 12px",
                  display: "flex",
                  gap: 4,
                  alignItems: "center",
                }}
              >
                <span className="v3-dot" style={{ background: accent }} />
                <span className="v3-dot" style={{ background: accent, animationDelay: "0.2s" }} />
                <span className="v3-dot" style={{ background: accent, animationDelay: "0.4s" }} />
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            padding: 10,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
            background: "#17212b",
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            style={{
              padding: "10px 0",
              borderRadius: 8,
              background: "rgba(255,255,255,0.06)",
              color: "#fff",
              border: "none",
              fontSize: 12,
              fontWeight: 500,
              cursor: "default",
              opacity: state === "ready" ? 1 : 0.4,
            }}
          >
            пропустить
          </button>
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            style={{
              padding: "10px 0",
              borderRadius: 8,
              background: state === "ready" ? accent : "rgba(255,255,255,0.1)",
              color: state === "ready" ? "#0a0a09" : "rgba(255,255,255,0.5)",
              border: "none",
              fontSize: 12,
              fontWeight: 700,
              cursor: "default",
              transition: "all .3s",
            }}
          >
            {state === "sent" ? "✓ отправлено" : "одобрить →"}
          </button>
        </div>
      </div>
    </div>
  );
}
