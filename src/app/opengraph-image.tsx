import { ImageResponse } from "next/og";

// Open Graph image — показывается превью при шере ссылки на hireon.agency
// в Telegram, Twitter/X, WhatsApp, Slack, Facebook, LinkedIn и т.п.
// Канонический размер OG — 1200×630 (соотношение 1.91:1), его уважают все.
//
// Дизайн в фирменных цветах: warm dark base, wordmark hire.on с cyan-dot,
// субтитл и tagline. Без mock-каталога — пусть превью читается за 0.5 сек.

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "hire.on — маркетплейс AI-агентов";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0f0e0c",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 96px",
          position: "relative",
        }}
      >
        {/* subtle cyan glow */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "radial-gradient(circle at 22% 50%, rgba(34,211,238,0.18), rgba(34,211,238,0) 55%)",
          }}
        />

        {/* top mono label */}
        <div
          style={{
            display: "flex",
            color: "rgba(241,235,224,0.45)",
            fontSize: 22,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            marginBottom: 36,
            fontFamily: "monospace",
          }}
        >
          hireon.agency
        </div>

        {/* wordmark */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            color: "#f1ebe0",
            fontSize: 220,
            fontWeight: 600,
            letterSpacing: "-0.04em",
            lineHeight: 0.95,
          }}
        >
          hire
          <span style={{ color: "#22d3ee" }}>.</span>
          on
        </div>

        {/* tagline */}
        <div
          style={{
            display: "flex",
            color: "rgba(241,235,224,0.85)",
            fontSize: 44,
            fontWeight: 500,
            marginTop: 40,
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
            maxWidth: 900,
          }}
        >
          Готовые AI-агенты для бизнеса.
        </div>

        {/* subtitle */}
        <div
          style={{
            display: "flex",
            color: "rgba(241,235,224,0.5)",
            fontSize: 26,
            marginTop: 18,
            letterSpacing: "-0.01em",
            fontFamily: "monospace",
          }}
        >
          выбери · настрой · запусти за 5 минут
        </div>
      </div>
    ),
    { ...size },
  );
}
