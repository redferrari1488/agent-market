"use client";

import { useEffect, useRef, useState } from "react";

type Line = { t: string; sym: string; tone: "info" | "ok" | "warn" | "err"; txt: string };

const SAMPLE: Omit<Line, "t">[] = [
  { sym: "▸", tone: "info", txt: "ответ @anna_k · 1.4с" },
  { sym: "✓", tone: "ok", txt: "статус: доставлено" },
  { sym: "▸", tone: "info", txt: "входящее @max_torres · «как отменить заказ»" },
  { sym: "▸", tone: "info", txt: "matched intent=order.cancel · conf 0.94" },
  { sym: "✓", tone: "ok", txt: "ответ доставлен · 1.1с" },
  { sym: "▸", tone: "info", txt: "входящее @leo_v · «нужен счёт»" },
  { sym: "⚠", tone: "warn", txt: "rate limit · openai · retry 1/3" },
  { sym: "✓", tone: "ok", txt: "ответ доставлен · 2.3с" },
  { sym: "▸", tone: "info", txt: "эскалация → human · ключ «возврат»" },
  { sym: "✓", tone: "ok", txt: "передано оператору support_team_3" },
  { sym: "▸", tone: "info", txt: "ответ @daria_p · 0.9с" },
  { sym: "✓", tone: "ok", txt: "статус: доставлено" },
  { sym: "▸", tone: "info", txt: "входящее @niko_s · «расписание работы»" },
  { sym: "✓", tone: "ok", txt: "ответ доставлен · 0.8с" },
  { sym: "✗", tone: "err", txt: "webhook delivery failed · retry 1/3" },
  { sym: "✓", tone: "ok", txt: "webhook recovered" },
];

function nowStamp() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

export function LogTerminal({
  agentSlug,
  tall = false,
}: {
  agentSlug: string;
  tall?: boolean;
}) {
  const [lines, setLines] = useState<Line[]>(() =>
    SAMPLE.slice(0, 8).map((l, i) => ({
      ...l,
      t: `12:0${5 + Math.floor(i / 2)}:${String((i * 7) % 60).padStart(2, "0")}`,
    })),
  );
  const cursorRef = useRef(8);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => {
      setLines((prev) => {
        const i = cursorRef.current % SAMPLE.length;
        cursorRef.current += 1;
        const next: Line = { ...SAMPLE[i], t: nowStamp() };
        return [...prev, next].slice(-40);
      });
    }, 1800);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [lines]);

  return (
    <div className="hc-logs">
      <div className="hc-logs-head">
        <span className="hc-mono hc-small hc-mute">$ hireon logs --follow {agentSlug}</span>
        <span className="hc-logs-stat">
          <span
            className="hc-dot hc-dot-pulse"
            style={{ background: "var(--hc-ok)", width: 5, height: 5 }}
          />
          <span className="hc-mono hc-small">LIVE</span>
        </span>
      </div>
      <div className={`hc-logs-body ${tall ? "is-tall" : ""}`} ref={bodyRef}>
        {lines.map((l, i) => (
          <div key={i} className={`hc-logline tone-${l.tone}`}>
            <span className="hc-logline-t">[{l.t}]</span>
            <span className="hc-logline-sym">{l.sym}</span>
            <span className="hc-logline-txt">{l.txt}</span>
          </div>
        ))}
        <div className="hc-logline">
          <span className="hc-logline-t">[{nowStamp()}]</span>
          <span className="hc-cursor">▌</span>
        </div>
      </div>
    </div>
  );
}
