"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { sansStyle } from "@/components/landing/redesign/shared";

// Mobile hero — типографический постер (Hireon Design 2026-06-08, Direction 3).
// Заменил свайп-стопку карточек: крупный H1, воздух, два CTA. Системный
// гротеск вместо Onest. Один экран (above the fold), без живых анимаций —
// держим перф на телефоне. Имя экспорта сохранено, чтобы не трогать импорты.

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

export function MobileHeroStack() {
  return (
    <section
      style={{
        ...sansStyle,
        minHeight: "calc(100svh - 72px)",
        display: "flex",
        flexDirection: "column",
        padding: "28px 18px 40px",
        color: "var(--hr-fg-1)",
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          fontSize: 12,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--hr-fg-3)",
          fontWeight: 500,
        }}
      >
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: "var(--hr-teal)",
            flex: "none",
          }}
        />
        Маркетплейс AI-агентов
      </span>

      <h1
        style={{
          margin: "26px 0 0",
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
    </section>
  );
}
