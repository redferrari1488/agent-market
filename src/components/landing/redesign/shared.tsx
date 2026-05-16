"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, MouseEvent, ReactNode, RefObject } from "react";

// Hireon Redesign 2026-05-16: shared primitives для нового Hero/Header.
// Использует CSS-переменные --hr-* и шрифт --font-onest из globals.css.

const ONEST_FAMILY = "var(--font-onest), 'Onest', system-ui, sans-serif";
const MONO_FAMILY = "var(--font-mono), 'JetBrains Mono', ui-monospace, monospace";

export const monoStyle: CSSProperties = {
  fontFamily: MONO_FAMILY,
  letterSpacing: 0,
};

export const onestStyle: CSSProperties = {
  fontFamily: ONEST_FAMILY,
  letterSpacing: "-0.01em",
};

// ── LiveDot ──────────────────────────────────────────────────────────────
export function LiveDot({
  color = "var(--hr-teal)",
  size = 7,
  pulse = true,
}: {
  color?: string;
  size?: number;
  pulse?: boolean;
}) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        display: "inline-block",
        flex: "0 0 auto",
        animation: pulse ? "hr-pulse-dot 1.8s ease-out infinite" : "none",
      }}
    />
  );
}

// ── CatChip ──────────────────────────────────────────────────────────────
export function CatChip({
  children,
  color,
}: {
  children: ReactNode;
  color: string;
}) {
  return (
    <div
      style={{
        ...monoStyle,
        fontSize: 10,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color,
        fontWeight: 500,
      }}
    >
      {children}
    </div>
  );
}

// ── Eyebrow — small mono uppercase + pulsing dot ─────────────────────────
export function Eyebrow({
  children,
  color = "var(--hr-teal)",
}: {
  children: ReactNode;
  color?: string;
}) {
  return (
    <div
      style={{
        ...monoStyle,
        fontSize: 12,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: "var(--hr-fg-2)",
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: color,
          animation: "hr-pulse-dot 1.8s ease-out infinite",
        }}
      />
      {children}
    </div>
  );
}

// ── PrimaryCTA (teal pill) ───────────────────────────────────────────────
type CTASize = "md" | "lg";
const ctaSizeMap: Record<CTASize, { padY: number; padX: number; fs: number }> = {
  md: { padY: 14, padX: 22, fs: 15 },
  lg: { padY: 18, padX: 30, fs: 17 },
};

export function PrimaryCTA({
  children,
  size = "md",
  onClick,
  href,
  ariaLabel,
}: {
  children: ReactNode;
  size?: CTASize;
  onClick?: (e: MouseEvent<HTMLElement>) => void;
  href?: string;
  ariaLabel?: string;
}) {
  const { padY, padX, fs } = ctaSizeMap[size];
  const base: CSSProperties = {
    background: "var(--hr-teal)",
    color: "#062e36",
    border: "none",
    padding: `${padY}px ${padX}px`,
    borderRadius: 999,
    cursor: "pointer",
    fontFamily: ONEST_FAMILY,
    fontWeight: 600,
    fontSize: fs,
    letterSpacing: "-0.01em",
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    transition: "transform .15s, background .15s",
    textDecoration: "none",
  };
  const inner = (
    <>
      {children}
      <span style={{ display: "inline-flex" }}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </span>
    </>
  );
  if (href) {
    return (
      <a href={href} style={base} aria-label={ariaLabel}>
        {inner}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} style={base} aria-label={ariaLabel}>
      {inner}
    </button>
  );
}

export function SecondaryCTA({
  children,
  size = "md",
  icon = "+",
  href,
  onClick,
}: {
  children: ReactNode;
  size?: CTASize;
  icon?: string;
  href?: string;
  onClick?: (e: MouseEvent<HTMLElement>) => void;
}) {
  const { padY, padX, fs } = ctaSizeMap[size];
  const base: CSSProperties = {
    background: "transparent",
    color: "var(--hr-fg-1)",
    border: "1px solid var(--hr-border-2)",
    padding: `${padY}px ${padX}px`,
    borderRadius: 999,
    cursor: "pointer",
    fontFamily: ONEST_FAMILY,
    fontWeight: 500,
    fontSize: fs,
    letterSpacing: "-0.01em",
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    textDecoration: "none",
  };
  const inner = (
    <>
      {children}
      <span style={{ color: "var(--hr-fg-3)", fontSize: 16, lineHeight: 1 }}>
        {icon}
      </span>
    </>
  );
  if (href) {
    return (
      <a href={href} style={base}>
        {inner}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} style={base}>
      {inner}
    </button>
  );
}

export function GhostCTA({
  children,
  href,
  onClick,
}: {
  children: ReactNode;
  href?: string;
  onClick?: (e: MouseEvent<HTMLElement>) => void;
}) {
  const base: CSSProperties = {
    ...monoStyle,
    background: "transparent",
    color: "var(--hr-fg-3)",
    border: "none",
    padding: "14px 8px",
    cursor: "pointer",
    fontWeight: 500,
    fontSize: 12,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    textDecoration: "none",
  };
  const inner = (
    <>
      {children}
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <path d="M12 5v14M6 13l6 6 6-6" />
      </svg>
    </>
  );
  if (href) {
    return (
      <a href={href} style={base}>
        {inner}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} style={base}>
      {inner}
    </button>
  );
}

// ── Stat ─────────────────────────────────────────────────────────────────
export function Stat({
  value,
  label,
  accent = false,
}: {
  value: ReactNode;
  label: string;
  accent?: boolean;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 32,
          fontWeight: 600,
          letterSpacing: "-0.03em",
          color: accent ? "var(--hr-teal)" : "var(--hr-fg-1)",
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          ...monoStyle,
          marginTop: 8,
          fontSize: 10,
          color: "var(--hr-fg-3)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          lineHeight: 1.5,
        }}
      >
        {label}
      </div>
    </div>
  );
}

// ── AgentCard ────────────────────────────────────────────────────────────
export type AgentLike = {
  id: string;
  slug?: string;
  cat: string;
  color: string;
  title: string;
  price: string;
  desc?: string;
};

export function AgentCard({
  cat,
  catColor,
  title,
  price,
  slot = false,
  slotIdx,
  accent = false,
  compact = false,
  onClick,
}: {
  cat?: string;
  catColor?: string;
  title?: string;
  price?: string;
  slot?: boolean;
  slotIdx?: string;
  accent?: boolean;
  compact?: boolean;
  onClick?: () => void;
}) {
  if (slot) {
    return (
      <div
        onClick={onClick}
        style={{
          border: "1.5px dashed var(--hr-border-3)",
          borderRadius: 14,
          padding: compact ? 12 : 14,
          position: "relative",
          background: "rgba(34,211,238,0.04)",
          display: "flex",
          flexDirection: "column",
          gap: 6,
          minHeight: compact ? 110 : 130,
          cursor: onClick ? "pointer" : "default",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <CatChip color="var(--hr-fg-3)">слот · #{slotIdx}</CatChip>
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: 6,
              background: "var(--hr-teal-soft)",
              color: "var(--hr-teal)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              lineHeight: 1,
              fontWeight: 600,
            }}
          >
            +
          </div>
        </div>
        <div
          style={{
            fontWeight: 600,
            fontSize: compact ? 14 : 15,
            color: "var(--hr-fg-1)",
            marginTop: 4,
          }}
        >
          Стать продавцом
        </div>
        <div
          style={{
            ...monoStyle,
            fontSize: 10,
            color: "var(--hr-fg-3)",
            lineHeight: 1.5,
          }}
        >
          набор первой
          <br />
          волны · бесплатно
        </div>
        <div
          style={{
            ...monoStyle,
            marginTop: "auto",
            fontSize: 10,
            color: "var(--hr-teal)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          разместить →
        </div>
      </div>
    );
  }
  return (
    <div
      onClick={onClick}
      className={onClick ? "hr-card-hoverable" : ""}
      style={{
        borderTop: `2px solid ${catColor}`,
        background: "var(--hr-bg-elev-2)",
        borderRadius: "0 0 14px 14px",
        padding: compact ? 12 : 14,
        display: "flex",
        flexDirection: "column",
        gap: 7,
        minHeight: compact ? 110 : 130,
        transition: "background .25s, transform .2s, box-shadow .2s",
        animation: accent ? "hr-card-pulse 2.5s ease-in-out infinite" : "none",
        position: "relative",
        overflow: "hidden",
        isolation: "isolate",
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          zIndex: -1,
          background: `linear-gradient(180deg, ${catColor} 0%, transparent 65%)`,
          opacity: accent ? 0.18 : 0.1,
          pointerEvents: "none",
          transition: "opacity .35s",
        }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <CatChip color={catColor || "var(--hr-fg-3)"}>{cat}</CatChip>
        {accent && (
          <div
            style={{
              ...monoStyle,
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontSize: 9,
              color: catColor,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: catColor,
                animation: "hr-pulse-dot 1.4s ease-out infinite",
              }}
            />
            live
          </div>
        )}
      </div>
      <div
        style={{
          fontWeight: 600,
          fontSize: compact ? 14 : 15.5,
          color: "var(--hr-fg-1)",
          lineHeight: 1.25,
        }}
      >
        {title}
      </div>
      <div
        style={{
          marginTop: "auto",
          fontWeight: 600,
          fontSize: compact ? 15 : 16,
          color: "var(--hr-fg-1)",
        }}
      >
        {price}
      </div>
    </div>
  );
}

// ── EngGrid: engineering blueprint perspective lines ─────────────────────
export function EngGrid({
  color = "#22d3ee",
  opacity = 0.16,
}: {
  color?: string;
  opacity?: number;
}) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1440 960"
      preserveAspectRatio="none"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        opacity,
      }}
    >
      <defs>
        <linearGradient id="hr-eng-fade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={color} stopOpacity="0.0" />
          <stop offset="0.3" stopColor={color} stopOpacity="0.9" />
          <stop offset="0.85" stopColor={color} stopOpacity="0.9" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1="-100" y1="-200" x2="1180" y2="720" stroke="url(#hr-eng-fade)" strokeWidth="1.2" />
      <line x1="-200" y1="800" x2="1180" y2="720" stroke="url(#hr-eng-fade)" strokeWidth="1.2" />
      <line
        x1="-150"
        y1="-150"
        x2="1180"
        y2="720"
        stroke="url(#hr-eng-fade)"
        strokeWidth="0.8"
        strokeDasharray="3 10"
      />
      <line
        x1="-150"
        y1="1100"
        x2="1180"
        y2="720"
        stroke="url(#hr-eng-fade)"
        strokeWidth="0.8"
        strokeDasharray="3 10"
      />
      <line
        x1="0"
        y1="720"
        x2="1440"
        y2="720"
        stroke="url(#hr-eng-fade)"
        strokeWidth="0.8"
        strokeDasharray="2 14"
      />
    </svg>
  );
}

// ── HeroBgFX: glow drift + scanlines + grid ──────────────────────────────
export function HeroBgFX({
  tealGlow = true,
  engGrid = true,
}: {
  tealGlow?: boolean;
  engGrid?: boolean;
}) {
  return (
    <>
      {engGrid && <EngGrid />}
      {tealGlow && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: "-20% -10%",
            pointerEvents: "none",
            background:
              "radial-gradient(ellipse 50% 40% at 70% 35%, rgba(34,211,238,0.10), transparent 60%)",
            animation: "hr-glow-drift 14s ease-in-out infinite",
            filter: "blur(20px)",
          }}
        />
      )}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "8%",
            top: 0,
            width: 1,
            height: "120%",
            background:
              "linear-gradient(180deg, transparent, rgba(34,211,238,0.35), transparent)",
            animation: "hr-scanline 14s linear infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: "12%",
            top: 0,
            width: 1,
            height: "120%",
            background:
              "linear-gradient(180deg, transparent, rgba(34,211,238,0.3), transparent)",
            animation: "hr-scanline 22s linear infinite 9s",
          }}
        />
      </div>
    </>
  );
}

// ── FloatingCard: 3D wireframe cage around children, cursor-reactive ─────
// Ports lock-in style 3D card from the design prototype.
export function FloatingCard({
  children,
  sensorRef,
  baseRotY = -12,
  baseRotX = 4,
  depth = 40,
  frameColor = "#22d3ee",
}: {
  children: ReactNode;
  sensorRef?: RefObject<HTMLElement | null>;
  baseRotY?: number;
  baseRotX?: number;
  depth?: number;
  frameColor?: string;
}) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handler = (e: globalThis.MouseEvent) => {
      const el = sensorRef?.current || document.body;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = Math.max(-1, Math.min(1, (e.clientX - cx) / (r.width / 2)));
      const dy = Math.max(-1, Math.min(1, (e.clientY - cy) / (r.height / 2)));
      setTilt({ x: dx, y: dy });
    };
    const reset = () => setTilt({ x: 0, y: 0 });
    window.addEventListener("mousemove", handler);
    window.addEventListener("mouseleave", reset);
    return () => {
      window.removeEventListener("mousemove", handler);
      window.removeEventListener("mouseleave", reset);
    };
  }, [sensorRef]);

  const rotY = baseRotY + tilt.x * 4;
  const rotX = baseRotX - tilt.y * 3;

  const edgeStyle = (corner: "tl" | "tr" | "bl" | "br"): CSSProperties => {
    const isRight = corner === "tr" || corner === "br";
    const isBottom = corner === "bl" || corner === "br";
    return {
      position: "absolute",
      [isBottom ? "bottom" : "top"]: 0,
      [isRight ? "right" : "left"]: 0,
      width: depth,
      height: 1.5,
      background: `linear-gradient(90deg, ${frameColor} 0%, ${frameColor}88 100%)`,
      transformOrigin: isRight ? "100% 50%" : "0 50%",
      transform: `rotateY(${isRight ? -90 : 90}deg)`,
      pointerEvents: "none",
      boxShadow: `0 0 6px ${frameColor}66`,
    } as CSSProperties;
  };

  return (
    <div style={{ perspective: 1600, perspectiveOrigin: "50% 35%" }}>
      <div
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateY(${rotY}deg) rotateX(${rotX}deg)`,
          transition: "transform 0.7s cubic-bezier(.25,.8,.3,1)",
          position: "relative",
          display: "inline-block",
        }}
      >
        <div
          style={{
            transformStyle: "preserve-3d",
            animation: "hr-float 7s ease-in-out infinite",
            position: "relative",
            display: "inline-block",
          }}
        >
          <div
            style={{
              position: "relative",
              display: "inline-block",
              transformStyle: "preserve-3d",
            }}
          >
            {children}
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                border: `1.5px solid ${frameColor}`,
                borderRadius: 20,
                pointerEvents: "none",
                transform: `translateZ(-${depth}px)`,
                background: `linear-gradient(180deg, ${frameColor}08, ${frameColor}03)`,
                boxShadow: `0 0 60px ${frameColor}22, inset 0 0 30px ${frameColor}11`,
              }}
            />
            <div aria-hidden style={edgeStyle("tl")} />
            <div aria-hidden style={edgeStyle("tr")} />
            <div aria-hidden style={edgeStyle("bl")} />
            <div aria-hidden style={edgeStyle("br")} />
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                border: `1.5px solid ${frameColor}`,
                borderRadius: 20,
                pointerEvents: "none",
                boxShadow: `0 0 24px ${frameColor}33`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook: ref to use as sensor for cursor parallax.
export function useSensorRef<T extends HTMLElement>() {
  return useRef<T | null>(null);
}

// dotGridBg utility
export const dotGridBg = (
  color = "rgba(244,236,222,0.04)",
  size = 24,
): CSSProperties => ({
  backgroundImage: `radial-gradient(${color} 1px, transparent 1px)`,
  backgroundSize: `${size}px ${size}px`,
});
