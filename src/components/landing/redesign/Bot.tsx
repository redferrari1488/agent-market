"use client";

import { useRef } from "react";
import type { CSSProperties } from "react";

// Бот-фигурка (Claude Design handoff 2026-06-11): голова с моргающими
// глазами + антенна с pulse-точкой. Варианты:
// - idle — сидит на месте (дежурный у каталога)
// - peek — выглядывает из-за карточки (цикл translateY)
// - wave — машет рукой (футер)
// Тап/клик — подпрыгивает (boing), после анимации класс снимается, чтобы
// peek-цикл продолжился. Стили — globals.css (.hr-bot*).
//
// ВАЖНО: peek/boing анимируют transform — НЕ ставить бота внутрь
// preserve-3d родителя (FloatingCard), только сиблингом (см. lessons).

export function Bot({
  variant = "idle",
  title,
  style,
}: {
  variant?: "idle" | "peek" | "wave";
  title?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  const boing = () => {
    const el = ref.current;
    if (!el) return;
    el.classList.remove("hr-bot-boing");
    void el.offsetWidth;
    el.classList.add("hr-bot-boing");
  };

  return (
    <div
      ref={ref}
      className={`hr-bot${variant === "peek" ? " hr-bot-peek" : ""}`}
      style={style}
      title={title}
      aria-hidden="true"
      onClick={boing}
      onAnimationEnd={(e) => {
        if (e.animationName === "hr-bot-boing") {
          ref.current?.classList.remove("hr-bot-boing");
        }
      }}
    >
      <div className="hr-bot-antenna" />
      <div className="hr-bot-head">
        <span className="hr-bot-eye" />
        <span className="hr-bot-eye" />
        {variant === "wave" && <span className="hr-bot-arm" />}
      </div>
    </div>
  );
}
