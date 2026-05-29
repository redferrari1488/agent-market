"use client";

// NewsDigestMock — TG-phone. Агент дайджеста постит сводку из 5 новостей:
// typing → карточка → 5 пунктов с mono-тегами появляются stagger 100ms.
// slug: news-digest-bot. Бордер тегов через color-mix (accent в проекте =
// oklch, конкатенация accent+'66' дала бы невалидный цвет).

import { MONO, SANS, TypingDots, usePhases } from "./shared";

const ITEMS = [
  { tag: "tech", title: "OpenAI выпустил новую модель", ago: "3 ч" },
  { tag: "crypto", title: "BTC пробил 70K", ago: "5 ч" },
  { tag: "policy", title: "ЦБ поднял ключевую ставку", ago: "вчера" },
  { tag: "biz", title: "YC открыл приём заявок", ago: "вчера" },
  { tag: "ai", title: "Anthropic анонсировал Claude 5", ago: "2 дня" },
];

export function NewsDigestMock({
  accent,
  reducedMotion,
}: {
  accent: string;
  reducedMotion: boolean;
}) {
  const phase = usePhases([900, 450, 2200], 2, reducedMotion);
  const showCard = phase >= 1;
  const itemsShow = phase >= 2;
  const tagBorder = `color-mix(in srgb, ${accent} 40%, transparent)`;

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
      <style>{`@keyframes ndRise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
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
              fontSize: 15,
            }}
          >
            🗞
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: "#fff" }}>Morning Brief</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.6)" }}>агент · ежедневно 8:00</div>
          </div>
        </div>
        <div
          className="v3-chat"
          style={{
            padding: "14px 12px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
            minHeight: 320,
          }}
        >
          {!showCard && <TypingDots accent={accent} />}
          {showCard && (
            <div
              style={{
                background: "#182533",
                borderRadius: "4px 14px 14px 14px",
                padding: "12px 12px 8px",
                border: "1px solid rgba(255,255,255,.05)",
                animation: reducedMotion ? "none" : "ndRise .35s ease both",
              }}
            >
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: 11.5,
                  color: accent,
                  marginBottom: 12,
                  letterSpacing: ".2px",
                }}
              >
                🗞 Утро · <span style={{ color: "rgba(255,255,255,.6)" }}>28 мая · 5 главных</span>
              </div>
              {ITEMS.map((it, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 9,
                    padding: "7px 0",
                    borderTop: i ? "1px solid rgba(255,255,255,.045)" : "none",
                    opacity: itemsShow ? 1 : 0,
                    transform: itemsShow ? "none" : "translateY(5px)",
                    transition: "all .35s ease " + i * 0.1 + "s",
                  }}
                >
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: 12,
                      color: "#5b6570",
                      fontVariantNumeric: "tabular-nums",
                      flexShrink: 0,
                    }}
                  >
                    {i + 1}
                  </span>
                  <div style={{ flex: 1 }}>
                    <span
                      style={{
                        fontFamily: MONO,
                        fontSize: 9.5,
                        color: accent,
                        border: "1px solid " + tagBorder,
                        borderRadius: 4,
                        padding: "1px 5px",
                        marginRight: 7,
                        letterSpacing: ".3px",
                        textTransform: "uppercase",
                      }}
                    >
                      {it.tag}
                    </span>
                    <span style={{ fontFamily: SANS, fontSize: 12.5, color: "#dfe3e7", lineHeight: 1.5 }}>
                      {it.title}
                    </span>
                  </div>
                  <span
                    style={{ fontFamily: MONO, fontSize: 10, color: "#5b6570", flexShrink: 0 }}
                  >
                    {it.ago}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
