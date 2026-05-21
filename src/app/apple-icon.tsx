import { ImageResponse } from "next/og";

// Apple touch icon — показывается когда iOS-юзер добавляет
// сайт на главный экран ("Добавить на экран Домой"). 180×180 —
// канонический размер apple-touch-icon. На дисплее iOS рендерится
// 60×60pt = 180px @3x, поэтому buква читаема (не как favicon 16px).
//
// Дизайн: brand-mark из спеки — крупная h в Onest + cyan dot,
// на warm-dark фоне. Совпадает по идее с favicon (src/app/icon.svg),
// но Onest здесь нет (next/og использует system fallback) — система
// сама подставит близкий sans-serif.

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0f0e0c",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 40,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            color: "#f1ebe0",
            fontSize: 140,
            fontWeight: 600,
            letterSpacing: "-0.04em",
            lineHeight: 1,
          }}
        >
          h
          <span
            style={{
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: "#22d3ee",
              marginLeft: 6,
              marginBottom: 12,
            }}
          />
        </div>
      </div>
    ),
    { ...size },
  );
}
