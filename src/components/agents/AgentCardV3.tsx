"use client";

// V3 agent card — split-product, live demo dominant.
// Перенос из drafts/claude-design-v3-agent-page/v3-split.jsx.
// Используется ТОЛЬКО для slug `review-responder-2gis` (см. page.tsx).
// Для остальных агентов остаётся старая длинная страница-лендинг.

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { PurchaseButton } from "./PurchaseButton";

type DemoMessage = {
  author: string;
  time: string;
  text: string;
};

type AgentCardV3Props = {
  agentId: string;
  name: string;
  description: string;
  categoryLabel: string;
  categoryColor: string;
  priceLabel: string | null;
  priceMonthly: number | null;
  features: { title: string; desc: string }[];
  fitsFor: string[];
  uptime: string;
  demoReview: DemoMessage;
  demoReply: DemoMessage;
  isLoggedIn: boolean;
};

type Phase = "typing" | "ready" | "sent";

function useReducedMotion(): boolean {
  return useSyncExternalStore(
    (cb) => {
      if (typeof window === "undefined" || !window.matchMedia) return () => {};
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener?.("change", cb);
      return () => mq.removeEventListener?.("change", cb);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

function BackButton({ floating }: { floating?: boolean }) {
  const router = useRouter();
  return (
    <button
      type="button"
      aria-label="Назад"
      onClick={() => router.back()}
      className="v3-back"
      style={
        floating
          ? { position: "absolute", top: 14, left: 14, zIndex: 2 }
          : undefined
      }
    >
      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M19 12H5M11 18l-6-6 6-6"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

function TelegramMock({
  accent,
  review,
  reply,
  reducedMotion,
}: {
  accent: string;
  review: DemoMessage;
  reply: DemoMessage;
  reducedMotion: boolean;
}) {
  // Стейт инициализируется один раз; перезапуск анимации идёт через
  // remount по `key` снаружи — это позволяет избежать setState-in-effect.
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

export function AgentCardV3(props: AgentCardV3Props) {
  const {
    agentId,
    name,
    description,
    categoryLabel,
    categoryColor: accent,
    priceLabel,
    priceMonthly,
    features,
    fitsFor,
    uptime,
    demoReview,
    demoReply,
    isLoggedIn,
  } = props;

  const reducedMotion = useReducedMotion();
  const [restartTrigger, setRestart] = useState(0);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const onRestart = useCallback(() => {
    if (reducedMotion) return;
    setRestart((n) => n + 1);
  }, [reducedMotion]);

  const cleanName = name.replace(/[.!?]+$/, "");
  const gradient = `radial-gradient(ellipse at top right, color-mix(in srgb, ${accent} 14%, transparent), transparent 60%), #0c0b09`;

  return (
    <>
      <style>{`
        .v3-dot {
          width: 6px; height: 6px; border-radius: 99px;
          animation: v3pulse 1.2s ease-in-out infinite;
        }
        @keyframes v3pulse {
          0%, 60%, 100% { transform: scale(1); opacity: 0.4; }
          30% { transform: scale(1.4); opacity: 1; }
        }
        .v3-back {
          width: 36px; height: 36px;
          border-radius: 50%;
          background: transparent;
          border: 1px solid var(--hr-border-2);
          color: var(--hr-fg-2);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          padding: 0;
          transition: border-color .15s, background .15s, transform .15s, color .15s;
          flex-shrink: 0;
        }
        .v3-back:hover {
          border-color: var(--hr-border-3);
          background: color-mix(in srgb, var(--hr-fg-1) 4%, transparent);
          color: var(--hr-fg-1);
        }
        .v3-back:active { transform: scale(0.96); }
        .v3-back:focus-visible {
          outline: 2px solid ${accent};
          outline-offset: 2px;
        }
        @media (prefers-reduced-motion: reduce) {
          .v3-dot { animation: none; opacity: 1; }
        }
        .v3-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .v3-cta {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          border-radius: 10px;
          font-family: var(--font-geist), sans-serif;
          font-weight: 600;
          letter-spacing: -0.01em;
          border: none;
          cursor: pointer;
          white-space: nowrap;
          transition: transform .15s ease, filter .15s ease;
        }
        .v3-cta:hover { transform: translateY(-1px); filter: brightness(1.05); }
        .v3-cta:active { transform: translateY(0); }
      `}</style>

      <div
        className="ag-card v3-root"
        style={{
          display: "grid",
          gridTemplateColumns: "1.15fr 1fr",
          gridTemplateRows: "1fr",
          position: "relative",
          width: "100%",
          maxWidth: 1200,
          height: 580,
          background: "var(--hr-bg-base)",
          color: "var(--hr-fg-1)",
          borderRadius: 16,
          overflow: "hidden",
          border: "1px solid var(--hr-border-1)",
        }}
      >
        {/* MOBILE — floating back-button (visible only on mobile via CSS) */}
        <div className="v3-mobile-back">
          <BackButton floating />
        </div>

        {/* DESKTOP LEFT (or mobile top) — demo panel */}
        <div
          className="v3-demo"
          onMouseEnter={onRestart}
          onFocus={onRestart}
          style={{
            background: gradient,
            borderRight: "1px solid var(--hr-border-2)",
            display: "flex",
            flexDirection: "column",
            padding: "24px 28px",
            gap: 14,
          }}
        >
          {/* desktop demo header */}
          <div
            className="v3-demo-row-desktop"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <BackButton />
              <span className="v3-eyebrow" style={{ color: accent }}>
                демо · live
              </span>
            </div>
            <span
              style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: 10,
                color: "var(--hr-fg-4)",
                letterSpacing: "0.12em",
              }}
            >
              ● running · {uptime}%
            </span>
          </div>

          {/* mobile demo header (with paddingLeft for floating back) */}
          <div
            className="v3-demo-row-mobile"
            style={{
              display: "none",
              justifyContent: "space-between",
              alignItems: "center",
              paddingLeft: 50,
            }}
          >
            <span className="v3-eyebrow" style={{ color: accent }}>
              демо · live
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: 10,
                color: "var(--hr-fg-4)",
                letterSpacing: "0.12em",
              }}
            >
              ● {uptime}%
            </span>
          </div>

          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <TelegramMock
              key={`${restartTrigger}-${reducedMotion ? "rm" : "anim"}`}
              accent={accent}
              review={demoReview}
              reply={demoReply}
              reducedMotion={reducedMotion}
            />
          </div>

          <div
            style={{
              textAlign: "center",
              fontFamily: "var(--font-mono), monospace",
              fontSize: 10,
              color: "var(--hr-fg-4)",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            ↑ так выглядит реальное использование агента
          </div>
        </div>

        {/* RIGHT (or mobile bottom) — info panel */}
        <div
          className="v3-info"
          style={{
            padding: "24px 28px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
            background: "var(--hr-bg-base)",
          }}
        >
          <span className="v3-eyebrow v3-info-eyebrow" style={{ color: accent }}>
            {categoryLabel}
          </span>

          <div>
            <h1
              className="v3-name"
              style={{
                margin: 0,
                fontFamily: "var(--font-onest), sans-serif",
                fontSize: 40,
                fontWeight: 800,
                lineHeight: 1,
                letterSpacing: "-0.035em",
                color: "var(--hr-fg-1)",
                textWrap: "balance",
              }}
            >
              {cleanName}
              <span style={{ color: accent }}>.</span>
            </h1>
            <p
              className="v3-desc"
              style={{
                margin: "12px 0 0",
                fontSize: 15,
                lineHeight: 1.45,
                color: "var(--hr-fg-2)",
              }}
            >
              {description}
            </p>
          </div>

          {/* features 2x2 — desktop only */}
          <div
            className="v3-features"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
              paddingTop: 12,
              borderTop: "1px solid var(--hr-border-1)",
            }}
          >
            {features.slice(0, 4).map((f, i) => (
              <div
                key={i}
                style={{
                  padding: "8px 10px",
                  border: "1px solid var(--hr-border-1)",
                  borderRadius: 8,
                  background: "var(--hr-bg-elev)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--hr-fg-1)",
                    letterSpacing: "-0.01em",
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 99,
                      background: accent,
                    }}
                  />
                  {f.title}
                </div>
                {f.desc && (
                  <p
                    style={{
                      margin: "3px 0 0 12px",
                      fontSize: 11.5,
                      lineHeight: 1.4,
                      color: "var(--hr-fg-3)",
                    }}
                  >
                    {f.desc}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* fit summary — desktop only */}
          {fitsFor.length > 0 && (
            <div
              className="v3-fits"
              style={{
                paddingTop: 10,
                borderTop: "1px solid var(--hr-border-1)",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 10,
                  color: "var(--hr-fg-4)",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  marginBottom: 6,
                }}
              >
                подходит, если
              </div>
              <ul
                style={{
                  margin: 0,
                  padding: 0,
                  listStyle: "none",
                  display: "flex",
                  flexDirection: "column",
                  gap: 3,
                }}
              >
                {fitsFor.slice(0, 4).map((t, i) => (
                  <li
                    key={i}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "14px 1fr",
                      gap: 8,
                      fontSize: 12.5,
                      lineHeight: 1.45,
                      color: "var(--hr-fg-2)",
                    }}
                  >
                    <span style={{ color: accent, fontWeight: 700 }}>+</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* buy block */}
          <div
            style={{
              marginTop: "auto",
              paddingTop: 12,
              borderTop: "1px solid var(--hr-border-2)",
              display: "grid",
              gridTemplateColumns: "auto 1fr",
              gap: 14,
              alignItems: "center",
            }}
          >
            <div>
              <div
                className="v3-price-label"
                style={{
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 9.5,
                  color: "var(--hr-fg-4)",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                }}
              >
                подписка / мес
              </div>
              <div
                className="v3-price"
                style={{
                  fontFamily: "var(--font-onest), sans-serif",
                  fontSize: 36,
                  fontWeight: 800,
                  lineHeight: 1,
                  color: "var(--hr-fg-1)",
                  letterSpacing: "-0.035em",
                  marginTop: 2,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {priceLabel ?? "—"}
              </div>
            </div>
            <button
              type="button"
              className="v3-cta"
              onClick={() => setCheckoutOpen(true)}
              style={{
                background: accent,
                color: "#0a0a09",
                width: "100%",
                justifyContent: "center",
                padding: "14px 18px",
                fontSize: 14,
              }}
            >
              Подключить
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M5 12h14M13 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          <div
            className="v3-trust"
            style={{
              display: "flex",
              gap: 14,
              flexWrap: "wrap",
              fontFamily: "var(--font-mono), monospace",
              fontSize: 9.5,
              color: "var(--hr-fg-4)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            <span>● 1 клик</span>
            <span>● отмена в любое время</span>
            <span className="v3-trust-desktop-only">● ₽ / USDT</span>
          </div>
        </div>
      </div>

      {/* Checkout modal */}
      {checkoutOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCheckoutOpen(false);
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            animation: "v3-fade-in .15s ease",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 480,
              background: "var(--hr-bg-elev)",
              border: "1px solid var(--hr-border-2)",
              borderTop: `3px solid ${accent}`,
              borderRadius: 16,
              padding: "24px 24px 22px",
              position: "relative",
              maxHeight: "calc(100vh - 32px)",
              overflowY: "auto",
            }}
          >
            <button
              type="button"
              aria-label="Закрыть"
              onClick={() => setCheckoutOpen(false)}
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "transparent",
                border: "1px solid var(--hr-border-2)",
                color: "var(--hr-fg-2)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
              }}
            >
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M18 6L6 18M6 6l12 12"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <div style={{ marginBottom: 18 }}>
              <div
                style={{
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 10,
                  color: "var(--hr-fg-4)",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  marginBottom: 6,
                }}
              >
                подключение · подписка
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span
                  style={{
                    fontFamily: "var(--font-onest), sans-serif",
                    fontSize: 36,
                    fontWeight: 800,
                    color: "var(--hr-fg-1)",
                    letterSpacing: "-0.035em",
                    lineHeight: 1,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {priceLabel}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: 13,
                    color: "var(--hr-fg-3)",
                  }}
                >
                  /мес
                </span>
              </div>
            </div>

            <PurchaseButton
              agentId={agentId}
              pricingModel="subscription"
              priceMonthly={priceMonthly}
              priceOnetime={null}
              isLoggedIn={isLoggedIn}
              accentColor={accent}
              hidePrice
            />
          </div>
        </div>
      )}

      <style>{`
        .v3-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-mono), monospace;
          font-size: 11px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          font-weight: 500;
        }
        .v3-eyebrow::before {
          content: '';
          width: 6px; height: 6px;
          border-radius: 99px;
          background: currentColor;
        }
        .v3-mobile-back { display: none; }
        @keyframes v3-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @media (max-width: 880px) {
          .v3-root {
            grid-template-columns: 1fr !important;
            grid-template-rows: auto auto !important;
            height: auto !important;
            min-height: 680px;
          }
          .v3-mobile-back { display: block; }
          .v3-demo-row-desktop { display: none !important; }
          .v3-demo-row-mobile { display: flex !important; }
          .v3-demo {
            border-right: none !important;
            border-bottom: 1px solid var(--hr-border-2);
            padding: 14px 18px 12px !important;
            gap: 10px !important;
          }
          .v3-info {
            padding: 14px 18px 18px !important;
            gap: 12px !important;
          }
          .v3-info-eyebrow { display: none !important; }
          .v3-name { font-size: 26px !important; line-height: 1.02 !important; }
          .v3-desc {
            font-size: 13.5px !important;
            line-height: 1.4 !important;
            margin-top: 8px !important;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          .v3-features { display: none !important; }
          .v3-fits { display: none !important; }
          .v3-trust-desktop-only { display: none !important; }
          .v3-price { font-size: 28px !important; }
          .v3-chat { min-height: 200px !important; }
        }
      `}</style>
    </>
  );
}
