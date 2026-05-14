"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Plus } from "lucide-react";

type AgentCard = {
  cat: string;
  cc: string;
  name: string;
  price: string;
  rating: string;
};

const CATALOG: AgentCard[] = [
  { cat: "поддержка", cc: "oklch(0.68 0.19 195)", name: "Поддержка-бот · Telegram", price: "4 900 ₽", rating: "★ 4.8" },
  { cat: "контент", cc: "oklch(0.74 0.16 85)", name: "Копирайтер · дайджест", price: "3 500 ₽", rating: "★ 4.9" },
  { cat: "аналитика", cc: "oklch(0.72 0.16 285)", name: "Аналитик звонков · Roistat", price: "6 200 ₽", rating: "★ 4.7" },
  { cat: "мониторинг", cc: "oklch(0.74 0.16 145)", name: "Сторож отзывов · 2GIS", price: "2 400 ₽", rating: "★ 4.6" },
  { cat: "продажи", cc: "oklch(0.7 0.17 25)", name: "Лид-квалификатор · amoCRM", price: "5 800 ₽", rating: "★ 4.8" },
];

const TRUST_ITEMS = [
  "первая волна · идёт набор",
  "отобранные агенты",
  "бесплатное размещение",
  "docker · 1 клик",
  "RU + crypto оплата",
];

const STATS: { num: string; label: string; accent?: boolean }[] = [
  { num: "47", label: "готовых агентов" },
  { num: "12", label: "продавцов в каталоге" },
  { num: "5", label: "категорий" },
  { num: "0%", label: "комиссия первой волны", accent: true },
];

function CatalogMini({ a }: { a: AgentCard }) {
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        background: "rgba(10,15,28,0.65)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 2,
        overflow: "hidden",
        minHeight: 110,
      }}
    >
      <div style={{ height: 2, background: a.cc, opacity: 0.6 }} />
      <div
        style={{
          padding: "11px 12px 12px",
          display: "flex",
          flexDirection: "column",
          flex: 1,
          gap: 6,
        }}
      >
        <div
          className="hf-mono"
          style={{
            fontSize: 9.5,
            letterSpacing: "0.08em",
            color: a.cc,
            opacity: 0.92,
          }}
        >
          {a.cat}
        </div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            lineHeight: 1.25,
            letterSpacing: "-0.012em",
            color: "#eef2ff",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {a.name}
        </div>
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "-0.014em",
              color: "#eef2ff",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {a.price}
          </div>
          <div
            className="hf-mono"
            style={{
              fontSize: 10,
              color: "rgba(154,165,196,0.6)",
              letterSpacing: "0.04em",
            }}
          >
            {a.rating}
          </div>
        </div>
      </div>
    </div>
  );
}

function SellerSlot() {
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        background:
          "radial-gradient(130% 90% at 50% 30%, oklch(0.68 0.19 195 / 0.08), transparent 65%)",
        border: "1.4px dashed oklch(0.68 0.19 195 / 0.55)",
        borderRadius: 2,
        padding: 12,
        minHeight: 110,
        overflow: "hidden",
      }}
    >
      {(["tl", "tr", "bl", "br"] as const).map((p) => {
        const pos: React.CSSProperties = {
          tl: {
            top: -1,
            left: -1,
            borderTop: "1px solid oklch(0.68 0.19 195)",
            borderLeft: "1px solid oklch(0.68 0.19 195)",
          },
          tr: {
            top: -1,
            right: -1,
            borderTop: "1px solid oklch(0.68 0.19 195)",
            borderRight: "1px solid oklch(0.68 0.19 195)",
          },
          bl: {
            bottom: -1,
            left: -1,
            borderBottom: "1px solid oklch(0.68 0.19 195)",
            borderLeft: "1px solid oklch(0.68 0.19 195)",
          },
          br: {
            bottom: -1,
            right: -1,
            borderBottom: "1px solid oklch(0.68 0.19 195)",
            borderRight: "1px solid oklch(0.68 0.19 195)",
          },
        }[p];
        return (
          <span
            key={p}
            aria-hidden
            style={{ position: "absolute", width: 7, height: 7, ...pos }}
          />
        );
      })}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          className="hf-mono"
          style={{
            fontSize: 9.5,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "oklch(0.68 0.19 195)",
          }}
        >
          слот · #06
        </span>
        <span
          aria-hidden
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 18,
            height: 18,
            borderRadius: 2,
            background: "oklch(0.68 0.19 195 / 0.14)",
            border: "1px solid oklch(0.68 0.19 195 / 0.55)",
            color: "oklch(0.68 0.19 195)",
          }}
        >
          <Plus className="h-3 w-3" strokeWidth={2.5} />
        </span>
      </div>
      <div
        style={{
          marginTop: 8,
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: "-0.012em",
          color: "#eef2ff",
          lineHeight: 1.25,
        }}
      >
        Стать продавцом
      </div>
      <div
        className="hf-mono"
        style={{
          marginTop: 6,
          fontSize: 9.5,
          color: "rgba(154,165,196,0.72)",
          letterSpacing: "0.04em",
        }}
      >
        набор первой волны · бесплатно
      </div>
      <div
        style={{
          marginTop: "auto",
          paddingTop: 10,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          className="hf-mono"
          style={{ fontSize: 9.5, color: "rgba(154,165,196,0.55)" }}
        >
          ваш агент сюда
        </span>
        <Link
          href="/seller"
          className="hf-mono"
          style={{
            fontSize: 10,
            color: "oklch(0.68 0.19 195)",
            textDecoration: "none",
          }}
        >
          разместить →
        </Link>
      </div>
    </div>
  );
}

function ActivityTicker() {
  const [n, setN] = useState(12847);
  useEffect(() => {
    const t = setInterval(
      () => setN((v) => v + Math.floor(Math.random() * 3) + 1),
      1400,
    );
    return () => clearInterval(t);
  }, []);
  return (
    <div
      className="hf-mono hf-activity-ticker"
      style={{ display: "inline-flex", alignItems: "baseline", gap: 8 }}
    >
      <span
        className="hf-pulse"
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "oklch(0.68 0.19 195)",
          boxShadow: "0 0 8px oklch(0.68 0.19 195 / 0.5)",
          alignSelf: "center",
          display: "inline-block",
        }}
      />
      <span
        style={{
          fontSize: 13,
          color: "#eef2ff",
          fontVariantNumeric: "tabular-nums",
          letterSpacing: "-0.005em",
        }}
      >
        {n.toLocaleString("ru-RU")}
      </span>
      <span
        style={{
          fontSize: 10,
          color: "rgba(154,165,196,0.6)",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
        }}
      >
        событий · сегодня
      </span>
    </div>
  );
}

function BrowserFrame() {
  return (
    <div
      className="hf-browser-frame"
      style={{
        position: "relative",
        background: "rgba(8,10,18,0.78)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 6,
        overflow: "hidden",
        backdropFilter: "blur(18px) saturate(1.1)",
        WebkitBackdropFilter: "blur(18px) saturate(1.1)",
        boxShadow:
          "0 50px 120px rgba(0,0,0,0.7), 0 1px 0 rgba(255,255,255,0.08) inset, 0 0 0 1px rgba(255,255,255,0.02)",
      }}
    >
      {/* chrome */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "9px 12px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(4,6,13,0.55)",
        }}
      >
        <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: "rgba(255,255,255,0.10)" }} />
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: "rgba(255,255,255,0.10)" }} />
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: "rgba(255,255,255,0.10)" }} />
        </div>
        <div
          className="hf-mono"
          style={{
            marginLeft: 10,
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: 8,
            height: 24,
            padding: "0 10px",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 2,
            fontSize: 10.5,
            color: "rgba(154,165,196,0.85)",
            overflow: "hidden",
            minWidth: 0,
          }}
        >
          <span style={{ color: "oklch(0.68 0.19 195)", opacity: 0.85, fontSize: 9 }}>●</span>
          <span style={{ color: "rgba(154,165,196,0.5)" }}>hireon.agency</span>
          <span style={{ color: "#eef2ff" }}>/agents</span>
        </div>
        <ActivityTicker />
      </div>

      {/* inner */}
      <div className="hf-browser-inner" style={{ padding: "18px 18px 16px" }}>
        <div
          className="hf-browser-head"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 14,
            gap: 12,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              className="hf-eyebrow"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 9.5,
                flexWrap: "wrap",
              }}
            >
              <span>Каталог</span>
              <span style={{ color: "rgba(154,165,196,0.4)" }}>·</span>
              <span style={{ color: "#eef2ff" }}>47 агентов</span>
              <span style={{ color: "rgba(154,165,196,0.4)" }}>·</span>
              <span>обновлён 14 мая</span>
            </div>
            <div
              style={{
                marginTop: 6,
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: "-0.018em",
                color: "#eef2ff",
              }}
            >
              Подберите агента под задачу
            </div>
          </div>
          <div
            className="hf-browser-filters"
            style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}
          >
            {["все", "поддержка", "контент", "аналитика"].map((t, i) => (
              <span
                key={t}
                className="hf-mono"
                style={{
                  padding: "4px 9px",
                  fontSize: 9.5,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: i === 0 ? "#eef2ff" : "rgba(154,165,196,0.7)",
                  background: i === 0 ? "rgba(255,255,255,0.04)" : "transparent",
                  border: `1px solid ${i === 0 ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)"}`,
                  borderRadius: 2,
                  whiteSpace: "nowrap",
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        <div className="hf-browser-grid">
          {CATALOG.map((a, i) => (
            <CatalogMini key={i} a={a} />
          ))}
          <SellerSlot />
        </div>

        {/* footer strip */}
        <div
          className="hf-browser-footer"
          style={{
            marginTop: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 12,
            borderTop: "1px solid rgba(255,255,255,0.06)",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <div
            className="hf-mono"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              fontSize: 9.5,
              color: "rgba(154,165,196,0.65)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              flexWrap: "wrap",
            }}
          >
            <span>5 категорий</span>
            <span style={{ color: "rgba(154,165,196,0.3)" }}>·</span>
            <span>12 продавцов</span>
            <span style={{ color: "rgba(154,165,196,0.3)" }}>·</span>
            <span>
              <span style={{ color: "oklch(0.68 0.19 195)" }}>0%</span> комиссия
            </span>
          </div>
          <Link
            href="/agents"
            className="hf-mono"
            style={{
              fontSize: 10,
              color: "rgba(154,165,196,0.85)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              textDecoration: "none",
            }}
          >
            смотреть все 47 →
          </Link>
        </div>
      </div>
    </div>
  );
}

function TrustStrip() {
  return (
    <div
      className="hf-mono"
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 0,
        fontSize: 10.5,
        letterSpacing: "0.06em",
        color: "rgba(154,165,196,0.78)",
        rowGap: 8,
      }}
    >
      {TRUST_ITEMS.map((t, i) => (
        <span key={t} style={{ display: "inline-flex", alignItems: "center" }}>
          {i > 0 && (
            <span
              aria-hidden
              style={{ margin: "0 12px", color: "rgba(154,165,196,0.3)" }}
            >
              /
            </span>
          )}
          <span style={{ whiteSpace: "nowrap" }}>{t}</span>
        </span>
      ))}
    </div>
  );
}

function StatRibbon() {
  return (
    <div className="hf-stat-ribbon">
      {STATS.map((s, i) => (
        <div
          key={s.label}
          className="hf-stat-cell"
          style={{
            paddingLeft: i === 0 ? 0 : 16,
            borderLeft:
              i === 0 ? "none" : "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "-0.022em",
              color: s.accent ? "oklch(0.68 0.19 195)" : "#eef2ff",
              fontVariantNumeric: "tabular-nums",
              lineHeight: 1,
            }}
          >
            {s.num}
          </div>
          <div
            className="hf-mono"
            style={{
              fontSize: 9.5,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "rgba(154,165,196,0.65)",
            }}
          >
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}

export function HeroSplit() {
  const onHowClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const target = document.getElementById("how");
    if (!target) return;
    e.preventDefault();
    const headerOffset = 72;
    const top =
      target.getBoundingClientRect().top + window.pageYOffset - headerOffset;
    window.scrollTo({ top, behavior: "smooth" });
    history.replaceState(null, "", "#how");
  };

  return (
    <div className="hf-hero-split">
      <div className="hf-hero-text">
        <div
          className="hf-eyebrow"
          style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}
        >
          <span
            className="hf-pulse"
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "oklch(0.68 0.19 195)",
              boxShadow: "0 0 8px oklch(0.68 0.19 195 / 0.5)",
              display: "inline-block",
            }}
          />
          <span>Маркетплейс AI-агентов для бизнеса</span>
          <span style={{ color: "rgba(154,165,196,0.35)" }}>·</span>
          <span style={{ color: "oklch(0.68 0.19 195)" }}>Pre-launch</span>
        </div>

        <h1
          className="hf-hero-h1"
          style={{
            margin: "20px 0 0",
            lineHeight: 0.98,
            letterSpacing: "-0.04em",
            fontWeight: 700,
            color: "#eef2ff",
            fontFamily: "'Inter', sans-serif",
            textWrap: "balance",
          }}
        >
          <span style={{ display: "block" }}>Покупай готовые.</span>
          <span style={{ display: "block" }}>
            <span style={{ color: "oklch(0.68 0.19 195)" }}>Продавай</span> свои.
          </span>
        </h1>

        <p
          className="hf-hero-sub"
          style={{
            margin: "22px 0 0",
            lineHeight: 1.55,
            color: "rgba(238,242,255,0.78)",
            maxWidth: 520,
            letterSpacing: "-0.005em",
          }}
        >
          Готовые AI-агенты в Docker — запусти за 5 минут. Или размести своего
          и получай выплаты автоматически.
        </p>

        <StatRibbon />

        <div className="hf-hero-cta">
          <Link href="/agents" className="hf-hero-btn hf-hero-btn-primary">
            Найти агента
            <ArrowRight className="h-4 w-4" style={{ opacity: 0.55 }} />
          </Link>
          <Link href="/seller" className="hf-hero-btn hf-hero-btn-secondary">
            Разместить агента
            <Plus
              className="h-4 w-4"
              strokeWidth={2.5}
              style={{ color: "oklch(0.68 0.19 195)" }}
            />
          </Link>
          <a
            href="#how"
            onClick={onHowClick}
            className="hf-mono hf-hero-tertiary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "0 8px",
              height: 44,
              fontSize: 11,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "rgba(154,165,196,0.7)",
              textDecoration: "none",
            }}
          >
            как это устроено ↓
          </a>
        </div>

        <div style={{ marginTop: 22 }}>
          <TrustStrip />
        </div>
      </div>

      <div className="hf-hero-visual">
        <div
          className="hf-mono hf-hero-visual-tag"
          style={{
            position: "absolute",
            top: -22,
            right: 0,
            fontSize: 9.5,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "rgba(154,165,196,0.55)",
          }}
        >
          витрина · обе стороны на одном экране
        </div>
        <BrowserFrame />
      </div>
    </div>
  );
}
