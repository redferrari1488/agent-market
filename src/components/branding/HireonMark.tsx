// hireon wordmark (Hireon Redesign 2026-05-18, logo-variant A "hire.on")
// SVG h-mark больше не используется в Header/Footer — wordmark теперь чисто
// типографический «hire<teal-dot>on». Сам HireonMark SVG оставлен для
// мест где нужен квадратный glyph (favicon-генератор, share-картинки).

type HireonMarkProps = {
  className?: string;
  title?: string;
};

export function HireonMark({ className, title }: HireonMarkProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      fill="none"
      role={title ? "img" : "presentation"}
      aria-label={title}
      className={className}
    >
      <g
        stroke="currentColor"
        strokeWidth={11}
        strokeLinecap="square"
        strokeLinejoin="miter"
        fill="none"
      >
        <line x1="22" y1="15" x2="22" y2="85" />
        <path d="M22 50 Q22 32 40 32 Q66 32 66 58 L66 85" />
      </g>
      <circle cx="80" cy="85" r="7" fill="#22d3ee" />
    </svg>
  );
}

// HireonLogo — wordmark «hire.on» в Onest 600. Без SVG-марки.
// fontSize и letterSpacing настраиваются через wordmarkClassName.
// className прежний (inline-flex items-center) сохранён, чтобы вызывающие
// компоненты (Footer и т.п.) не пришлось переписывать.
export function HireonLogo({
  className,
  wordmarkClassName,
  /** Legacy. Игнорируется — SVG-марка убрана. Принимаем чтобы старые caller'ы
   *  не падали типизацией. */
  markClassName: _markClassName,
}: {
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
}) {
  void _markClassName;
  return (
    <span className={className ?? "inline-flex items-baseline"}>
      <span
        className={
          wordmarkClassName ??
          "text-[16px] font-semibold tracking-[-0.025em] leading-none text-foreground"
        }
        style={{ fontFamily: "var(--font-onest), 'Onest', system-ui, sans-serif" }}
      >
        hire
        <span style={{ color: "var(--hr-teal, #22d3ee)" }}>.</span>
        on
      </span>
    </span>
  );
}
