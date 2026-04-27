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

export function HireonLogo({
  className,
  markClassName,
  wordmarkClassName,
}: {
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
}) {
  return (
    <span className={className ?? "inline-flex items-center gap-2"}>
      <HireonMark
        title="Hireon"
        className={markClassName ?? "h-[18px] w-[18px] text-foreground"}
      />
      <span
        className={
          wordmarkClassName ??
          "text-[15px] font-bold tracking-[-0.02em] text-foreground"
        }
      >
        Hireon
      </span>
    </span>
  );
}
