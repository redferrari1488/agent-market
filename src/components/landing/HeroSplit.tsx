"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import {
  AgentCard,
  CatChip,
  FloatingCard,
  HeroBgFX,
  LiveDot,
  PrimaryCTA,
  SecondaryCTA,
  monoStyle,
  onestStyle,
} from "@/components/landing/redesign/shared";
import { Bot } from "@/components/landing/redesign/Bot";
import { TABS, adaptAgents } from "@/components/landing/redesign/catalog-data";
import type { CatalogAgent } from "@/components/landing/redesign/catalog-data";
import type { Agent } from "@/components/agents/AgentCard";

// HeroSplit (Hireon Redesign Final Fix 2026-05-16):
// - Компактный hero: padY 56px, mock 480px, h1 clamp(48, 5.2vw, 76)
// - Фон solid var(--hr-bg-base) (warm dark) — единый с post-hero секциями
// - 3D-мок с teal-обводкой (FloatingCard), tilt от курсора через rAF
// - Убраны auto-cycles (activeIdx 4.2s + eventCount 1.4s) — они вызывали
//   re-render всего CatalogPreview и были источниками мерцания
// - 2026-06-11 (Landing v4): hero разгружен — eyebrow, блок 4 статов и
//   третья CTA убраны, вместо них одна mono-строка метаданных. Liquid
//   glass: дрейфующие линзы с SVG-преломлением, стеклянная secondary CTA.
//   Бейдж «live · каталог» снят по фидбеку юзера. Данные мока —
//   catalog-data.ts, бот-фигурка за моком.

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

      {/* SVG-дисторсия для линз: feTurbulence + feDisplacementMap, реальное
          преломление фона через backdrop-filter: url(#liquid-refract) */}
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <filter id="liquid-refract" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.012 0.018"
            numOctaves={2}
            seed={7}
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale={22}
            xChannelSelector="R"
            yChannelSelector="G"
          />
          <feGaussianBlur stdDeviation={1.2} />
        </filter>
      </svg>
      <div
        aria-hidden
        className="hr-lens hr-lens--refract"
        style={{ width: 190, height: 190, top: "9%", left: "41%" }}
      />
      <div
        aria-hidden
        className="hr-lens hr-lens--refract hr-lens--2"
        style={{ width: 110, height: 110, bottom: "14%", left: "50%" }}
      />
      <div
        aria-hidden
        className="hr-lens hr-lens--refract hr-lens--3"
        style={{ width: 70, height: 70, top: "24%", right: "4%" }}
      />

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
          {/* Бот выглядывает из-за верхней кромки мока. Сиблинг FloatingCard
              (transform-анимации внутрь preserve-3d родителя нельзя — lessons),
              z:0 под моком (z:1). */}
          <div style={{ position: "relative" }}>
            <Bot
              variant="peek"
              title="агент №7 наблюдает"
              style={{ top: -33, right: 64 }}
            />
            <div style={{ position: "relative", zIndex: 1 }}>
              <FloatingCard sensorRef={sensorRef}>
                <CatalogPreview catalog={catalog} />
              </FloatingCard>
            </div>
          </div>
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
      <h1
        style={{
          fontSize: "clamp(48px, 5.2vw, 76px)",
          fontWeight: 700,
          lineHeight: 0.98,
          letterSpacing: "-0.035em",
          margin: 0,
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
          maxWidth: 460,
          fontWeight: 400,
        }}
      >
        Готовые AI-сотрудники: отвечают на заявки, ведут контент, следят за
        сайтом.{" "}
        <b style={{ fontWeight: 600, color: "var(--hr-fg-1)" }}>
          Запуск за 5 минут
        </b>{" "}
        — без разработчиков.
      </p>

      <div
        className="hr-hero-ctas"
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          marginTop: 32,
        }}
      >
        <PrimaryCTA size="md" href="/agents">
          Найти агента
        </PrimaryCTA>
        <SecondaryCTA size="md" href="/seller" icon="" glass>
          Разместить агента
        </SecondaryCTA>
      </div>

      <div
        style={{
          ...monoStyle,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 10,
          marginTop: 26,
          fontSize: 11,
          color: "var(--hr-fg-4)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        <span>5 категорий</span>
        <MetaDot />
        <span>24/7 в работе</span>
        <MetaDot />
        <span style={{ color: "var(--hr-teal)" }}>
          0% комиссии первой волны
        </span>
      </div>
    </div>
  );
}

function MetaDot() {
  return (
    <span
      aria-hidden
      style={{
        width: 3,
        height: 3,
        borderRadius: "50%",
        background: "var(--hr-border-3)",
        flex: "0 0 auto",
      }}
    />
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

      {/* Фикс высоты переключаемой области: grid (~406px) выше, чем detail
          (~296px). Без этого клик по агенту резко ужимал мок на ~110px и
          дёргал весь hero. minHeight по grid-состоянию + AgentDetail flex:1
          → высота карточки постоянна, рефлоу нет. */}
      <div style={{ display: "flex", flexDirection: "column", minHeight: 406 }}>
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
      </div>

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
        justifyContent: "space-between",
        gap: 12,
        animation: "hr-fade-in 0.35s ease-out",
        minHeight: 296,
        flex: 1,
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

      <div style={{ display: "flex", gap: 8 }}>
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
