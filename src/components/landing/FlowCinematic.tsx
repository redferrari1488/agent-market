"use client";

import { useState } from "react";
import { CatChip, LiveDot, monoStyle, onestStyle } from "@/components/landing/redesign/shared";
import { FlowCinematicMobile } from "@/components/landing/FlowCinematicMobile";
import "./cockpit-landing.css";

// FlowCinematic (Final Fix 2026-05-16): «От выбора до запуска - три шага».
// Слева — 3 строки шагов (клик переключает active), справа — мокап,
// меняющийся по active шагу. Метки шагов — тонкая черта + слово, без 01·.
//
// Моки переписаны под дизайн Final Fix:
// - FlowMockCatalog: окно /agents + 4 строки каталога (категория, название,
//   sub-tag, цена /мес)
// - FlowMockConfig: окно /agents/ai-support + таблица настроек
//   (api_key, telegram_bot_token, schedule, crm, tone_of_voice) +
//   статус «✓ api_key · валиден / ~4 сек до запуска»
// - FlowMockCockpit: окно /cockpit + статы (uptime/msg/resp) +
//   цветной лог событий (INTAKE/REPLY/CRM/TOOL)

const STEPS = [
  {
    id: 0,
    label: "выбор",
    title: "Выбираете",
    desc: "Готовый рабочий сценарий с ценой, метриками и историей запусков у других клиентов.",
  },
  {
    id: 1,
    label: "подключение",
    title: "Подключаете",
    desc: "Настройка и интеграции - в кабинете. Без созвонов и переписок с менеджером.",
  },
  {
    id: 2,
    label: "работа",
    title: "Работает",
    desc: "Живёт в кабинете 24/7. Логи, метрики и контроль - под рукой.",
  },
];

export function FlowCinematic() {
  const [active, setActive] = useState(0);

  return (
    <>
      <FlowCinematicMobile />
      <section
        className="hf-cinematic-desktop"
        style={{
          ...onestStyle,
          background: "var(--hr-bg-base)",
          color: "var(--hr-fg-1)",
          paddingTop: 80,
          paddingBottom: 80,
          borderTop: "1px solid var(--hr-border-1)",
          borderBottom: "1px solid var(--hr-border-1)",
        }}
      >
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 28px" }}>
          <h2
            style={{
              fontSize: "clamp(2.25rem, 5vw, 3rem)",
              fontWeight: 700,
              letterSpacing: "-0.035em",
              lineHeight: 0.98,
              color: "var(--hr-fg-1)",
              margin: 0,
              marginBottom: 44,
              maxWidth: 760,
            }}
          >
            От выбора до запуска -{" "}
            <span style={{ color: "var(--hr-teal)" }}>три шага</span>.
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.05fr)",
              gap: 56,
              alignItems: "start",
            }}
          >
            {/* LEFT: 3 шага */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                borderTop: "1px solid var(--hr-border-1)",
              }}
            >
              {STEPS.map((s, i) => {
                const isActive = i === active;
                return (
                  <div
                    key={s.id}
                    onClick={() => setActive(i)}
                    style={{
                      cursor: "pointer",
                      padding: "22px 0 24px",
                      borderBottom: "1px solid var(--hr-border-1)",
                      minHeight: 132,
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                      position: "relative",
                    }}
                  >
                    {/* teal rail слева у активного */}
                    <span
                      style={{
                        position: "absolute",
                        left: -16,
                        top: 22,
                        bottom: 24,
                        width: 2,
                        background: isActive ? "var(--hr-teal)" : "transparent",
                        transition: "background .2s ease",
                      }}
                    />
                    <h3
                      style={{
                        fontSize: 28,
                        fontWeight: 700,
                        letterSpacing: "-0.025em",
                        lineHeight: 1.02,
                        color: isActive ? "var(--hr-fg-1)" : "var(--hr-fg-2)",
                        margin: 0,
                        transition: "color .2s ease",
                      }}
                    >
                      {s.title}
                    </h3>
                    <p
                      style={{
                        fontSize: 15.5,
                        lineHeight: 1.55,
                        color: isActive ? "var(--hr-fg-2)" : "var(--hr-fg-3)",
                        maxWidth: 440,
                        margin: 0,
                        transition: "color .2s ease",
                      }}
                    >
                      {s.desc}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* RIGHT: мок, меняется по active */}
            <div style={{ position: "relative", minHeight: 440 }}>
              <FlowMockSwitch active={active} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function FlowMockSwitch({ active }: { active: number }) {
  return (
    <div style={{ position: "relative", minHeight: 440 }}>
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
                : `translateX(${i < active ? -10 : 10}px)`,
              transition:
                "opacity .35s ease, transform .45s cubic-bezier(.2,.8,.2,1)",
              pointerEvents: isActive ? "auto" : "none",
            }}
          >
            {i === 0 && <FlowMockCatalog />}
            {i === 1 && <FlowMockConfig />}
            {i === 2 && <FlowMockCockpit />}
          </div>
        );
      })}
    </div>
  );
}

// ── Моки шагов ───────────────────────────────────────────────────────────
function FlowMockCatalog() {
  const items = [
    {
      tag: "поддержка",
      color: "var(--hr-cat-support)",
      title: "Поддержка в Telegram",
      sub: "starter",
      price: "4 900",
    },
    {
      tag: "контент",
      color: "var(--hr-cat-content)",
      title: "Контент-редактор",
      sub: "pro",
      price: "9 900",
    },
    {
      tag: "мониторинг",
      color: "var(--hr-cat-monitoring)",
      title: "Мониторинг сайтов",
      sub: "pro",
      price: "5 900",
    },
    {
      tag: "продажи",
      color: "var(--hr-cat-sales)",
      title: "Lead Qualifier",
      sub: "pro",
      price: "12 400",
    },
  ];
  return (
    <MockShell title="/agents" sub="каталог · 126 рез.">
      <div style={{ display: "flex", flexDirection: "column", padding: "4px 0" }}>
        {items.map((it, i) => (
          <div
            key={i}
            style={{
              padding: "13px 4px",
              borderTop: i > 0 ? "1px solid var(--hr-border-1)" : "none",
              display: "grid",
              gridTemplateColumns: "90px minmax(0, 1fr) auto",
              alignItems: "center",
              gap: 12,
            }}
          >
            <CatChip color={it.color}>{it.tag}</CatChip>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 14.5,
                  fontWeight: 600,
                  color: "var(--hr-fg-1)",
                  letterSpacing: "-0.01em",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {it.title}
              </div>
              <div
                style={{
                  ...monoStyle,
                  fontSize: 10,
                  color: "var(--hr-fg-4)",
                  letterSpacing: "0.06em",
                  marginTop: 3,
                  textTransform: "uppercase",
                }}
              >
                {it.sub}
              </div>
            </div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "baseline",
                gap: 3,
                whiteSpace: "nowrap",
                fontWeight: 600,
                fontSize: 14.5,
                color: "var(--hr-fg-1)",
              }}
            >
              <span>{it.price}</span>
              <span style={{ color: "var(--hr-fg-3)" }}>₽</span>
              <span
                style={{
                  ...monoStyle,
                  fontSize: 10,
                  color: "var(--hr-fg-4)",
                  marginLeft: 3,
                }}
              >
                /мес
              </span>
            </div>
          </div>
        ))}
      </div>
    </MockShell>
  );
}

function FlowMockConfig() {
  const rows = [
    { k: "telegram_bot_token", tag: "encrypted", v: "7421:AAH···xQ" },
    { k: "schedule", tag: "каждые 2 мин", v: "*/2 * * * *" },
    { k: "crm", tag: "amoCRM", v: "ws-3 · prod" },
    { k: "tone_of_voice", tag: "ru-ru", v: "professional · helpful" },
  ];
  return (
    <MockShell title="/agents/ai-support" sub="настройка · шаг 2 / 3">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          padding: "16px 6px 8px",
        }}
      >
        {rows.map((r, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div
              style={{
                ...monoStyle,
                fontSize: 12,
                color: "var(--hr-fg-2)",
                display: "inline-flex",
                gap: 6,
                alignItems: "baseline",
              }}
            >
              <span>{r.k}</span>
              {r.tag && (
                <span style={{ color: "var(--hr-fg-4)", fontSize: 10.5 }}>
                  · {r.tag}
                </span>
              )}
            </div>
            <div
              style={{
                ...monoStyle,
                fontSize: 12,
                color: "var(--hr-fg-1)",
                background: "var(--hr-bg-elev-2)",
                padding: "4px 9px",
                borderRadius: 6,
              }}
            >
              {r.v}
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          ...monoStyle,
          marginTop: 12,
          paddingTop: 14,
          borderTop: "1px solid var(--hr-border-1)",
          fontSize: 11,
          color: "var(--hr-fg-2)",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span style={{ color: "var(--hr-cat-monitoring)" }}>
          ✓ telegram_bot_token · валиден
        </span>
        <span style={{ color: "var(--hr-teal)" }}>~4 сек до запуска →</span>
      </div>
    </MockShell>
  );
}

function FlowMockCockpit() {
  const log = [
    { t: "12:04:58", k: "INTAKE", c: "var(--hr-cat-analytics)", m: "msg @ivan_k → support" },
    { t: "12:05:01", k: "REPLY", c: "var(--hr-cat-monitoring)", m: "response · 1.4s" },
    { t: "12:05:03", k: "CRM", c: "var(--hr-cat-content)", m: "updated #4821" },
    { t: "12:05:07", k: "INTAKE", c: "var(--hr-cat-analytics)", m: "msg @marina → qualify" },
    { t: "12:05:14", k: "TOOL", c: "var(--hr-cat-support)", m: "calendar.book вт 15:30" },
    { t: "12:05:18", k: "REPLY", c: "var(--hr-cat-monitoring)", m: "response · 0.9s" },
  ];
  return (
    <MockShell title="/cockpit" sub="live · 12 847 событий">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 8,
          padding: "14px 6px 10px",
        }}
      >
        {(
          [
            ["uptime", "99.94%"],
            ["msg · 24h", "1 284"],
            ["resp", "1.2 с"],
          ] as Array<[string, string]>
        ).map(([k, v], i) => (
          <div
            key={i}
            style={{
              background: "var(--hr-bg-elev-2)",
              padding: "10px 12px",
              borderRadius: 8,
            }}
          >
            <div
              style={{
                ...monoStyle,
                fontSize: 9.5,
                color: "var(--hr-fg-4)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              {k}
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: "var(--hr-fg-1)",
                marginTop: 4,
                letterSpacing: "-0.02em",
              }}
            >
              {v}
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          ...monoStyle,
          padding: "8px 6px 0",
          fontSize: 11,
          lineHeight: 1.7,
          color: "var(--hr-fg-2)",
          borderTop: "1px solid var(--hr-border-1)",
          marginTop: 10,
        }}
      >
        {log.map((l, i) => (
          <div key={i} style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
            <span style={{ color: "var(--hr-fg-4)", width: 64 }}>{l.t}</span>
            <span style={{ color: l.c, fontWeight: 500, width: 64 }}>{l.k}</span>
            <span style={{ color: "var(--hr-fg-2)" }}>✓ {l.m}</span>
          </div>
        ))}
      </div>
    </MockShell>
  );
}

function MockShell({
  title,
  sub,
  children,
}: {
  title: string;
  sub: string;
  children: React.ReactNode;
}) {
  return (
    // hr-glass-shell — liquid glass подача мока (cockpit-landing.css)
    <div className="hr-glass-shell">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 4px 12px",
          borderBottom: "1px solid var(--hr-border-1)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", gap: 6 }}>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: "50%",
                  background: "var(--hr-bg-elev-3)",
                }}
              />
            ))}
          </div>
          <div style={{ ...monoStyle, fontSize: 11.5, color: "var(--hr-fg-2)" }}>
            <span style={{ color: "var(--hr-fg-4)" }}>hireon.agency</span>
            {title}
          </div>
        </div>
        <div
          style={{
            ...monoStyle,
            fontSize: 10,
            color: "var(--hr-fg-4)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <LiveDot size={5} pulse={false} />
          {sub}
        </div>
      </div>
      {children}
    </div>
  );
}
