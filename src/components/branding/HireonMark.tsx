type HireonMarkProps = {
  className?: string;
  title?: string;
};

export function HireonMark({ className, title }: HireonMarkProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 100"
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
        <polyline points="70,15 35,50 70,85" />
        <polyline points="130,15 165,50 130,85" />
      </g>
      <circle cx="100" cy="50" r="11" fill="#22d3ee" />
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
        className={markClassName ?? "h-[14px] w-[28px] text-foreground"}
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
