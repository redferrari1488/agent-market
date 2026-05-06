"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import "./cockpit-landing.css";

const STEPS = [
  {
    id: 0,
    kicker: "t = 0",
    label: "выбор",
    title: "Выбираете",
    desc: "Готовый сценарий из каталога. Не идея, а формат работы — с метриками, ценой и логом запусков.",
    side: "/agents · каталог",
    bullets: ["126 готовых агентов", "категории · цены · sla", "демо без регистрации"],
  },
  {
    id: 1,
    kicker: "t + 2 мин",
    label: "подключение",
    title: "Подключаете",
    desc: "Ключи и параметры в кабинете. Без созвонов и переписок с менеджером.",
    side: "self-serve · web",
    bullets: ["api_key · webhook_url · cron", "валидация в фоне", "откат в один клик"],
  },
  {
    id: 2,
    kicker: "24 / 7",
    label: "работа",
    title: "Работает",
    desc: "Живёт в кабинете 24/7. Логи, метрики и контроль — под рукой.",
    side: "cockpit · live",
    bullets: ["stdout в реальном времени", "stop · restart в один клик", "биллинг по факту работы"],
  },
];

export function FlowHorizontal() {
  const [active, setActive] = useState(0);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActive((x) => (x + 1) % STEPS.length), 9000);
    return () => clearInterval(t);
  }, [tick]);

  const select = (i: number) => {
    setActive(i);
    setTick((x) => x + 1);
  };

  const a = STEPS[active];

  return (
    <section
      className="hireon-flow"
      style={{
        paddingTop: 80,
        paddingBottom: 80,
        borderTop: "1px solid var(--hc-line-1)",
        borderBottom: "1px solid var(--hc-line-1)",
      }}
    >
      <div className="hf-page">
        {/* eyebrow */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 32 }}>
          <span
            className="hf-mono"
            style={{
              fontSize: 10,
              color: "var(--hc-cyan)",
              textTransform: "uppercase",
              letterSpacing: "0.18em",
            }}
          >
            ◆ §02 · path-to-live
          </span>
          <span style={{ flex: 1, height: 1, background: "var(--hc-line-1)" }} />
          <span
            className="hf-mono"
            style={{
              fontSize: 10,
              color: "var(--hc-fg-3)",
              textTransform: "uppercase",
              letterSpacing: "0.16em",
            }}
          >
            avg · 4 мин · без созвонов
          </span>
        </div>

        {/* title */}
        <h2
          className="hf-display"
          style={{
            fontSize: "clamp(36px, 5.5vw, 64px)",
            color: "var(--hc-fg)",
            marginBottom: 40,
            marginTop: 0,
            maxWidth: 920,
          }}
        >
          От выбора до запуска — <span style={{ color: "var(--hc-cyan)" }}>три шага</span>.
        </h2>

        {/* timeline rail */}
        <FlowTimeline active={active} setActive={select} />

        {/* scene */}
        <div
          style={{
            padding: "40px 0 0",
            display: "grid",
            gap: 48,
            alignItems: "start",
          }}
          className="hf-flow-scene"
        >
          <div>
            <h3
              className="hf-section"
              style={{ fontSize: 56, color: "var(--hc-fg)", margin: 0 }}
            >
              {a.title}
            </h3>
            <p
              style={{
                fontSize: 17,
                lineHeight: 1.55,
                color: "var(--hc-fg-1)",
                marginTop: 18,
                maxWidth: 380,
              }}
            >
              {a.desc}
            </p>
            <ul
              style={{
                margin: "18px 0 0",
                padding: 0,
                listStyle: "none",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              {a.bullets.map((b, bi) => (
                <li key={bi} className="hf-tick">
                  <span style={{ color: "var(--hc-cyan)" }}>—</span>
                  <span
                    className="hf-mono"
                    style={{ color: "var(--hc-fg-1)", fontSize: 11.5 }}
                  >
                    {b}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div style={{ position: "relative", minHeight: 480 }}>
            <div
              className="hf-mono"
              style={{
                position: "absolute",
                top: -26,
                left: 0,
                fontSize: 10,
                color: "var(--hc-fg-3)",
                textTransform: "uppercase",
                letterSpacing: "0.16em",
              }}
            >
              <span style={{ color: "var(--hc-cyan)", marginRight: 8 }}>▸</span>
              {a.side}
            </div>
            <FlowMockSwitch active={active} />
          </div>
        </div>

        {/* footer rail */}
        <div
          style={{
            marginTop: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid var(--hc-line-1)",
            paddingTop: 24,
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div
            className="hf-mono"
            style={{
              fontSize: 10,
              color: "var(--hc-fg-3)",
              textTransform: "uppercase",
              letterSpacing: "0.16em",
            }}
          >
            self-serve · без созвонов · отмена в любой момент
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Link
              href="/agents"
              className="hf-btn hf-btn-cyan"
              style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}
            >
              открыть каталог →
            </Link>
          </div>
        </div>
      </div>

    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Timeline rail — three nodes connected by a cyan slice that animates
// ─────────────────────────────────────────────────────────────────────
function FlowTimeline({
  active,
  setActive,
}: {
  active: number;
  setActive: (n: number) => void;
}) {
  return (
    <div
      style={{
        position: "relative",
        display: "grid",
        gridTemplateColumns: `repeat(${STEPS.length}, 1fr)`,
        borderTop: "1px solid var(--hc-line-1)",
        borderBottom: "1px solid var(--hc-line-1)",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -1,
          bottom: -1,
          left: `${(active / STEPS.length) * 100}%`,
          width: `${100 / STEPS.length}%`,
          borderLeft: "1px solid var(--hc-cyan)",
          borderRight: "1px solid var(--hc-cyan)",
          background: "var(--hc-cyan-ghost)",
          transition: "left .5s cubic-bezier(.2,.8,.2,1)",
          pointerEvents: "none",
        }}
      />
      {STEPS.map((s, i) => {
        const isActive = i === active;
        return (
          <button
            key={s.id}
            onClick={() => setActive(i)}
            style={{
              all: "unset",
              cursor: "pointer",
              padding: "18px 20px",
              display: "flex",
              flexDirection: "column",
              gap: 6,
              borderRight:
                i < STEPS.length - 1 ? "1px solid var(--hc-line-1)" : "none",
              position: "relative",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                className={isActive ? "hf-pulse" : ""}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: isActive ? "var(--hc-cyan)" : "var(--hc-fg-3)",
                  display: "inline-block",
                }}
              />
              <span
                className="hf-mono"
                style={{
                  fontSize: 10,
                  color: isActive ? "var(--hc-cyan)" : "var(--hc-fg-3)",
                  textTransform: "uppercase",
                  letterSpacing: "0.18em",
                }}
              >
                {s.kicker}
              </span>
            </div>
            <div
              className="hf-mono"
              style={{
                fontSize: 11,
                color: isActive ? "var(--hc-fg)" : "var(--hc-fg-2)",
                textTransform: "uppercase",
                letterSpacing: "0.16em",
              }}
            >
              0{i + 1} · {s.label}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Mock switcher — three step mockups with crossfade + slight x-translate
// ─────────────────────────────────────────────────────────────────────
function FlowMockSwitch({ active }: { active: number }) {
  return (
    <div style={{ position: "relative", minHeight: 480 }}>
      {[0, 1, 2].map((i) => {
        const isActive = i === active;
        return (
          <div
            key={i}
            style={{
              position: isActive ? "relative" : "absolute",
              top: 0,
              left: 0,
              right: 0,
              opacity: isActive ? 1 : 0,
              transform: isActive
                ? "translateX(0)"
                : `translateX(${i < active ? -12 : 12}px)`,
              transition:
                "opacity .35s ease, transform .45s cubic-bezier(.2,.8,.2,1)",
              pointerEvents: isActive ? "auto" : "none",
            }}
          >
            {i === 0 && <MockCatalog />}
            {i === 1 && <MockConfig />}
            {i === 2 && <MockMini />}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// STEP 1 — catalog mock
// ─────────────────────────────────────────────────────────────────────
const CATALOG = [
  {
    name: "Поддержка клиентов",
    cat: "поддержка · telegram",
    stripe: "oklch(0.68 0.19 195)",
    price: "4 900 ₽ / мес",
    tier: "starter",
  },
  {
    name: "Контент-копирайтер",
    cat: "контент · еженедельно",
    stripe: "oklch(0.66 0.04 250)",
    price: "9 900 ₽ / мес",
    tier: "pro",
  },
  {
    name: "Дайджест новостей",
    cat: "новости · ленты",
    stripe: "oklch(0.72 0.04 80)",
    price: "3 900 ₽ / мес",
    tier: "starter",
  },
  {
    name: "Мониторинг сайта",
    cat: "ops · uptime",
    stripe: "oklch(0.70 0.05 25)",
    price: "5 900 ₽ / мес",
    tier: "pro",
  },
];

export function MockCatalog() {
  return (
    <div
      style={{
        border: "1px solid var(--hc-line-2)",
        borderRadius: "var(--hc-r)",
        background: "var(--hc-bg-1)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--hc-line-1)",
          background: "var(--hc-bg-2)",
        }}
      >
        <span
          className="hf-mono"
          style={{
            fontSize: 10,
            color: "var(--hc-fg-2)",
            textTransform: "uppercase",
            letterSpacing: "0.16em",
          }}
        >
          /agents · каталог
        </span>
        <span
          className="hf-mono"
          style={{ fontSize: 10, color: "var(--hc-fg-3)" }}
        >
          126 результатов
        </span>
      </div>
      <div
        style={{
          padding: 18,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
        }}
      >
        {CATALOG.map((a, i) => (
          <CatalogCard key={i} a={a} hover={i === 0} />
        ))}
      </div>
      <div
        style={{
          padding: "10px 16px",
          borderTop: "1px solid var(--hc-line-1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "var(--hc-bg-2)",
        }}
      >
        <span
          className="hf-mono"
          style={{
            fontSize: 10,
            color: "var(--hc-fg-3)",
            textTransform: "uppercase",
            letterSpacing: "0.14em",
          }}
        >
          фильтр · поддержка
        </span>
        <span
          className="hf-mono"
          style={{ fontSize: 10, color: "var(--hc-fg-3)" }}
        >
          стр. 1 / 8
        </span>
      </div>
    </div>
  );
}

function CatalogCard({
  a,
  hover,
}: {
  a: (typeof CATALOG)[number];
  hover: boolean;
}) {
  return (
    <div
      style={{
        border: `1px solid ${hover ? "var(--hc-cyan)" : "var(--hc-line-1)"}`,
        borderRadius: "var(--hc-r)",
        background: "var(--hc-bg-1)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transition: "border-color .2s ease",
      }}
    >
      <div style={{ height: 2, background: a.stripe }} />
      <div
        style={{
          padding: "14px 14px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            className="hf-mono"
            style={{
              fontSize: 10,
              color: "var(--hc-fg-2)",
              textTransform: "uppercase",
              letterSpacing: "0.14em",
            }}
          >
            {a.cat}
          </span>
          <span
            className="hf-mono"
            style={{
              fontSize: 9.5,
              color: "var(--hc-fg-3)",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
            }}
          >
            {a.tier}
          </span>
        </div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "var(--hc-fg)",
            letterSpacing: "-0.01em",
          }}
        >
          {a.name}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 4,
          }}
        >
          <span
            className="hf-mono hf-num"
            style={{ fontSize: 11, color: "var(--hc-fg-1)" }}
          >
            {a.price}
          </span>
          <span
            className={`hf-btn ${hover ? "hf-btn-cyan" : ""}`}
            style={{ padding: "5px 9px", fontSize: 10 }}
          >
            подключить →
          </span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// STEP 2 — config mock with live validation
// ─────────────────────────────────────────────────────────────────────
function FormField({
  label,
  value,
  suffix,
  type = "input",
}: {
  label: string;
  value: string;
  suffix?: string;
  type?: "input" | "select";
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <label
          className="hf-mono"
          style={{
            fontSize: 10,
            color: "var(--hc-fg-2)",
            textTransform: "uppercase",
            letterSpacing: "0.14em",
          }}
        >
          {label}
        </label>
        {suffix && (
          <span
            className="hf-mono"
            style={{ fontSize: 9.5, color: "var(--hc-fg-3)" }}
          >
            {suffix}
          </span>
        )}
      </div>
      <div
        className="hf-mono"
        style={{
          border: "1px solid var(--hc-line-2)",
          borderRadius: "var(--hc-r)",
          padding: "9px 12px",
          background: "var(--hc-bg-0)",
          fontSize: 12,
          color: "var(--hc-fg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <span
          style={{
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {value}
        </span>
        {type === "select" && (
          <span style={{ color: "var(--hc-fg-3)", fontSize: 10 }}>▾</span>
        )}
      </div>
    </div>
  );
}

export function MockConfig() {
  const [v, setV] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setV((x) => (x + 1) % 4), 900);
    return () => clearInterval(t);
  }, []);
  const checks = [
    { l: "api_key · валидный формат", ok: true },
    { l: "telegram-бот · отвечает", ok: v >= 1 },
    { l: "расписание · cron валиден", ok: v >= 2 },
    { l: "amoCRM · доступ к записи", ok: v >= 3 },
  ];
  return (
    <div
      style={{
        border: "1px solid var(--hc-line-2)",
        borderRadius: "var(--hc-r)",
        background: "var(--hc-bg-1)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--hc-line-1)",
          background: "var(--hc-bg-2)",
        }}
      >
        <span
          className="hf-mono"
          style={{
            fontSize: 10,
            color: "var(--hc-fg-2)",
            textTransform: "uppercase",
            letterSpacing: "0.16em",
          }}
        >
          /agents/ai-support · настройка
        </span>
        <span
          className="hf-mono"
          style={{ fontSize: 10, color: "var(--hc-fg-3)" }}
        >
          шаг 2 / 3
        </span>
      </div>

      <div
        style={{
          padding: "20px 18px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
        }}
      >
        <FormField label="api_key" value="sk-ag-pj4···k82q" suffix="encrypted" />
        <FormField label="telegram_bot_token" value="7421:AAH···xQ" />
        <FormField label="schedule" value="*/2 * * * *" suffix="каждые 2 мин" />
        <FormField label="crm" value="amoCRM · prod" type="select" />
        <div style={{ gridColumn: "1 / -1" }}>
          <FormField
            label="prompt overlay"
            value="prepend: отвечать в тоне клиента, не озвучивать цены"
            suffix="опционально"
          />
        </div>
      </div>

      <div
        style={{
          borderTop: "1px solid var(--hc-line-1)",
          padding: "14px 18px",
          background: "var(--hc-bg-2)",
        }}
      >
        <div className="hf-eyebrow" style={{ marginBottom: 10 }}>
          валидация
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {checks.map((c, i) => (
            <div key={i} className="hf-tick">
              <span className={c.ok ? "hf-tick-ok" : "hf-tick-pend"}>
                {c.ok ? "✓" : "·"}
              </span>
              <span
                style={{ color: c.ok ? "var(--hc-fg-1)" : "var(--hc-fg-3)" }}
              >
                {c.l}
              </span>
              {!c.ok && (
                <span
                  className="hf-mono hf-pulse"
                  style={{ color: "var(--hc-fg-3)", marginLeft: 4 }}
                >
                  проверка…
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          padding: "14px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderTop: "1px solid var(--hc-line-1)",
        }}
      >
        <span
          className="hf-mono"
          style={{
            fontSize: 10,
            color: "var(--hc-fg-3)",
            textTransform: "uppercase",
            letterSpacing: "0.14em",
          }}
        >
          готовность · ~ 4 сек
        </span>
        <button className="hf-btn hf-btn-solid">запустить агента →</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// STEP 3 — mini cockpit with live log
// ─────────────────────────────────────────────────────────────────────
export type Line = { t: string; tag: string; ok: boolean; msg: string };

const LOG_SEED: Line[] = [
  { t: "12:04:58", tag: "INTAKE", ok: true, msg: "msg @ivan_k · routed → support" },
  { t: "12:05:01", tag: "REPLY", ok: true, msg: "response sent · 1.4s · gpt-tier-2" },
  { t: "12:05:03", tag: "CRM", ok: true, msg: "updated #4821 · amoCRM" },
  { t: "12:05:07", tag: "INTAKE", ok: true, msg: "msg @marina_w · routed → qualify" },
  { t: "12:05:09", tag: "TOOL", ok: true, msg: "calendar.book · slot=вт 15:30" },
  { t: "12:05:14", tag: "REPLY", ok: true, msg: "response sent · 0.9s · gpt-tier-2" },
  { t: "12:05:18", tag: "CRM", ok: true, msg: "enriched · score 84" },
  { t: "12:05:22", tag: "INTAKE", ok: true, msg: "msg @lebedev · routed → reject" },
  { t: "12:05:24", tag: "REPLY", ok: true, msg: "response sent · 1.1s · gpt-tier-2" },
  { t: "12:05:30", tag: "TOOL", ok: true, msg: "telegram.notify · #support-warm" },
  { t: "12:05:34", tag: "CRM", ok: true, msg: "updated #4823 · amoCRM" },
];

const LOG_GEN: [string, string][] = [
  ["REPLY", "response sent · 1.{r}s · gpt-tier-2"],
  ["INTAKE", "msg @{n} · routed → {q}"],
  ["CRM", "updated #{rec} · amoCRM"],
  ["TOOL", "calendar.book · slot={d} {h}:{m}"],
  ["TOOL", "telegram.notify · #support-warm"],
  ["CRM", "enriched · score {s}"],
];

const NAMES = [
  "ivan_k",
  "marina_w",
  "lebedev",
  "anna_p",
  "t.berg",
  "luiza_r",
  "morozov",
  "d.park",
  "s.lin",
  "aoki",
];
const QUEUES = ["support", "qualify", "book", "reject"];
const DAYS = ["пн", "вт", "ср", "чт", "пт"];

function fmtClock(d: Date) {
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function genLine(): Line {
  const [tag, tpl] = LOG_GEN[Math.floor(Math.random() * LOG_GEN.length)];
  const msg = tpl
    .replace("{r}", String(Math.floor(Math.random() * 9)))
    .replace("{n}", NAMES[Math.floor(Math.random() * NAMES.length)])
    .replace("{q}", QUEUES[Math.floor(Math.random() * QUEUES.length)])
    .replace("{rec}", String(4820 + Math.floor(Math.random() * 60)))
    .replace("{d}", DAYS[Math.floor(Math.random() * DAYS.length)])
    .replace("{h}", String(9 + Math.floor(Math.random() * 8)))
    .replace("{m}", String(Math.floor(Math.random() * 6)) + "0")
    .replace("{s}", String(60 + Math.floor(Math.random() * 38)));
  return { t: fmtClock(new Date()), tag, ok: true, msg };
}

export function useLiveLog(seed = LOG_SEED, intervalMs = 2200, max = 14) {
  const [lines, setLines] = useState<Line[]>(seed);
  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      if (!alive) return;
      setLines((prev) => {
        const next = [...prev, genLine()];
        return next.length > max ? next.slice(next.length - max) : next;
      });
      timer = setTimeout(tick, intervalMs + Math.random() * 1200);
    };
    timer = setTimeout(tick, intervalMs);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [intervalMs, max]);
  return lines;
}

export function LogFeed({
  lines,
  height = 150,
  dense = true,
}: {
  lines: Line[];
  height?: number;
  dense?: boolean;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [lines]);
  return (
    <div
      ref={ref}
      className="hf-mono hf-scroll"
      style={{
        height,
        overflowY: "auto",
        overflowX: "hidden",
        background: "var(--hc-bg-0)",
        borderTop: "1px solid var(--hc-line-1)",
        padding: dense ? "8px 14px" : "14px 18px",
        fontSize: dense ? 10.5 : 11.5,
        lineHeight: 1.7,
        color: "var(--hc-fg-1)",
      }}
    >
      {lines.map((l, i) => {
        const last = i === lines.length - 1;
        return (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 14,
              whiteSpace: "nowrap",
              opacity: last
                ? 1
                : Math.max(0.45, 1 - (lines.length - 1 - i) * 0.04),
            }}
          >
            <span style={{ color: "var(--hc-fg-3)" }}>{l.t}</span>
            <span
              style={{
                color: "var(--hc-fg-2)",
                width: 54,
                display: "inline-block",
              }}
            >
              {l.tag}
            </span>
            <span style={{ color: "var(--hc-ok)" }}>✓</span>
            <span
              style={{
                color: last ? "var(--hc-fg)" : "var(--hc-fg-1)",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {l.msg}
              {last && (
                <span
                  className="hf-caret"
                  style={{
                    background: "var(--hc-cyan)",
                    width: 7,
                    height: 12,
                    marginLeft: 4,
                    verticalAlign: "-1px",
                  }}
                />
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function ActivityTicker() {
  const [n, setN] = useState(12847);
  useEffect(() => {
    const t = setInterval(
      () => setN((v) => v + Math.floor(Math.random() * 4) + 1),
      1400,
    );
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
      <span
        className="hf-pulse"
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: "var(--hc-cyan)",
          display: "inline-block",
        }}
      />
      <span
        className="hf-mono hf-num"
        style={{ fontSize: 13, color: "var(--hc-fg)" }}
      >
        {n.toLocaleString("ru-RU")}
      </span>
      <span
        className="hf-mono"
        style={{
          fontSize: 10,
          color: "var(--hc-fg-3)",
          textTransform: "uppercase",
          letterSpacing: "0.12em",
        }}
      >
        событий · сегодня
      </span>
    </div>
  );
}

const MINI_AGENTS = [
  { id: "support", name: "Поддержка клиентов", status: "running" },
  { id: "content", name: "Контент-копирайтер", status: "running" },
  { id: "digest", name: "Дайджест новостей", status: "paused" },
];

export function MockMini() {
  const lines = useLiveLog();
  return (
    <div
      style={{
        border: "1px solid var(--hc-line-2)",
        borderRadius: "var(--hc-r)",
        background: "var(--hc-bg-1)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "10px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--hc-line-1)",
          background: "var(--hc-bg-2)",
        }}
      >
        <span
          className="hf-mono"
          style={{
            fontSize: 10,
            color: "var(--hc-fg-2)",
            textTransform: "uppercase",
            letterSpacing: "0.16em",
          }}
        >
          cockpit · live
        </span>
        <ActivityTicker />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "180px 1fr" }}>
        <div style={{ borderRight: "1px solid var(--hc-line-1)" }}>
          {MINI_AGENTS.map((a, i) => (
            <div
              key={a.id}
              style={{
                padding: "10px 12px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                borderLeft:
                  i === 0
                    ? "2px solid var(--hc-cyan)"
                    : "2px solid transparent",
                background:
                  i === 0 ? "rgba(255,255,255,0.025)" : "transparent",
              }}
            >
              <span
                className={a.status === "running" ? "hf-pulse" : ""}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background:
                    a.status === "running"
                      ? i === 0
                        ? "var(--hc-cyan)"
                        : "var(--hc-fg)"
                      : "var(--hc-fg-3)",
                  display: "inline-block",
                }}
              />
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: i === 0 ? "var(--hc-fg)" : "var(--hc-fg-1)",
                    letterSpacing: "-0.005em",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {a.name}
                </div>
                <div
                  className="hf-mono"
                  style={{
                    fontSize: 9,
                    color: "var(--hc-fg-3)",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    marginTop: 1,
                  }}
                >
                  {a.status === "running" ? "running" : "paused"}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              borderBottom: "1px solid var(--hc-line-1)",
            }}
          >
            <MiniMetric label="uptime" value="99.94%" />
            <MiniMetric label="msg · 24ч" value="1 284" border />
            <MiniMetric label="avg · resp" value="1.2с" border />
          </div>
          <LogFeed lines={lines} />
        </div>
      </div>
    </div>
  );
}

function MiniMetric({
  label,
  value,
  border,
}: {
  label: string;
  value: string;
  border?: boolean;
}) {
  return (
    <div
      style={{
        padding: "12px 14px",
        borderLeft: border ? "1px solid var(--hc-line-1)" : "none",
      }}
    >
      <div className="hf-eyebrow">{label}</div>
      <div
        className="hf-num"
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: "var(--hc-fg)",
          marginTop: 4,
          letterSpacing: "-0.02em",
          fontFamily: "var(--font-manrope), 'Manrope', system-ui, sans-serif",
        }}
      >
        {value}
      </div>
    </div>
  );
}
