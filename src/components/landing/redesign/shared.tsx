"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties, MouseEvent, ReactNode, RefObject } from "react";

// Hireon Redesign 2026-05-16 (Final Fix): shared primitives.
// CRITICAL: FloatingCard переписан на rAF + single transform — старая
// реализация использовала React state на mousemove, что вызывало re-render
// CatalogPreview каждый кадр (flicker). AgentCard без isolation/z:-1
// overlay — те создавали per-card stacking context внутри 3D-родителя.

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

// Системный гротеск (SF/Segoe/system-ui) — выбран в дизайн-хэндоффе
// 2026-06-08 для мобильного лендинга вместо Onest. Без вебфонта: нативный
// рендер на устройстве + чистая кириллица (Söhne-adjacent).
const SANS_FAMILY =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", system-ui, "Helvetica Neue", Arial, sans-serif';

export const sansStyle: CSSProperties = {
  fontFamily: SANS_FAMILY,
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

// ── Eyebrow — mono uppercase + pulsing dot ──────────────────────────────
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
        color: "var(--hr-fg-3)",
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

// ── CTAs ────────────────────────────────────────────────────────────────
type CTASize = "sm" | "md" | "lg";
const ctaSizeMap: Record<CTASize, { padY: number; padX: number; fs: number }> = {
  sm: { padY: 11, padX: 18, fs: 13.5 },
  md: { padY: 13, padX: 22, fs: 14.5 },
  lg: { padY: 16, padX: 28, fs: 16 },
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
    textDecoration: "none",
    whiteSpace: "nowrap",
  };
  const inner = (
    <>
      {children}
      <span style={{ display: "inline-flex" }}>
        <svg
          width="15"
          height="15"
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
      <a className="hr-cta-primary" href={href} style={base} aria-label={ariaLabel}>
        {inner}
      </a>
    );
  }
  return (
    <button
      className="hr-cta-primary"
      type="button"
      onClick={onClick}
      style={base}
      aria-label={ariaLabel}
    >
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
    whiteSpace: "nowrap",
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
    padding: "13px 8px",
    cursor: "pointer",
    fontWeight: 500,
    fontSize: 11,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    textDecoration: "none",
    whiteSpace: "nowrap",
  };
  const inner = (
    <>
      {children}
      <svg
        width="11"
        height="11"
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
  size = "md",
}: {
  value: ReactNode;
  label: string;
  accent?: boolean;
  size?: "sm" | "md";
}) {
  const vs = size === "sm" ? 24 : 28;
  return (
    <div>
      <div
        style={{
          fontSize: vs,
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
          color: "var(--hr-fg-4)",
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
// Градиент категории запечён в background-image — БЕЗ absolute z-index:-1
// overlay и БЕЗ isolation:isolate. Те создавали per-card stacking context,
// который внутри FloatingCard (3D parent с rAF transform) ре-композился
// каждый кадр и карточки визуально исчезали на hover.
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
          minHeight: compact ? 102 : 130,
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
            fontSize: compact ? 13 : 15,
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
        background: "var(--hr-bg-elev-2)",
        borderRadius: "0 0 14px 14px",
        padding: compact ? 12 : 14,
        display: "flex",
        flexDirection: "column",
        gap: 7,
        minHeight: compact ? 102 : 130,
        borderTopWidth: 2,
        borderTopColor: catColor,
        borderTopStyle: "solid",
        boxShadow: accent ? `inset 0 0 0 1px ${catColor}55` : "none",
        position: "relative",
        overflow: "hidden",
        cursor: onClick ? "pointer" : "default",
      }}
    >
      {/* Цветной градиент категории — absolute overlay БЕЗ isolation и
          БЕЗ z-index:-1 (те создавали per-card stacking context, который
          внутри FloatingCard 3D-родителя ре-композился каждый кадр).
          Дочерние элементы wrapped в relative — natural z-stack без
          stacking-context conflicts. */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(180deg, ${catColor} 0%, transparent 70%)`,
          opacity: accent ? 0.22 : 0.14,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "relative",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <CatChip color={catColor || "var(--hr-fg-3)"}>{cat}</CatChip>
      </div>
      <div
        className="hr-card-title"
        style={{
          position: "relative",
          fontWeight: 600,
          fontSize: compact ? 13.5 : 15.5,
          color: "var(--hr-fg-1)",
          lineHeight: 1.25,
        }}
      >
        {title}
      </div>
      <div
        className="hr-card-price"
        style={{
          position: "relative",
          marginTop: "auto",
          fontWeight: 600,
          fontSize: compact ? 14 : 16,
          color: "var(--hr-fg-1)",
        }}
      >
        {price}
      </div>
    </div>
  );
}

// ── EngGrid (legacy, не используется в Final Fix) ────────────────────────
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
    </svg>
  );
}

// ── HeroBgFX — лёгкий glow + опциональные scanlines ─────────────────────
// Убран filter:blur (compositor flicker) и engGrid (визуально шумно).
export function HeroBgFX({
  glow = true,
  scanlines = false,
}: {
  glow?: boolean;
  scanlines?: boolean;
}) {
  return (
    <>
      {glow && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              "radial-gradient(ellipse 40% 32% at 72% 38%, rgba(34,211,238,0.07), transparent 65%)",
          }}
        />
      )}
      {scanlines && (
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
                "linear-gradient(180deg, transparent, rgba(34,211,238,0.30), transparent)",
              animation: "hr-scanline 16s linear infinite",
            }}
          />
          <div
            style={{
              position: "absolute",
              right: "10%",
              top: 0,
              width: 1,
              height: "120%",
              background:
                "linear-gradient(180deg, transparent, rgba(34,211,238,0.25), transparent)",
              animation: "hr-scanline 22s linear infinite 9s",
            }}
          />
        </div>
      )}
    </>
  );
}

// ── FloatingCard: rAF + single transform + teal 3D-обводка ──────────────
// ВАЖНО: React state на mousemove (старая реализация) вызывал re-render
// CatalogPreview каждый кадр → flicker. Теперь tilt пишется напрямую в
// el.style.transform внутри rAF, float (idle bobbing) и cursor tilt
// складываются в ОДНУ matrix. Вложенные preserve-3d свёрнуты в один узел.
export function FloatingCard({
  children,
  sensorRef,
  baseRotY = -8,
  baseRotX = 3,
  depth = 28,
  frameColor = "#22d3ee",
  enabled = true,
}: {
  children: ReactNode;
  sensorRef?: RefObject<HTMLElement | null>;
  baseRotY?: number;
  baseRotX?: number;
  depth?: number;
  frameColor?: string;
  enabled?: boolean;
}) {
  const innerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    let tx = 0;
    let ty = 0;
    let sx = 0;
    let sy = 0;
    const t0 = performance.now();
    let running = true;
    const clamp = (n: number, lo: number, hi: number) =>
      Math.max(lo, Math.min(hi, n));

    const tick = () => {
      if (!running) return;
      const el = innerRef.current;
      if (!el) {
        raf = requestAnimationFrame(tick);
        return;
      }
      sx += (tx - sx) * 0.08;
      sy += (ty - sy) * 0.08;
      const t = (performance.now() - t0) / 1000;
      const floatY = Math.sin((t * 2 * Math.PI) / 7) * 4;
      const floatX = Math.cos((t * 2 * Math.PI) / 11) * 2;
      const ry = baseRotY + sx * 4;
      const rx = baseRotX - sy * 3;
      el.style.transform =
        `translate3d(${floatX.toFixed(2)}px, ${floatY.toFixed(2)}px, 0) ` +
        `rotateY(${ry.toFixed(2)}deg) rotateX(${rx.toFixed(2)}deg)`;
      raf = requestAnimationFrame(tick);
    };

    const onMove = (e: globalThis.MouseEvent) => {
      const el = sensorRef?.current ?? document.body;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      tx = clamp((e.clientX - cx) / Math.max(1, r.width / 2), -1, 1);
      ty = clamp((e.clientY - cy) / Math.max(1, r.height / 2), -1, 1);
    };
    const onLeave = () => {
      tx = 0;
      ty = 0;
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseleave", onLeave);
    raf = requestAnimationFrame(tick);
    return () => {
      running = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [sensorRef, enabled, baseRotY, baseRotX]);

  return (
    <div style={{ perspective: 1500, perspectiveOrigin: "50% 35%" }}>
      <div
        ref={innerRef}
        style={{
          transformStyle: "preserve-3d",
          transform: enabled
            ? `rotateY(${baseRotY}deg) rotateX(${baseRotX}deg)`
            : "none",
          willChange: enabled ? "transform" : "auto",
          backfaceVisibility: "hidden",
          position: "relative",
          display: "inline-block",
        }}
      >
        {children}
        {/* Back-plate с translateZ — даёт 3D-глубину без угловых "палочек" */}
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
        {/* Front teal-frame */}
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
  );
}

// dotGridBg utility (legacy)
export const dotGridBg = (
  color = "rgba(244,236,222,0.04)",
  size = 24,
): CSSProperties => ({
  backgroundImage: `radial-gradient(${color} 1px, transparent 1px)`,
  backgroundSize: `${size}px ${size}px`,
});
