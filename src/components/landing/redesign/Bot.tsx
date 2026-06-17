"use client";

import { useRef } from "react";
import type { CSSProperties } from "react";

// Бот-фигурка (Claude Design handoff 2026-06-11): голова с моргающими
// глазами + антенна с pulse-точкой. Варианты:
// - idle — сидит на месте (дежурный у каталога)
// - peek — выглядывает из-за карточки (цикл translateY)
// - wave — машет рукой (футер)
// Тап/клик — подпрыгивает (boing). boing живёт на ВНУТРЕННЕМ слое
// (.hr-bot-boing-layer), а peek/idle — на корне: иначе две animation-shorthand
// на одном узле перетирают друг друга и после boing peek рестартует с 0%
// (мгновенный скачок). На разных слоях transform'ы композятся — boing
// складывается поверх peek и мягко садится обратно. Стили — globals.css (.hr-bot*).
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
      className={`hr-bot${variant === "peek" ? " hr-bot-peek" : ""}`}
      style={style}
      title={title}
      aria-hidden="true"
      onClick={boing}
    >
      <div
        ref={ref}
        className="hr-bot-boing-layer"
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
    </div>
  );
}
