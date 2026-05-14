type HireonMarkProps = {
  className?: string;
  title?: string;
};

const displayFont =
  "var(--font-manrope), 'Manrope', system-ui, sans-serif";

/**
 * Square logo mark — warm cream tile with dark "h" inside.
 * Sized via className (default 22×22).
 */
export function HireonMark({ className, title }: HireonMarkProps) {
  return (
    <span
      role={title ? "img" : "presentation"}
      aria-label={title}
      className={className ?? "h-[22px] w-[22px]"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 4,
        background: "var(--hc-fg, #f1ebe0)",
        color: "var(--hc-bg-0, #0f0e0c)",
        fontFamily: displayFont,
        fontWeight: 700,
        letterSpacing: "-0.02em",
        lineHeight: 1,
        fontSize: "0.64em",
      }}
    >
      h
    </span>
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
    <span
      className={className ?? "inline-flex items-center gap-2.5"}
      style={{ fontSize: 22 }}
    >
      <HireonMark
        title="hireon"
        className={markClassName ?? "h-[22px] w-[22px]"}
      />
      <span
        className={
          wordmarkClassName ??
          "text-[19px] font-extrabold tracking-[-0.028em] text-foreground"
        }
        style={{ fontFamily: displayFont }}
      >
        hireon
      </span>
    </span>
  );
}
