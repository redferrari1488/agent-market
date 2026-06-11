"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { CSSProperties } from "react";
import { FloatingCard, sansStyle } from "@/components/landing/redesign/shared";
import { Bot } from "@/components/landing/redesign/Bot";
import { MobileCatalogMock } from "@/components/landing/redesign/MobileCatalogMock";
import { adaptAgents } from "@/components/landing/redesign/catalog-data";
import type { Agent } from "@/components/agents/AgentCard";

// Mobile hero — типографический постер (Hireon Design 2026-06-08) +
// интерактивный мок каталога и бот-фигурка (Claude Design handoff
// 2026-06-11, «Hireon Mobile v2»). Эйбрау «Маркетплейс AI-агентов» убран —
// hero разгружен. Системный гротеск вместо Onest.

const btnBase: CSSProperties = {
  height: 54,
  borderRadius: 13,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 16,
  fontWeight: 600,
  letterSpacing: "-0.005em",
  textDecoration: "none",
};

export function MobileHeroStack({ agents }: { agents: Agent[] }) {
  const catalog = useMemo(() => adaptAgents(agents), [agents]);

  return (
    <section
      style={{
        ...sansStyle,
        position: "relative",
        minHeight: "calc(100svh - 72px)",
        display: "flex",
        flexDirection: "column",
        padding: "28px 18px 44px",
        color: "var(--hr-fg-1)",
      }}
    >
      {/* дрейфующая стеклянная линза (liquid glass, только blur на мобиле) */}
      <div
        aria-hidden
        className="hr-lens"
        style={{ width: 96, height: 96, top: "13%", right: "8%" }}
      />
      <h1
        style={{
          margin: 0,
          fontSize: "clamp(46px, 15.5vw, 64px)",
          lineHeight: 0.94,
          letterSpacing: "-0.032em",
          fontWeight: 700,
          color: "var(--hr-fg-1)",
        }}
      >
        Покупай
        <br />
        готовые.
        <br />
        <span style={{ color: "var(--hr-fg-3)" }}>Продавай</span>
        <br />
        <span style={{ color: "var(--hr-teal)" }}>свои.</span>
      </h1>

      <div style={{ flex: "1 1 auto", minHeight: 28 }} />

      <p
        className="hr-mlx-sub"
        style={{
          margin: "0 0 26px",
          fontSize: 16.5,
          lineHeight: 1.5,
          color: "var(--hr-fg-2)",
          maxWidth: "31ch",
        }}
      >
        Готовые AI-сотрудники для бизнеса&nbsp;- отвечают на заявки, ведут
        контент, следят за сайтом.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
        <Link
          className="hr-mlx-btn"
          href="/agents"
          style={{ ...btnBase, background: "var(--hr-teal)", color: "#062a30" }}
        >
          Найти агента
        </Link>
        <Link
          className="hr-mlx-btn"
          href="/seller"
          style={{
            ...btnBase,
            background: "transparent",
            color: "var(--hr-fg-1)",
            border: "1px solid var(--hr-border-3)",
          }}
        >
          Разместить агента
        </Link>
      </div>

      {/* Интерактивный мок каталога — как на десктопе, в том же 3D
          (статичный наклон + парение; реакция на курсор на тачах не
          сработает — mousemove нет). Углы меньше десктопных: на узком
          экране rotateY -8° съедает слишком много ширины. Бот выглядывает
          из-за верхней кромки мока (сиблинг preserve-3d родителя, z:0). */}
      <div style={{ position: "relative", marginTop: 34 }}>
        <Bot
          variant="peek"
          title="агент №7 наблюдает"
          style={{ top: -33, right: 26 }}
        />
        <div style={{ position: "relative", zIndex: 1 }}>
          <FloatingCard baseRotY={-5} baseRotX={2} depth={18} radius={16} fluid>
            <MobileCatalogMock catalog={catalog} />
          </FloatingCard>
        </div>
      </div>
    </section>
  );
}
