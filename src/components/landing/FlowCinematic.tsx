"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  MockCatalog,
  MockConfig,
  MockMini,
} from "@/components/landing/FlowHorizontal";
import "./cockpit-landing.css";

const STEPS = [
  {
    id: 0,
    kicker: "t = 0",
    label: "выбор",
    title: "Выбираете",
    desc: "Готовый сценарий из каталога. Не идея, а формат работы — с метриками, ценой и логом запусков.",
    side: "/agents · каталог",
    bullets: [
      "126 готовых агентов",
      "категории · цены · sla",
      "демо без регистрации",
    ],
  },
  {
    id: 1,
    kicker: "t + 2 мин",
    label: "подключение",
    title: "Подключаете",
    desc: "Ключи и параметры в кабинете. Без созвонов и переписок с менеджером.",
    side: "self-serve · web",
    bullets: [
      "api_key · webhook_url · cron",
      "валидация в фоне",
      "откат в один клик",
    ],
  },
  {
    id: 2,
    kicker: "24 / 7",
    label: "работа",
    title: "Работает",
    desc: "Живёт в кабинете 24/7. Логи, метрики и контроль — под рукой.",
    side: "cockpit · live",
    bullets: [
      "stdout в реальном времени",
      "stop · restart в один клик",
      "биллинг по факту работы",
    ],
  },
];

export function FlowCinematic() {
  const [active, setActive] = useState(0);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(
      () => setActive((x) => (x + 1) % STEPS.length),
      7200,
    );
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
        paddingTop: 96,
        paddingBottom: 120,
        borderTop: "1px solid var(--hc-line-1)",
        borderBottom: "1px solid var(--hc-line-1)",
      }}
    >
      <div className="hf-page">
        {/* eyebrow */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginBottom: 48,
          }}
        >
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
            fontSize: "clamp(40px, 6vw, 80px)",
            color: "var(--hc-fg)",
            marginBottom: 56,
            marginTop: 0,
            maxWidth: 920,
          }}
        >
          От выбора <br />
          до запуска — <span style={{ color: "var(--hc-cyan)" }}>три шага</span>.
        </h2>

        {/* timeline rail */}
        <FlowTimeline active={active} setActive={select} />

        {/* scene — типографический narrative слева, мокап справа */}
        <div className="hf-cinematic-scene">
          {/* LEFT — три шага в одном списке */}
          <div>
            {STEPS.map((s, i) => {
              const isActive = i === active;
              return (
                <div
                  key={s.id}
                  onClick={() => select(i)}
                  style={{
                    cursor: "pointer",
                    padding: "20px 0",
                    borderBottom:
                      i < STEPS.length - 1
                        ? "1px solid var(--hc-line-1)"
                        : "none",
                    transition: "opacity .25s ease",
                    opacity: isActive ? 1 : 0.42,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 14,
                      marginBottom: 6,
                    }}
                  >
                    <span
                      className="hf-mono"
                      style={{
                        fontSize: 11,
                        color: isActive ? "var(--hc-cyan)" : "var(--hc-fg-3)",
                        textTransform: "uppercase",
                        letterSpacing: "0.18em",
                        width: 110,
                        flexShrink: 0,
                        transition: "color .25s ease",
                      }}
                    >
                      0{i + 1} · {s.label}
                    </span>
                    {isActive && (
                      <span
                        style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            flex: 1,
                            height: 1,
                            background: "var(--hc-cyan)",
                          }}
                        />
                        <span
                          className="hf-mono"
                          style={{
                            fontSize: 10,
                            color: "var(--hc-fg-3)",
                            textTransform: "uppercase",
                            letterSpacing: "0.14em",
                          }}
                        >
                          {s.kicker}
                        </span>
                      </span>
                    )}
                  </div>
                  <h3
                    className="hf-section"
                    style={{
                      fontSize: isActive ? 56 : 22,
                      color: "var(--hc-fg)",
                      margin: 0,
                      transition:
                        "font-size .3s cubic-bezier(.2,.8,.2,1)",
                    }}
                  >
                    {s.title}
                  </h3>
                  {isActive && (
                    <>
                      <p
                        style={{
                          fontSize: 17,
                          lineHeight: 1.55,
                          color: "var(--hc-fg-1)",
                          maxWidth: 480,
                          margin: "14px 0 16px",
                        }}
                      >
                        {s.desc}
                      </p>
                      <ul
                        style={{
                          margin: 0,
                          padding: 0,
                          listStyle: "none",
                          display: "flex",
                          flexDirection: "column",
                          gap: 6,
                        }}
                      >
                        {s.bullets.map((b, bi) => (
                          <li key={bi} className="hf-tick">
                            <span style={{ color: "var(--hc-cyan)" }}>—</span>
                            <span
                              className="hf-mono"
                              style={{
                                color: "var(--hc-fg-1)",
                                fontSize: 11.5,
                              }}
                            >
                              {b}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* RIGHT — мокап с x-translate переходом */}
          <div style={{ position: "relative", minHeight: 520 }}>
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
            marginTop: 96,
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
              style={{
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              открыть каталог →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

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
                i < STEPS.length - 1
                  ? "1px solid var(--hc-line-1)"
                  : "none",
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

function FlowMockSwitch({ active }: { active: number }) {
  return (
    <div style={{ position: "relative", minHeight: 520 }}>
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
