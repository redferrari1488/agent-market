"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
  AgentCard,
  CatChip,
  Eyebrow,
  FloatingCard,
  GhostCTA,
  HeroBgFX,
  LiveDot,
  PrimaryCTA,
  SecondaryCTA,
  Stat,
  dotGridBg,
  monoStyle,
  onestStyle,
} from "@/components/landing/redesign/shared";
import type { Agent } from "@/components/agents/AgentCard";

// HeroSplit (Hireon Redesign 2026-05-16): Hero A с 3D floating card,
// engineering grid background и интерактивным catalog preview. Использует
// реальные данные агентов из БД, маппит на CSS-переменные --hr-cat-*.

const CAT_TOKEN: Record<string, { label: string; color: string }> = {
  monitoring: { label: "мониторинг", color: "var(--hr-cat-monitoring)" },
  content: { label: "контент", color: "var(--hr-cat-content)" },
  support: { label: "поддержка", color: "var(--hr-cat-support)" },
  analytics: { label: "аналитика", color: "var(--hr-cat-analytics)" },
  sales: { label: "продажи", color: "var(--hr-cat-sales)" },
};

const TABS = ["все", "поддержка", "контент", "аналитика", "продажи", "мониторинг"];

const FALLBACK = { label: "общее", color: "var(--hr-fg-3)" };

type CatalogAgent = {
  id: string;
  slug: string;
  cat: string;
  catKey: string;
  color: string;
  title: string;
  price: string;
  desc: string;
};

function formatPrice(minor: number | null): string {
  if (!minor || minor <= 0) return "—";
  const rub = Math.floor(minor / 100);
  return `${rub.toLocaleString("ru-RU").replace(/ /g, " ")} ₽`;
}

function adaptAgents(agents: Agent[]): CatalogAgent[] {
  return agents
    .filter((a) => a.status === "published" && !a.is_external)
    .map((a) => {
      const catKey = a.category || "";
      const cat = CAT_TOKEN[catKey] || FALLBACK;
      return {
        id: a.id,
        slug: a.slug,
        cat: cat.label,
        catKey,
        color: cat.color,
        title: a.name,
        price: formatPrice(a.price_monthly),
        desc: a.description || "",
      };
    });
}

export function HeroSplit({ agents }: { agents: Agent[] }) {
  const catalog = useMemo(() => adaptAgents(agents), [agents]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [eventCount, setEventCount] = useState(13115);
  const sensorRef = useRef<HTMLDivElement | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 880px)");
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (catalog.length === 0) return;
    const i1 = setInterval(
      () => setActiveIdx((i) => (i + 1) % Math.max(1, catalog.length)),
      4200,
    );
    const i2 = setInterval(
      () => setEventCount((n) => n + Math.floor(Math.random() * 4) + 1),
      1400,
    );
    return () => {
      clearInterval(i1);
      clearInterval(i2);
    };
  }, [catalog.length]);

  return (
    <section
      ref={sensorRef}
      style={{
        ...onestStyle,
        position: "relative",
        overflow: "hidden",
        background:
          "radial-gradient(ellipse 80% 60% at 30% 10%, #1d1d24 0%, #141418 60%)",
        color: "var(--hr-fg-1)",
        minHeight: isMobile ? "auto" : "min(100vh, 880px)",
        paddingTop: isMobile ? 20 : 60,
        paddingBottom: isMobile ? 36 : 60,
      }}
    >
      <HeroBgFX />
      {/* dot grid mask */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          ...dotGridBg("rgba(244,236,222,0.035)", 28),
          maskImage:
            "radial-gradient(ellipse 60% 50% at 50% 40%, #000 0%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 60% 50% at 50% 40%, #000 0%, transparent 100%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          maxWidth: 1280,
          margin: "0 auto",
          padding: isMobile ? "0 18px" : "0 60px",
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1.05fr 1fr",
          gap: isMobile ? 32 : 56,
          zIndex: 2,
          minWidth: 0,
        }}
      >
        <HeroLeft isMobile={isMobile} />
        {!isMobile && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              minWidth: 0,
            }}
          >
            <FloatingCard sensorRef={sensorRef}>
              <CatalogPreview
                catalog={catalog}
                activeIdx={activeIdx}
                eventCount={eventCount}
              />
            </FloatingCard>
          </div>
        )}
      </div>
    </section>
  );
}

function HeroLeft({ isMobile }: { isMobile: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        position: "relative",
        zIndex: 2,
        minWidth: 0,
      }}
    >
      <Eyebrow>Маркетплейс AI-агентов для бизнеса</Eyebrow>
      <h1
        style={{
          fontSize: isMobile ? "clamp(32px, 8.4vw, 48px)" : "clamp(56px, 6vw, 92px)",
          fontWeight: 700,
          lineHeight: 0.98,
          letterSpacing: "-0.035em",
          margin: "20px 0 0",
          color: "var(--hr-fg-1)",
          overflowWrap: "break-word",
          wordBreak: "break-word",
        }}
      >
        Покупай готовые.
        <br />
        <span style={{ color: "var(--hr-teal)" }}>Продавай свои.</span>
      </h1>
      <p
        style={{
          fontSize: isMobile ? 15 : 19,
          lineHeight: 1.5,
          color: "var(--hr-fg-2)",
          margin: isMobile ? "18px 0 0" : "28px 0 0",
          maxWidth: isMobile ? "100%" : 540,
          fontWeight: 400,
        }}
      >
        Готовые AI-сотрудники для бизнеса: отвечают на отзывы, обрабатывают
        заявки, следят за сайтом и собирают отчёты. Запуск за 5 минут — без
        разработчиков и интеграций.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile
            ? "repeat(2, 1fr)"
            : "repeat(4, auto)",
          gap: isMobile ? "18px 12px" : 56,
          marginTop: isMobile ? 26 : 44,
          paddingTop: isMobile ? 22 : 30,
          borderTop: "1px solid var(--hr-border-1)",
        }}
      >
        <Stat value="5" label="категорий" />
        <Stat value="1 клик" label="запуск" />
        <Stat value="24/7" label="в работе" />
        <Stat value="0%" label="комиссия первой волны" accent />
      </div>

      <div
        style={{
          display: "flex",
          alignItems: isMobile ? "stretch" : "center",
          flexDirection: isMobile ? "column" : "row",
          flexWrap: "wrap",
          gap: isMobile ? 10 : 14,
          marginTop: isMobile ? 24 : 36,
        }}
        className="hr-hero-ctas"
      >
        <PrimaryCTA size={isMobile ? "md" : "lg"} href="/agents">
          Найти агента
        </PrimaryCTA>
        <SecondaryCTA size={isMobile ? "md" : "lg"} href="/seller">
          Разместить агента
        </SecondaryCTA>
        {!isMobile && <GhostCTA href="#how">как это устроено</GhostCTA>}
      </div>

      <div
        style={{
          ...monoStyle,
          display: "flex",
          flexWrap: "wrap",
          gap: isMobile ? 12 : 32,
          marginTop: 28,
          fontSize: 11,
          color: "var(--hr-fg-3)",
          letterSpacing: "0.04em",
        }}
      >
        <span>отобранные агенты</span>
        <span style={{ color: "var(--hr-fg-4)" }}>/</span>
        <span>бесплатное размещение</span>
        <span style={{ color: "var(--hr-fg-4)" }}>/</span>
        <span>RU + crypto оплата</span>
      </div>
    </div>
  );
}

// ── Catalog Preview (inside FloatingCard) ───────────────────────────────
function CatalogPreview({
  catalog,
  activeIdx,
  eventCount,
  isMobile = false,
}: {
  catalog: CatalogAgent[];
  activeIdx: number;
  eventCount: number;
  isMobile?: boolean;
}) {
  const [selectedCat, setSelectedCat] = useState("все");
  const [selectedAgent, setSelectedAgent] = useState<CatalogAgent | null>(null);

  const filtered =
    selectedCat === "все"
      ? catalog.slice(0, 5)
      : catalog.filter((a) => a.cat === selectedCat).slice(0, 5);

  return (
    <div
      style={{
        width: isMobile ? "100%" : 540,
        background: "var(--hr-bg-elev)",
        border: "1px solid var(--hr-border-1)",
        borderRadius: 20,
        padding: isMobile ? 16 : 22,
        boxShadow:
          "0 30px 80px -20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(244,236,222,0.04)",
      }}
    >
      <BrowserHeader
        path={
          selectedAgent
            ? `/agents/${selectedAgent.slug}`
            : selectedCat === "все"
            ? "/agents"
            : `/agents?cat=${selectedCat}`
        }
        eventCount={eventCount}
      />

      {selectedAgent ? (
        <AgentDetail
          agent={selectedAgent}
          onBack={() => setSelectedAgent(null)}
        />
      ) : (
        <CatalogGrid
          selectedCat={selectedCat}
          onSelectCat={(c) => setSelectedCat(c)}
          filtered={filtered}
          activeIdx={activeIdx}
          totalCount={catalog.length}
          onSelectAgent={(a) => setSelectedAgent(a)}
          isMobile={isMobile}
        />
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 16,
          paddingTop: 12,
          borderTop: "1px solid var(--hr-border-1)",
        }}
      >
        <div
          style={{
            ...monoStyle,
            fontSize: 10,
            color: "var(--hr-fg-3)",
            letterSpacing: "0.08em",
          }}
        >
          {selectedAgent
            ? `карточка агента · ${selectedAgent.slug}`
            : `показано ${filtered.length} из ${catalog.length}`}
        </div>
        <Link
          href={selectedAgent ? "/agents" : "/agents"}
          style={{
            ...monoStyle,
            fontSize: 10,
            color: "var(--hr-fg-2)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            textDecoration: "none",
          }}
        >
          {selectedAgent ? "все агенты →" : "смотреть весь каталог →"}
        </Link>
      </div>
    </div>
  );
}

function BrowserHeader({
  path,
  eventCount,
}: {
  path: string;
  eventCount: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "4px 6px 14px",
        borderBottom: "1px solid var(--hr-border-1)",
      }}
    >
      <div style={{ display: "flex", gap: 6 }}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 11,
              height: 11,
              borderRadius: "50%",
              background: "var(--hr-bg-elev-3)",
            }}
          />
        ))}
      </div>
      <div
        style={{
          ...monoStyle,
          background: "var(--hr-bg-elev-2)",
          borderRadius: 6,
          padding: "6px 12px",
          fontSize: 11,
          color: "var(--hr-fg-2)",
          display: "inline-flex",
          gap: 8,
          alignItems: "center",
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        <LiveDot size={6} />
        <span>hireon.agency</span>
        <span
          style={{
            color: "var(--hr-fg-3)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {path}
        </span>
      </div>
      <div
        style={{
          ...monoStyle,
          display: "none",
          alignItems: "center",
          gap: 8,
          fontSize: 10.5,
          color: "var(--hr-fg-3)",
        }}
        className="hr-events-count"
      >
        <span style={{ color: "var(--hr-fg-1)", fontWeight: 500 }}>
          {eventCount.toLocaleString("ru-RU").replace(/ /g, " ")}
        </span>
        <span>событий</span>
      </div>
    </div>
  );
}

function CatalogGrid({
  selectedCat,
  onSelectCat,
  filtered,
  activeIdx,
  totalCount,
  onSelectAgent,
  isMobile,
}: {
  selectedCat: string;
  onSelectCat: (c: string) => void;
  filtered: CatalogAgent[];
  activeIdx: number;
  totalCount: number;
  onSelectAgent: (a: CatalogAgent) => void;
  isMobile: boolean;
}) {
  return (
    <div style={{ animation: "hr-grid-in 0.25s ease-out" }}>
      <div style={{ padding: "20px 4px 16px" }}>
        <div
          style={{
            ...monoStyle,
            fontSize: 10,
            color: "var(--hr-fg-3)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: 6,
          }}
        >
          каталог ·{" "}
          {selectedCat === "все"
            ? `${totalCount} ${totalCount === 1 ? "агент" : "агентов"}`
            : `категория «${selectedCat}»`}
        </div>
        <div
          style={{
            fontSize: isMobile ? 18 : 22,
            fontWeight: 600,
            letterSpacing: "-0.02em",
          }}
        >
          Подбери агента под задачу
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: isMobile ? "nowrap" : "wrap",
          gap: 6,
          marginBottom: 16,
          overflowX: isMobile ? "auto" : "visible",
          margin: isMobile ? "0 -16px 16px" : "0 0 16px",
          padding: isMobile ? "0 16px" : 0,
        }}
      >
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => onSelectCat(t)}
            style={{
              ...monoStyle,
              padding: "6px 12px",
              fontSize: 11,
              borderRadius: 6,
              background:
                t === selectedCat
                  ? "var(--hr-bg-elev-3)"
                  : "var(--hr-bg-elev-2)",
              color: t === selectedCat ? "var(--hr-fg-1)" : "var(--hr-fg-3)",
              border:
                t === selectedCat
                  ? "1px solid var(--hr-border-2)"
                  : "1px solid transparent",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            {t}
          </button>
        ))}
      </div>
      <div
        key={selectedCat}
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)",
          gap: 10,
          minHeight: 232,
          animation: "hr-grid-in 0.3s ease-out",
        }}
      >
        {filtered.map((a, i) => (
          <AgentCard
            key={a.id}
            cat={a.cat}
            catColor={a.color}
            title={a.title}
            price={a.price}
            accent={selectedCat === "все" && i === activeIdx % filtered.length}
            compact
            onClick={() => onSelectAgent(a)}
          />
        ))}
        {filtered.length < (isMobile ? 4 : 6) && (
          <AgentCard slot slotIdx="06" compact onClick={() => { window.location.href = "/seller"; }} />
        )}
      </div>
    </div>
  );
}

function AgentDetail({
  agent,
  onBack,
}: {
  agent: CatalogAgent;
  onBack: () => void;
}) {
  return (
    <div
      style={{
        padding: "20px 4px 4px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        animation: "hr-detail-in 0.35s ease-out",
        minHeight: 322,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            ...monoStyle,
            background: "var(--hr-bg-elev-2)",
            border: "1px solid var(--hr-border-1)",
            color: "var(--hr-fg-2)",
            padding: "6px 12px",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 10.5,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          ← к каталогу
        </button>
        <CatChip color={agent.color}>{agent.cat}</CatChip>
      </div>

      <div>
        <div
          style={{
            fontWeight: 600,
            fontSize: 22,
            color: "var(--hr-fg-1)",
            lineHeight: 1.2,
            letterSpacing: "-0.02em",
          }}
        >
          {agent.title}
        </div>
        <div style={{ marginTop: 8, display: "flex", alignItems: "baseline", gap: 8 }}>
          <span
            style={{
              fontSize: 30,
              fontWeight: 600,
              color: "var(--hr-teal)",
              letterSpacing: "-0.02em",
            }}
          >
            {agent.price}
          </span>
          <span
            style={{
              ...monoStyle,
              fontSize: 11,
              color: "var(--hr-fg-3)",
              letterSpacing: "0.06em",
            }}
          >
            / мес · без скрытых платежей
          </span>
        </div>
      </div>

      <p
        style={{
          fontSize: 13.5,
          color: "var(--hr-fg-2)",
          lineHeight: 1.55,
          margin: 0,
        }}
      >
        {agent.desc || "Готовый AI-агент. Подключите за пару кликов."}
      </p>

      <DetailStats />

      <div style={{ display: "flex", gap: 10, marginTop: "auto" }}>
        <Link
          href={`/agents/${agent.slug}`}
          style={{
            flex: 1,
            background: "var(--hr-teal)",
            color: "#062e36",
            border: "none",
            padding: "13px 18px",
            borderRadius: 10,
            fontWeight: 600,
            fontSize: 14,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            textDecoration: "none",
          }}
        >
          Подключить агента
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>
        <Link
          href={`/agents/${agent.slug}`}
          style={{
            background: "transparent",
            color: "var(--hr-fg-1)",
            border: "1px solid var(--hr-border-2)",
            padding: "13px 16px",
            borderRadius: 10,
            fontWeight: 500,
            fontSize: 13.5,
            cursor: "pointer",
            textDecoration: "none",
          }}
        >
          Демо
        </Link>
      </div>
    </div>
  );
}

function DetailStats() {
  const stats: Array<[string, string]> = [
    ["< 3 сек", "среднее время"],
    ["24/7", "в работе"],
    ["1 клик", "запуск"],
  ];
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 0,
        padding: "12px 0",
        borderTop: "1px solid var(--hr-border-1)",
        borderBottom: "1px solid var(--hr-border-1)",
      }}
    >
      {stats.map(([k, v], i) => (
        <div
          key={i}
          style={{
            padding: "0 6px",
            borderLeft: i > 0 ? "1px solid var(--hr-border-1)" : "none",
          }}
        >
          <div
            style={{
              fontWeight: 600,
              fontSize: 18,
              color: "var(--hr-fg-1)",
              letterSpacing: "-0.02em",
              lineHeight: 1,
            }}
          >
            {k}
          </div>
          <div
            style={{
              ...monoStyle,
              marginTop: 6,
              fontSize: 9.5,
              color: "var(--hr-fg-3)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {v}
          </div>
        </div>
      ))}
    </div>
  );
}
