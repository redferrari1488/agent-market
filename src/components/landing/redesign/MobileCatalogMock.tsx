"use client";

import Link from "next/link";
import { useState } from "react";
import type { CSSProperties } from "react";
import { CatChip, LiveDot, monoStyle } from "@/components/landing/redesign/shared";
import { TABS } from "@/components/landing/redesign/catalog-data";
import type { CatalogAgent } from "@/components/landing/redesign/catalog-data";

// Мобильный интерактивный мок каталога в hero (Claude Design handoff
// 2026-06-11, «Hireon Mobile v2»). Тот же мок, что на десктопе
// (CatalogPreview в HeroSplit), адаптированный под телефон: сетка
// 2 колонки, табы со свайпом, тап по карточке открывает детальную
// с ценой и кнопкой «Подключить». Без 3D-тилта — на тачах нет курсора.

const kickerStyle: CSSProperties = {
  ...monoStyle,
  fontSize: 9.5,
  color: "var(--hr-fg-4)",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
};

export function MobileCatalogMock({ catalog }: { catalog: CatalogAgent[] }) {
  const [selectedCat, setSelectedCat] = useState("все");
  const [selectedAgent, setSelectedAgent] = useState<CatalogAgent | null>(null);

  const filtered =
    selectedCat === "все"
      ? catalog.slice(0, 3)
      : catalog.filter((a) => a.cat === selectedCat).slice(0, 3);

  const path = selectedAgent
    ? `/agents/${selectedAgent.slug}`
    : selectedCat === "все"
      ? "/agents"
      : `/agents?cat=${selectedCat}`;

  return (
    <div
      style={{
        position: "relative",
        zIndex: 1,
        background: "var(--hr-bg-elev)",
        border: "1px solid var(--hr-border-1)",
        borderRadius: 16,
        padding: 14,
        boxShadow: "0 26px 60px -24px rgba(0,0,0,0.7)",
      }}
    >
      {/* browser bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "2px 2px 11px",
          borderBottom: "1px solid var(--hr-border-1)",
        }}
      >
        <div style={{ display: "flex", gap: 5 }}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                width: 9,
                height: 9,
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
            padding: "5px 9px",
            fontSize: 10.5,
            color: "var(--hr-fg-2)",
            display: "inline-flex",
            gap: 7,
            alignItems: "center",
            flex: 1,
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          <LiveDot size={5} />
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

      {selectedAgent ? (
        <MockDetail
          agent={selectedAgent}
          onBack={() => setSelectedAgent(null)}
        />
      ) : (
        <MockGrid
          catalog={catalog}
          filtered={filtered}
          selectedCat={selectedCat}
          onSelectCat={setSelectedCat}
          onSelectAgent={setSelectedAgent}
        />
      )}

      {/* foot */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 12,
          paddingTop: 10,
          borderTop: "1px solid var(--hr-border-1)",
        }}
      >
        <span style={{ ...kickerStyle, letterSpacing: "0.08em" }}>
          {selectedAgent
            ? `карточка · ${selectedAgent.slug}`
            : `показано ${filtered.length} из ${catalog.length + 1}`}
        </span>
        <Link
          href="/agents"
          style={{
            ...monoStyle,
            fontSize: 9.5,
            color: "var(--hr-fg-2)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            textDecoration: "none",
          }}
        >
          весь каталог →
        </Link>
      </div>
    </div>
  );
}

function MockGrid({
  catalog,
  filtered,
  selectedCat,
  onSelectCat,
  onSelectAgent,
}: {
  catalog: CatalogAgent[];
  filtered: CatalogAgent[];
  selectedCat: string;
  onSelectCat: (c: string) => void;
  onSelectAgent: (a: CatalogAgent) => void;
}) {
  return (
    <div>
      <div style={{ padding: "13px 2px 10px" }}>
        <div style={{ ...kickerStyle, marginBottom: 5 }}>
          каталог ·{" "}
          {selectedCat === "все"
            ? `${catalog.length + 1} агентов`
            : `категория «${selectedCat}»`}
        </div>
        <div
          style={{
            fontSize: 17,
            fontWeight: 600,
            letterSpacing: "-0.02em",
            color: "var(--hr-fg-1)",
          }}
        >
          Подбери агента под задачу
        </div>
      </div>

      {/* табы — горизонтальный свайп без скроллбара */}
      <div
        className="hr-phone-scroll"
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 12,
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {TABS.map((t) => {
          const active = t === selectedCat;
          return (
            <button
              key={t}
              type="button"
              onClick={() => onSelectCat(t)}
              style={{
                ...monoStyle,
                padding: "6px 11px",
                fontSize: 10,
                borderRadius: 6,
                background: active
                  ? "var(--hr-bg-elev-3)"
                  : "var(--hr-bg-elev-2)",
                color: active ? "var(--hr-fg-1)" : "var(--hr-fg-3)",
                border: active
                  ? "1px solid var(--hr-border-2)"
                  : "1px solid transparent",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
                cursor: "pointer",
                flex: "0 0 auto",
              }}
            >
              {t}
            </button>
          );
        })}
      </div>

      {/* сетка 2 колонки; key=selectedCat — переигрывает fade-in при смене таба */}
      <div
        key={selectedCat}
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
          minHeight: 204,
        }}
      >
        {filtered.map((a, i) => (
          <div
            key={a.id}
            className="hr-mmock-card"
            onClick={() => onSelectAgent(a)}
            style={{
              background: "var(--hr-bg-elev-2)",
              borderRadius: "0 0 12px 12px",
              padding: 11,
              display: "flex",
              flexDirection: "column",
              gap: 6,
              minHeight: 94,
              borderTop: `2px solid ${a.color}`,
              cursor: "pointer",
              animation: "hr-grid-in .4s ease both",
              animationDelay: `${i * 55}ms`,
            }}
          >
            <CatChip color={a.color}>{a.cat}</CatChip>
            <div
              style={{
                fontWeight: 600,
                fontSize: 13,
                lineHeight: 1.25,
                color: "var(--hr-fg-1)",
              }}
            >
              {a.title}
            </div>
            <div
              style={{
                marginTop: "auto",
                fontWeight: 600,
                fontSize: 13.5,
                color: "var(--hr-fg-1)",
              }}
            >
              {a.price}
            </div>
          </div>
        ))}
        <Link
          href="/seller"
          style={{
            border: "1.5px dashed var(--hr-border-3)",
            borderRadius: 12,
            background: "transparent",
            padding: 11,
            display: "flex",
            flexDirection: "column",
            gap: 6,
            minHeight: 94,
            position: "relative",
            textDecoration: "none",
            animation: "hr-grid-in .4s ease both",
            animationDelay: `${filtered.length * 55}ms`,
          }}
        >
          <CatChip color="var(--hr-fg-3)">слот · #06</CatChip>
          <div
            style={{
              position: "absolute",
              top: 9,
              right: 9,
              width: 19,
              height: 19,
              borderRadius: 6,
              background: "var(--hr-teal-soft)",
              color: "var(--hr-teal)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              fontWeight: 600,
              lineHeight: 1,
            }}
          >
            +
          </div>
          <div
            style={{
              fontWeight: 600,
              fontSize: 12.5,
              lineHeight: 1.25,
              color: "var(--hr-fg-1)",
            }}
          >
            Стать продавцом
          </div>
          <div
            style={{
              ...monoStyle,
              marginTop: "auto",
              fontSize: 9.5,
              color: "var(--hr-teal)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            разместить →
          </div>
        </Link>
      </div>
    </div>
  );
}

function MockDetail({
  agent,
  onBack,
}: {
  agent: CatalogAgent;
  onBack: () => void;
}) {
  const stats: Array<[string, string]> = [
    ["< 3 сек", "время"],
    ["24/7", "в работе"],
    ["1 клик", "запуск"],
  ];
  return (
    <div
      style={{
        padding: "13px 2px 2px",
        display: "flex",
        flexDirection: "column",
        gap: 11,
        minHeight: 270,
        animation: "hr-detail-in .35s ease-out",
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
            padding: "6px 11px",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 9.5,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
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
            fontSize: 19,
            color: "var(--hr-fg-1)",
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
          }}
        >
          {agent.title}
        </div>
        <div
          style={{
            marginTop: 5,
            display: "flex",
            alignItems: "baseline",
            gap: 8,
          }}
        >
          <span
            style={{
              fontSize: 25,
              fontWeight: 600,
              color: "var(--hr-teal)",
              letterSpacing: "-0.02em",
            }}
          >
            {agent.price}
          </span>
          <span style={{ ...monoStyle, fontSize: 10, color: "var(--hr-fg-4)" }}>
            / мес
          </span>
        </div>
      </div>

      <p
        style={{
          fontSize: 13,
          color: "var(--hr-fg-2)",
          lineHeight: 1.5,
          margin: 0,
        }}
      >
        {agent.desc || "Готовый AI-агент. Подключите за пару кликов."}
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          borderTop: "1px solid var(--hr-border-1)",
          borderBottom: "1px solid var(--hr-border-1)",
          padding: "9px 0",
        }}
      >
        {stats.map(([v, l], i) => (
          <div
            key={i}
            style={{
              padding: "0 5px",
              borderLeft: i > 0 ? "1px solid var(--hr-border-1)" : "none",
            }}
          >
            <div
              style={{
                fontWeight: 600,
                fontSize: 15,
                color: "var(--hr-fg-1)",
                letterSpacing: "-0.02em",
              }}
            >
              {v}
            </div>
            <div style={{ ...kickerStyle, marginTop: 4, fontSize: 8.5 }}>
              {l}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
        <Link
          href={`/agents/${agent.slug}`}
          className="hr-mlx-btn"
          style={{
            flex: 1,
            background: "var(--hr-teal)",
            color: "#062a30",
            padding: "13px 14px",
            borderRadius: 11,
            fontWeight: 600,
            fontSize: 14,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            textDecoration: "none",
          }}
        >
          Подключить
        </Link>
        <Link
          href={`/agents/${agent.slug}`}
          className="hr-mlx-btn"
          style={{
            border: "1px solid var(--hr-border-2)",
            color: "var(--hr-fg-1)",
            padding: "13px 14px",
            borderRadius: 11,
            fontWeight: 500,
            fontSize: 13,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          Демо
        </Link>
      </div>
    </div>
  );
}
