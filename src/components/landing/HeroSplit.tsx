"use client";

import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";

type AgentCard = {
  cat: string;
  cc: string;
  name: string;
  desc: string;
  price: string;
  sub: string;
  rating: string | null;
  external?: boolean;
};

const CATALOG: AgentCard[] = [
  {
    cat: "поддержка",
    cc: "oklch(0.68 0.19 195)",
    name: "Поддержка-бот · Telegram",
    desc: "Принимает входящие в чат, отвечает по базе знаний, эскалирует сложные.",
    price: "4 900 ₽",
    sub: "/месяц",
    rating: "★ 4.8 · 24",
  },
  {
    cat: "контент",
    cc: "oklch(0.74 0.16 85)",
    name: "Копирайтер · еженедельный дайджест",
    desc: "Собирает источники, пишет посты в Telegram-канал и блог.",
    price: "3 500 ₽",
    sub: "/месяц",
    rating: "★ 4.9 · 18",
  },
  {
    cat: "аналитика",
    cc: "oklch(0.72 0.16 285)",
    name: "Аналитик звонков · Roistat",
    desc: "Транскрибирует разговоры, размечает воронку, считает конверсию.",
    price: "6 200 ₽",
    sub: "/месяц",
    rating: "★ 4.7 · 12",
  },
  {
    cat: "мониторинг",
    cc: "oklch(0.74 0.16 145)",
    name: "Сторож отзывов · 2GIS + Яндекс",
    desc: "Алерт в Telegram при новых отзывах, ответ-черновик за 2 минуты.",
    price: "2 400 ₽",
    sub: "/месяц",
    rating: "★ 4.6 · 31",
  },
  {
    cat: "продажи",
    cc: "oklch(0.7 0.17 25)",
    name: "Лид-квалификатор · amoCRM",
    desc: "Прогревает входящие, проставляет score, бронирует слоты в календаре.",
    price: "5 800 ₽",
    sub: "/месяц",
    rating: "★ 4.8 · 22",
  },
];

const TRUST_ITEMS = [
  "Идёт набор продавцов первой волны",
  "Отобранные агенты",
  "Бесплатное размещение",
  "Развёртывание в Docker за 1 клик",
  "RU + Crypto оплата",
];

function CatalogCard({ a }: { a: AgentCard }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        background: "color-mix(in oklch, #0a0f1c 75%, transparent)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 2,
        overflow: "hidden",
        minHeight: 168,
      }}
    >
      <div style={{ height: 2, background: a.cc, opacity: 0.55 }} />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          padding: "14px 16px",
          flex: 1,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            className="hf-mono"
            style={{
              fontSize: 10,
              letterSpacing: "0.08em",
              color: a.cc,
              opacity: 0.9,
            }}
          >
            {a.cat}
          </span>
        </div>
        <h3
          style={{
            margin: "10px 0 0",
            fontSize: 14.5,
            lineHeight: 1.25,
            fontWeight: 700,
            letterSpacing: "-0.012em",
            color: "#eef2ff",
          }}
        >
          {a.name}
        </h3>
        <p
          style={{
            margin: "8px 0 0",
            fontSize: 12,
            lineHeight: 1.5,
            color: "rgba(154,165,196,0.8)",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {a.desc}
        </p>

        <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "12px 0" }} />

        <div
          style={{
            marginTop: "auto",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: "-0.018em",
                color: "#eef2ff",
                fontVariantNumeric: "tabular-nums",
                lineHeight: 1,
              }}
            >
              {a.price}
            </div>
            <div
              className="hf-mono"
              style={{
                marginTop: 4,
                fontSize: 9,
                letterSpacing: "0.04em",
                color: "rgba(154,165,196,0.55)",
              }}
            >
              {a.sub}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 6,
            }}
          >
            {a.rating && (
              <div
                className="hf-mono"
                style={{ fontSize: 10, color: "rgba(154,165,196,0.6)" }}
              >
                {a.rating}
              </div>
            )}
            <span
              className="hf-mono"
              style={{
                padding: "5px 10px",
                fontSize: 10.5,
                fontWeight: 500,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "rgba(154,165,196,0.85)",
                border: "1px solid rgba(255,255,255,0.09)",
                borderRadius: 2,
              }}
            >
              нанять →
            </span>
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
        justifyContent: "center",
        background:
          "radial-gradient(120% 80% at 50% 30%, oklch(0.68 0.19 195 / 0.06), transparent 60%)",
        border: "1.5px dashed oklch(0.68 0.19 195 / 0.55)",
        borderRadius: 2,
        padding: "20px 16px",
        minHeight: 168,
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
            style={{ position: "absolute", width: 8, height: 8, ...pos }}
          />
        );
      })}

      <span
        className="hf-mono"
        style={{
          fontSize: 10,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "oklch(0.68 0.19 195)",
          opacity: 0.85,
        }}
      >
        свободный слот · #06
      </span>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginTop: 14,
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 28,
            height: 28,
            borderRadius: 2,
            background: "oklch(0.68 0.19 195 / 0.14)",
            border: "1px solid oklch(0.68 0.19 195 / 0.55)",
            color: "oklch(0.68 0.19 195)",
          }}
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
        </span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: "-0.012em",
              color: "#eef2ff",
            }}
          >
            Стать продавцом
          </div>
          <div
            className="hf-mono"
            style={{
              fontSize: 10.5,
              color: "rgba(154,165,196,0.75)",
              marginTop: 4,
              letterSpacing: "0.04em",
            }}
          >
            набор первой волны · бесплатно
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: "auto",
          paddingTop: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          className="hf-mono"
          style={{
            fontSize: 10,
            color: "rgba(154,165,196,0.6)",
            letterSpacing: "0.06em",
          }}
        >
          ваш агент сюда
        </span>
        <Link
          href="/seller"
          className="hf-mono"
          style={{
            fontSize: 11,
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

function BrowserFrame() {
  return (
    <div
      className="hf-browser-frame"
      style={{
        position: "relative",
        background: "color-mix(in oklch, #04060d 88%, transparent)",
        border: "1px solid rgba(255,255,255,0.10)",
        borderRadius: 4,
        overflow: "hidden",
        backdropFilter: "blur(14px) saturate(1.05)",
        WebkitBackdropFilter: "blur(14px) saturate(1.05)",
        boxShadow:
          "0 40px 100px rgba(0,0,0,0.65), 0 1px 0 rgba(255,255,255,0.06) inset, 0 0 0 1px rgba(255,255,255,0.02)",
      }}
    >
      {/* chrome */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 14px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "color-mix(in oklch, #04060d 80%, #0a0f1c)",
        }}
      >
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#2a2f3d",
            }}
          />
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#2a2f3d",
            }}
          />
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#2a2f3d",
            }}
          />
        </div>
        <div
          className="hf-mono"
          style={{
            marginLeft: 14,
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: 8,
            height: 26,
            padding: "0 12px",
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 2,
            fontSize: 11,
            color: "rgba(154,165,196,0.85)",
            letterSpacing: "0.02em",
            overflow: "hidden",
          }}
        >
          <span style={{ color: "oklch(0.68 0.19 195)", opacity: 0.85 }}>●</span>
          <span style={{ color: "rgba(154,165,196,0.55)" }}>hireon.agency</span>
          <span style={{ color: "#eef2ff" }}>/agents</span>
        </div>
        <span
          className="hf-mono hf-browser-live"
          style={{
            fontSize: 10,
            color: "rgba(154,165,196,0.55)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            flexShrink: 0,
          }}
        >
          live
        </span>
      </div>

      {/* page inner */}
      <div className="hf-browser-inner" style={{ padding: "22px 22px 18px" }}>
        <div
          className="hf-browser-head"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 18,
            gap: 12,
          }}
        >
          <div>
            <div
              className="hf-eyebrow"
              style={{ display: "flex", alignItems: "center", gap: 8 }}
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
              <span>Каталог · 47 агентов</span>
            </div>
            <div
              style={{
                marginTop: 8,
                fontSize: 18,
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
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            {["Все", "Поддержка", "Контент", "Аналитика", "Продажи"].map(
              (t, i) => (
                <span
                  key={t}
                  className="hf-mono"
                  style={{
                    padding: "5px 10px",
                    fontSize: 10.5,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: i === 0 ? "#eef2ff" : "rgba(154,165,196,0.7)",
                    background: i === 0 ? "rgba(255,255,255,0.045)" : "transparent",
                    border: `1px solid ${i === 0 ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)"}`,
                    borderRadius: 2,
                    whiteSpace: "nowrap",
                  }}
                >
                  {t}
                </span>
              ),
            )}
          </div>
        </div>

        <div className="hf-browser-grid">
          {CATALOG.slice(0, 5).map((a, i) => (
            <CatalogCard key={i} a={a} />
          ))}
          <SellerSlot />
        </div>
      </div>
    </div>
  );
}

function TrustPill() {
  return (
    <div
      className="hf-mono hf-trust-pill"
      style={{
        display: "inline-flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 0,
        padding: "9px 16px",
        border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: 999,
        background: "color-mix(in oklch, #0a0f1c 65%, transparent)",
        fontSize: 10.5,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "rgba(154,165,196,0.85)",
        maxWidth: 640,
        rowGap: 6,
      }}
    >
      {TRUST_ITEMS.map((t, i) => (
        <span key={t} style={{ display: "inline-flex", alignItems: "center" }}>
          {i > 0 && (
            <span
              aria-hidden
              style={{ margin: "0 10px", color: "rgba(154,165,196,0.35)" }}
            >
              ·
            </span>
          )}
          <span style={{ whiteSpace: "nowrap" }}>{t}</span>
        </span>
      ))}
    </div>
  );
}

export function HeroSplit() {
  return (
    <div className="hf-hero-split">
      <div className="hf-hero-text">
        <div
          className="hf-eyebrow"
          style={{ display: "flex", alignItems: "center", gap: 10 }}
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
          <span>Маркетплейс AI-агентов для бизнеса · Pre-launch</span>
        </div>

        <h1
          className="hf-hero-h1"
          style={{
            margin: "22px 0 0",
            lineHeight: 1.0,
            letterSpacing: "-0.04em",
            fontWeight: 700,
            color: "#eef2ff",
            textWrap: "balance",
          }}
        >
          Покупай готовые.
          <br />
          <span style={{ color: "oklch(0.68 0.19 195)" }}>Продавай</span> свои.
        </h1>

        <p
          className="hf-hero-sub"
          style={{
            margin: "22px 0 0",
            lineHeight: 1.55,
            color: "rgba(238,242,255,0.78)",
            maxWidth: 470,
            letterSpacing: "-0.005em",
          }}
        >
          Готовые AI-агенты в Docker — запусти за 5 минут. Или размести своего
          и получай выплаты автоматически.
        </p>

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
        </div>

        <div style={{ marginTop: 28 }}>
          <TrustPill />
        </div>
      </div>

      <div className="hf-hero-visual">
        <div
          className="hf-mono hf-hero-visual-tag"
          style={{
            position: "absolute",
            top: -22,
            right: 0,
            fontSize: 10,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "rgba(154,165,196,0.6)",
          }}
        >
          витрина · обе стороны на одном экране
        </div>
        <BrowserFrame />
      </div>
    </div>
  );
}
