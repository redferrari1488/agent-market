"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
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
  monoStyle,
  onestStyle,
} from "@/components/landing/redesign/shared";
import type { Agent } from "@/components/agents/AgentCard";

// HeroSplit (Hireon Redesign Final Fix 2026-05-16):
// - Компактный hero: padY 56px, mock 480px, h1 clamp(48, 5.2vw, 76)
// - Фон solid var(--hr-bg-base) (warm dark) — единый с post-hero секциями
// - 3D-мок с teal-обводкой (FloatingCard), tilt от курсора через rAF
// - Убраны auto-cycles (activeIdx 4.2s + eventCount 1.4s) — они вызывали
//   re-render всего CatalogPreview и были источниками мерцания

const CAT_TOKEN: Record<string, { label: string; color: string }> = {
  monitoring: { label: "мониторинг", color: "var(--hr-cat-monitoring)" },
  content: { label: "контент", color: "var(--hr-cat-content)" },
  support: { label: "поддержка", color: "var(--hr-cat-support)" },
  analytics: { label: "аналитика", color: "var(--hr-cat-analytics)" },
  sales: { label: "продажи", color: "var(--hr-cat-sales)" },
};

const TABS = ["все", "поддержка", "контент", "аналитика", "продажи", "мониторинг"];

const FALLBACK = { label: "общее", color: "var(--hr-fg-3)" };

// Демо-карточки если БД пустая — мок должен выглядеть «как на дизайне»
// даже до первого опубликованного агента.
const DEMO_AGENTS: CatalogAgent[] = [
  {
    id: "demo-1",
    slug: "telegram-support-bot",
    cat: "поддержка",
    catKey: "support",
    color: "var(--hr-cat-support)",
    title: "Бот поддержки в Telegram",
    price: "2 990 ₽",
    desc: "Отвечает 24/7, ведёт диалоги, эскалирует сложные.",
  },
  {
    id: "demo-2",
    slug: "content-writer",
    cat: "контент",
    catKey: "content",
    color: "var(--hr-cat-content)",
    title: "Контент-копирайтер",
    price: "990 ₽",
    desc: "Готовит еженедельный план постов и пишет драфты.",
  },
  {
    id: "demo-3",
    slug: "website-monitor",
    cat: "мониторинг",
    catKey: "monitoring",
    color: "var(--hr-cat-monitoring)",
    title: "Мониторинг сайтов",
    price: "1 490 ₽",
    desc: "Любые 4xx/5xx и diff контента — push в Telegram.",
  },
  {
    id: "demo-4",
    slug: "news-digest-bot",
    cat: "контент",
    catKey: "content",
    color: "var(--hr-cat-content)",
    title: "Новостной дайджест",
    price: "1 500 ₽",
    desc: "Сводка отрасли по твоим RSS и каналам утром.",
  },
  {
    id: "demo-5",
    slug: "competitor-monitor",
    cat: "мониторинг",
    catKey: "monitoring",
    color: "var(--hr-cat-monitoring)",
    title: "Мониторинг конкурентов",
    price: "2 500 ₽",
    desc: "Утренний отчёт что конкуренты выкатили вчера.",
  },
];

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
  return `${rub.toLocaleString("ru-RU")} ₽`;
}

function adaptAgents(agents: Agent[]): CatalogAgent[] {
  const real = agents
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
  // Fallback на demo если в БД меньше 5 опубликованных
  return real.length >= 5 ? real : DEMO_AGENTS;
}

export function HeroSplit({ agents }: { agents: Agent[] }) {
  const catalog = useMemo(() => adaptAgents(agents), [agents]);
  const sensorRef = useRef<HTMLDivElement | null>(null);

  return (
    <section
      ref={sensorRef}
      className="hr-desktop-only"
      style={{
        ...onestStyle,
        position: "relative",
        overflow: "hidden",
        background: "var(--hr-bg-base)",
        color: "var(--hr-fg-1)",
        paddingTop: 56,
        paddingBottom: 56,
        borderBottom: "1px solid var(--hr-border-1)",
      }}
    >
      <HeroBgFX glow scanlines={false} />

      <div
        style={{
          position: "relative",
          maxWidth: 1240,
          margin: "0 auto",
          padding: "0 28px",
          display: "grid",
          gridTemplateColumns: "1.04fr 1fr",
          gap: 48,
          zIndex: 2,
          minWidth: 0,
        }}
      >
        <HeroLeft />
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
            <CatalogPreview catalog={catalog} />
          </FloatingCard>
        </div>
      </div>
    </section>
  );
}

function HeroLeft() {
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
          fontSize: "clamp(48px, 5.2vw, 76px)",
          fontWeight: 700,
          lineHeight: 0.98,
          letterSpacing: "-0.035em",
          margin: "18px 0 0",
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
          fontSize: 17,
          lineHeight: 1.5,
          color: "var(--hr-fg-2)",
          margin: "22px 0 0",
          maxWidth: 520,
          fontWeight: 400,
        }}
      >
        Готовые AI-сотрудники для бизнеса: отвечают на отзывы, обрабатывают
        заявки, следят за сайтом и собирают отчёты. Запуск за 5 минут - без
        разработчиков и интеграций.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, auto)",
          gap: 48,
          marginTop: 32,
          paddingTop: 24,
          borderTop: "1px solid var(--hr-border-1)",
        }}
      >
        <Stat value="5" label="категорий" />
        <Stat value="1 клик" label="запуск" />
        <Stat value="24/7" label="в работе" />
        <Stat value="0%" label="комиссия первой волны" accent />
      </div>

      <div
        className="hr-hero-ctas"
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          marginTop: 28,
        }}
      >
        <PrimaryCTA size="md" href="/agents">
          Найти агента
        </PrimaryCTA>
        <SecondaryCTA size="md" href="/seller">
          Разместить агента
        </SecondaryCTA>
        <GhostCTA href="#how">как это устроено</GhostCTA>
      </div>

      <div
        style={{
          ...monoStyle,
          display: "flex",
          flexWrap: "wrap",
          gap: 24,
          marginTop: 22,
          fontSize: 10.5,
          color: "var(--hr-fg-4)",
          letterSpacing: "0.04em",
        }}
      >
        <span>отобранные агенты</span>
        <span style={{ opacity: 0.5 }}>/</span>
        <span>бесплатное размещение</span>
        <span style={{ opacity: 0.5 }}>/</span>
        <span>RU + crypto оплата</span>
      </div>
    </div>
  );
}

// ── Catalog Preview (внутри FloatingCard) ───────────────────────────────
function CatalogPreview({ catalog }: { catalog: CatalogAgent[] }) {
  const [selectedCat, setSelectedCat] = useState("все");
  const [selectedAgent, setSelectedAgent] = useState<CatalogAgent | null>(null);

  const filtered =
    selectedCat === "все"
      ? catalog.slice(0, 5)
      : catalog.filter((a) => a.cat === selectedCat).slice(0, 5);

  return (
    <div
      style={{
        width: 480,
        background: "var(--hr-bg-elev)",
        border: "1px solid var(--hr-border-1)",
        borderRadius: 20,
        padding: 18,
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
      />

      {selectedAgent ? (
        <AgentDetail agent={selectedAgent} onBack={() => setSelectedAgent(null)} />
      ) : (
        <CatalogGrid
          selectedCat={selectedCat}
          onSelectCat={setSelectedCat}
          filtered={filtered}
          totalCount={catalog.length}
          onSelectAgent={setSelectedAgent}
        />
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 14,
          paddingTop: 10,
          borderTop: "1px solid var(--hr-border-1)",
        }}
      >
        <div
          style={{
            ...monoStyle,
            fontSize: 10,
            color: "var(--hr-fg-4)",
            letterSpacing: "0.08em",
          }}
        >
          {selectedAgent
            ? `карточка · ${selectedAgent.slug}`
            : `показано ${filtered.length} из ${catalog.length + 1}`}
        </div>
        <Link
          href="/agents"
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

function BrowserHeader({ path }: { path: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "2px 4px 12px",
        borderBottom: "1px solid var(--hr-border-1)",
      }}
    >
      <div style={{ display: "flex", gap: 6 }}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 10,
              height: 10,
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
          padding: "5px 10px",
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
        {/* pulse=false — opacity-pulse у родителя с rAF transform всё равно
            даёт compositor flicker (синий кружок мигает). Точка статична. */}
        <LiveDot size={6} pulse={false} />
        <span>hireon.agency</span>
        <span
          style={{
            color: "var(--hr-fg-4)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {path}
        </span>
      </div>
    </div>
  );
}

function CatalogGrid({
  selectedCat,
  onSelectCat,
  filtered,
  totalCount,
  onSelectAgent,
}: {
  selectedCat: string;
  onSelectCat: (c: string) => void;
  filtered: CatalogAgent[];
  totalCount: number;
  onSelectAgent: (a: CatalogAgent) => void;
}) {
  return (
    <div>
      <div style={{ padding: "16px 4px 12px" }}>
        <div
          style={{
            ...monoStyle,
            fontSize: 10,
            color: "var(--hr-fg-4)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: 6,
          }}
        >
          каталог · {selectedCat === "все"
            ? `${totalCount + 1} агентов`
            : `категория «${selectedCat}»`}
        </div>
        <div
          style={{
            fontSize: 20,
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
          flexWrap: "wrap",
          gap: 6,
          marginBottom: 14,
        }}
      >
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => onSelectCat(t)}
            style={{
              ...monoStyle,
              padding: "5px 11px",
              fontSize: 10.5,
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
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 8,
          minHeight: 218,
        }}
      >
        {filtered.map((a) => (
          <AgentCard
            key={a.id}
            cat={a.cat}
            catColor={a.color}
            title={a.title}
            price={a.price}
            compact
            onClick={() => onSelectAgent(a)}
          />
        ))}
        {filtered.length < 6 && (
          <AgentCard
            slot
            slotIdx="06"
            compact
            onClick={() => {
              window.location.href = "/seller";
            }}
          />
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
        padding: "16px 4px 4px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        animation: "hr-fade-in 0.35s ease-out",
        minHeight: 296,
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
            padding: "5px 11px",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 10,
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
            fontSize: 21,
            color: "var(--hr-fg-1)",
            lineHeight: 1.2,
            letterSpacing: "-0.02em",
          }}
        >
          {agent.title}
        </div>
        <div
          style={{
            marginTop: 6,
            display: "flex",
            alignItems: "baseline",
            gap: 8,
          }}
        >
          <span
            style={{
              fontSize: 28,
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
              fontSize: 10.5,
              color: "var(--hr-fg-4)",
              letterSpacing: "0.06em",
            }}
          >
            / мес · без скрытых платежей
          </span>
        </div>
      </div>

      <p
        style={{
          fontSize: 13,
          color: "var(--hr-fg-2)",
          lineHeight: 1.55,
          margin: 0,
        }}
      >
        {agent.desc || "Готовый AI-агент. Подключите за пару кликов."}
      </p>

      <DetailStats />

      <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
        <Link
          href={`/agents/${agent.slug}`}
          style={{
            flex: 1,
            background: "var(--hr-teal)",
            color: "#062e36",
            border: "none",
            padding: "12px 16px",
            borderRadius: 10,
            fontWeight: 600,
            fontSize: 13.5,
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
            width="13"
            height="13"
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
            padding: "12px 14px",
            borderRadius: 10,
            fontWeight: 500,
            fontSize: 13,
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
    ["< 3 сек", "среднее время"],
    ["24/7", "в работе"],
    ["1 клик", "запуск"],
  ];
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 0,
        padding: "10px 0",
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
              fontSize: 16,
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
              marginTop: 5,
              fontSize: 9,
              color: "var(--hr-fg-4)",
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
