"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Plus } from "lucide-react";
import type { Agent } from "@/components/agents/AgentCard";

type AgentCard = {
  cat: string;
  slug: string;
  cc: string;
  name: string;
  price: string;
};

const CC_BY_CATEGORY: Record<string, string> = {
  support: "oklch(0.74 0.13 195)",
  content: "oklch(0.74 0.16 85)",
  analytics: "oklch(0.72 0.16 285)",
  monitoring: "oklch(0.74 0.16 145)",
  sales: "oklch(0.7 0.17 25)",
};

const CAT_LABEL: Record<string, string> = {
  support: "поддержка",
  content: "контент",
  analytics: "аналитика",
  monitoring: "мониторинг",
  sales: "продажи",
};

const TRUST_ITEMS: { label: string; href: string }[] = [
  { label: "отобранные агенты", href: "/agents" },
  { label: "бесплатное размещение", href: "/seller" },
  { label: "RU + crypto оплата", href: "/about" },
];

const FILTERS: { label: string; query?: string }[] = [
  { label: "все" },
  { label: "поддержка", query: "support" },
  { label: "контент", query: "content" },
  { label: "аналитика", query: "analytics" },
];

const STATS: { num: string; label: string; accent?: boolean }[] = [
  { num: "5", label: "категорий" },
  { num: "1 клик", label: "запуск" },
  { num: "24/7", label: "в работе" },
  { num: "0%", label: "комиссия первой волны", accent: true },
];

function formatPrice(kopecks: number | null | undefined): string {
  if (!kopecks) return "—";
  const rub = Math.round(kopecks / 100);
  return `${rub.toLocaleString("ru-RU").replace(/\s/g, " ")} ₽`;
}

function buildCatalog(agents: Agent[]): AgentCard[] {
  // dedupe by category — берём по одному агенту на категорию,
  // чтобы 5 mini-карточек охватывали разные разделы каталога
  const seen = new Set<string>();
  const picked: Agent[] = [];
  for (const a of agents) {
    const cat = a.category ?? "support";
    if (seen.has(cat)) continue;
    seen.add(cat);
    picked.push(a);
    if (picked.length >= 5) break;
  }
  return picked.map((a) => {
    const cat = a.category ?? "support";
    return {
      cat: CAT_LABEL[cat] ?? cat,
      slug: a.slug,
      cc: CC_BY_CATEGORY[cat] ?? "oklch(0.74 0.13 195)",
      name: a.name,
      price: formatPrice(a.price_monthly),
    };
  });
}

function CatalogMini({ a }: { a: AgentCard }) {
  return (
    <Link
      href={`/agents/${a.slug}`}
      className="hf-catalog-mini"
      style={
        {
          position: "relative",
          display: "flex",
          flexDirection: "column",
          background: "rgba(10, 9, 8, 0.55)",
          border: "1px solid var(--hc-line-1)",
          borderRadius: 2,
          overflow: "hidden",
          minHeight: 110,
          textDecoration: "none",
          color: "inherit",
          transition: "border-color .15s, background .15s, transform .15s",
          "--cc": a.cc,
        } as React.CSSProperties
      }
    >
      <div className="hf-catalog-strip" />
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
            color: "var(--hc-fg)",
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
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: "-0.014em",
            color: "var(--hc-fg)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {a.price}
        </div>
      </div>
    </Link>
  );
}

function SellerSlot() {
  return (
    <Link
      href="/seller"
      className="hf-seller-slot"
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        background:
          "radial-gradient(130% 90% at 50% 30%, oklch(0.74 0.13 195 / 0.08), transparent 65%)",
        border: "1.4px dashed oklch(0.74 0.13 195 / 0.55)",
        borderRadius: 2,
        padding: 12,
        minHeight: 110,
        overflow: "hidden",
        textDecoration: "none",
        color: "inherit",
        transition: "background .15s, border-color .15s",
      }}
    >
      {(["tl", "tr", "bl", "br"] as const).map((p) => {
        const pos: React.CSSProperties = {
          tl: {
            top: -1,
            left: -1,
            borderTop: "1px solid oklch(0.74 0.13 195)",
            borderLeft: "1px solid oklch(0.74 0.13 195)",
          },
          tr: {
            top: -1,
            right: -1,
            borderTop: "1px solid oklch(0.74 0.13 195)",
            borderRight: "1px solid oklch(0.74 0.13 195)",
          },
          bl: {
            bottom: -1,
            left: -1,
            borderBottom: "1px solid oklch(0.74 0.13 195)",
            borderLeft: "1px solid oklch(0.74 0.13 195)",
          },
          br: {
            bottom: -1,
            right: -1,
            borderBottom: "1px solid oklch(0.74 0.13 195)",
            borderRight: "1px solid oklch(0.74 0.13 195)",
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
            color: "oklch(0.74 0.13 195)",
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
            background: "oklch(0.74 0.13 195 / 0.14)",
            border: "1px solid oklch(0.74 0.13 195 / 0.55)",
            color: "oklch(0.74 0.13 195)",
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
          color: "var(--hc-fg)",
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
          color: "rgba(241,235,224,0.36)",
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
          justifyContent: "flex-end",
          alignItems: "center",
        }}
      >
        <span
          className="hf-mono"
          style={{
            fontSize: 10.5,
            color: "oklch(0.74 0.13 195)",
            letterSpacing: "0.06em",
          }}
        >
          разместить →
        </span>
      </div>
    </Link>
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
          background: "oklch(0.74 0.13 195)",
          boxShadow: "0 0 8px oklch(0.74 0.13 195 / 0.5)",
          alignSelf: "center",
          display: "inline-block",
        }}
      />
      <span
        style={{
          fontSize: 13,
          color: "var(--hc-fg)",
          fontVariantNumeric: "tabular-nums",
          letterSpacing: "-0.005em",
        }}
      >
        {n.toLocaleString("ru-RU")}
      </span>
      <span
        style={{
          fontSize: 10,
          color: "rgba(241,235,224,0.36)",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
        }}
      >
        событий · сегодня
      </span>
    </div>
  );
}

function BrowserFrame({ catalog }: { catalog: AgentCard[] }) {
  return (
    <div
      className="hf-browser-frame"
      style={{
        position: "relative",
        background: "var(--hc-bg-1)",
        border: "1px solid var(--hc-line-3)",
        borderRadius: 6,
        overflow: "hidden",
        backdropFilter: "blur(18px) saturate(1.1)",
        WebkitBackdropFilter: "blur(18px) saturate(1.1)",
        boxShadow:
          "0 60px 140px -20px rgba(0,0,0,0.5), 0 1px 0 var(--hc-line-1) inset",
      }}
    >
      {/* chrome */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "9px 12px",
          borderBottom: "1px solid var(--hc-line-1)",
          background: "rgba(0, 0, 0, 0.18)",
        }}
      >
        <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: "var(--hc-line-2)" }} />
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: "var(--hc-line-2)" }} />
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: "var(--hc-line-2)" }} />
        </div>
        <Link
          href="/agents"
          className="hf-mono"
          style={{
            marginLeft: 10,
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: 8,
            height: 24,
            padding: "0 10px",
            background: "rgba(244,236,222,0.03)",
            border: "1px solid var(--hc-line-1)",
            borderRadius: 2,
            fontSize: 10.5,
            color: "rgba(241,235,224,0.56)",
            overflow: "hidden",
            minWidth: 0,
            textDecoration: "none",
          }}
        >
          <span style={{ color: "oklch(0.74 0.13 195)", opacity: 0.85, fontSize: 9 }}>●</span>
          <span style={{ color: "rgba(241,235,224,0.36)" }}>hireon.agency</span>
          <span style={{ color: "var(--hc-fg)" }}>/agents</span>
        </Link>
        <ActivityTicker />
      </div>

      {/* inner */}
      <div className="hf-browser-inner" style={{ padding: "18px 18px 16px" }}>
        {/* title block */}
        <div className="hf-browser-head">
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
            <span style={{ color: "rgba(241,235,224,0.20)" }}>·</span>
            <span style={{ color: "var(--hc-fg)" }}>47 агентов</span>
          </div>
          <div
            style={{
              marginTop: 6,
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: "-0.018em",
              color: "var(--hc-fg)",
            }}
          >
            Подберите агента под задачу
          </div>
        </div>

        {/* filter row — отдельный ряд под заголовком, full-width */}
        <div className="hf-browser-filters">
          {FILTERS.map((f, i) => (
            <Link
              key={f.label}
              href={f.query ? `/agents?category=${f.query}` : "/agents"}
              className="hf-mono hf-browser-chip"
              data-active={i === 0 ? "true" : undefined}
              style={{
                padding: "4px 9px",
                fontSize: 9.5,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: i === 0 ? "#f1ebe0" : "rgba(241,235,224,0.36)",
                background: i === 0 ? "rgba(244,236,222,0.04)" : "transparent",
                border: `1px solid ${i === 0 ? "var(--hc-line-3)" : "var(--hc-line-1)"}`,
                borderRadius: 2,
                whiteSpace: "nowrap",
                textDecoration: "none",
              }}
            >
              {f.label}
            </Link>
          ))}
        </div>

        <div className="hf-browser-grid">
          {catalog.map((a) => (
            <CatalogMini key={a.slug} a={a} />
          ))}
          <SellerSlot />
        </div>

        {/* footer strip — только CTA, счётчики уже в StatRibbon слева */}
        <div className="hf-browser-footer">
          <Link
            href="/agents"
            className="hf-mono"
            style={{
              fontSize: 10.5,
              color: "rgba(241,235,224,0.56)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              textDecoration: "none",
              transition: "color .15s",
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
      className="hf-mono hf-trust-strip"
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 0,
        fontSize: 10.5,
        letterSpacing: "0.06em",
        color: "rgba(241,235,224,0.56)",
        rowGap: 8,
      }}
    >
      {TRUST_ITEMS.map((t, i) => (
        <span key={t.label} style={{ display: "inline-flex", alignItems: "center" }}>
          {i > 0 && (
            <span
              aria-hidden
              style={{ margin: "0 12px", color: "rgba(241,235,224,0.20)" }}
            >
              /
            </span>
          )}
          <Link
            href={t.href}
            className="hf-trust-item"
            style={{
              whiteSpace: "nowrap",
              color: "inherit",
              textDecoration: "none",
              transition: "color .15s",
            }}
          >
            {t.label}
          </Link>
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
              i === 0 ? "none" : "1px solid var(--hc-line-1)",
          }}
        >
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "-0.022em",
              color: s.accent ? "oklch(0.74 0.13 195)" : "#f1ebe0",
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
              color: "rgba(241,235,224,0.36)",
            }}
          >
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}

export function HeroSplit({ agents = [] }: { agents?: Agent[] }) {
  const catalog = buildCatalog(agents);
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
              background: "oklch(0.74 0.13 195)",
              boxShadow: "0 0 8px oklch(0.74 0.13 195 / 0.5)",
              display: "inline-block",
            }}
          />
          <span>Маркетплейс AI-агентов для бизнеса</span>
        </div>

        <h1
          className="hf-hero-h1"
          style={{
            margin: "20px 0 0",
            color: "var(--hc-fg)",
          }}
        >
          <span style={{ display: "block" }}>Покупай готовые.</span>
          <span style={{ display: "block" }}>
            <span style={{ color: "oklch(0.74 0.13 195)" }}>Продавай</span> свои.
          </span>
        </h1>

        <p
          className="hf-hero-sub"
          style={{
            margin: "22px 0 0",
            lineHeight: 1.55,
            color: "var(--hc-fg-1)",
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
              style={{ color: "oklch(0.74 0.13 195)" }}
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
              color: "rgba(241,235,224,0.36)",
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
        <BrowserFrame catalog={catalog} />
      </div>
    </div>
  );
}
