"use client";

// Общие утили для V3 demo-моков (см. registry.tsx).
// usePhases — таймлайн-стейт-машина: проходит фазы по durations, делает `loops`
// циклов, потом фризится на последней фазе. setTimeout, не rAF — rAF замирает
// в фоновых вкладках. TypingDots — индикатор «печатает», переиспользует
// .v3-dot / @keyframes v3pulse, объявленные в AgentCardShell.

import { useEffect, useRef, useState } from "react";

export const MONO = "var(--font-mono), ui-monospace, monospace";
export const SANS = "var(--font-onest), system-ui, sans-serif";

export function usePhases(
  durations: number[],
  loops: number,
  reducedMotion: boolean,
): number {
  const last = durations.length - 1;
  const [phase, setPhase] = useState(reducedMotion ? last : 0);
  const loopRef = useRef(0);

  useEffect(() => {
    if (reducedMotion) return;
    if (phase >= last && loopRef.current >= loops - 1) return;
    const id = setTimeout(() => {
      if (phase >= last) {
        loopRef.current += 1;
        setPhase(0);
      } else {
        setPhase(phase + 1);
      }
    }, durations[phase]);
    return () => clearTimeout(id);
    // durations/loops/last — стабильные литералы на весь lifetime мока.
    // Включать durations в deps нельзя: новая ссылка массива на каждый рендер
    // перезапускала бы таймлайн.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, reducedMotion]);

  return phase;
}

export function TypingDots({ accent }: { accent: string }) {
  return (
    <div
      style={{
        alignSelf: "flex-start",
        background: "#182533",
        borderRadius: "4px 12px 12px 12px",
        padding: "11px 14px",
        display: "flex",
        gap: 4,
        alignItems: "center",
      }}
    >
      <span className="v3-dot" style={{ background: accent }} />
      <span className="v3-dot" style={{ background: accent, animationDelay: "0.2s" }} />
      <span className="v3-dot" style={{ background: accent, animationDelay: "0.4s" }} />
    </div>
  );
}
