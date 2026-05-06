"use client";

import { useState } from "react";
import {
  MockCatalog,
  MockConfig,
  MockMini,
} from "@/components/landing/FlowHorizontal";
import "./cockpit-landing.css";

const STEPS = [
  {
    id: 0,
    label: "выбор",
    title: "Выбираете",
    desc: "Готовый сценарий из каталога. Не идея, а формат работы — с метриками, ценой и логом запусков.",
    side: "/agents · каталог",
  },
  {
    id: 1,
    label: "подключение",
    title: "Подключаете",
    desc: "Ключи и параметры в кабинете. Без созвонов и переписок с менеджером.",
    side: "self-serve · web",
  },
  {
    id: 2,
    label: "работа",
    title: "Работает",
    desc: "Живёт в кабинете 24/7. Логи, метрики и контроль — под рукой.",
    side: "cockpit · live",
  },
];

export function FlowCinematic() {
  const [active, setActive] = useState(0);
  const a = STEPS[active];

  return (
    <section
      className="hireon-flow"
      style={{
        paddingTop: 88,
        paddingBottom: 96,
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
            marginBottom: 40,
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
            ◆ §02 · как это работает
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
            fontSize: "clamp(36px, 5vw, 64px)",
            color: "var(--hc-fg)",
            marginTop: 0,
            marginBottom: 48,
            maxWidth: 880,
          }}
        >
          От выбора до запуска —{" "}
          <span style={{ color: "var(--hc-cyan)" }}>три шага</span>.
        </h2>

        {/* scene — слева список с фикс-высотой строк, справа мокап */}
        <div className="hf-cinematic-scene">
          {/* LEFT — три строки, фиксированная высота, без bullets */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              borderTop: "1px solid var(--hc-line-2)",
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
                    borderBottom: "1px solid var(--hc-line-1)",
                    minHeight: 132,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    position: "relative",
                  }}
                >
                  {/* cyan rail слева у активного */}
                  <span
                    style={{
                      position: "absolute",
                      left: -16,
                      top: 22,
                      bottom: 24,
                      width: 2,
                      background: isActive ? "var(--hc-cyan)" : "transparent",
                      transition: "background .2s ease",
                    }}
                  />
                  <span
                    className="hf-mono"
                    style={{
                      fontSize: 10,
                      color: isActive ? "var(--hc-cyan)" : "var(--hc-fg-3)",
                      textTransform: "uppercase",
                      letterSpacing: "0.18em",
                      transition: "color .2s ease",
                    }}
                  >
                    0{i + 1} · {s.label}
                  </span>
                  <h3
                    className="hf-section"
                    style={{
                      fontSize: 28,
                      color: isActive ? "var(--hc-fg)" : "var(--hc-fg-2)",
                      margin: 0,
                      transition: "color .2s ease",
                    }}
                  >
                    {s.title}
                  </h3>
                  <p
                    style={{
                      fontSize: 14,
                      lineHeight: 1.5,
                      color: isActive ? "var(--hc-fg-1)" : "var(--hc-fg-3)",
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

          {/* RIGHT — мокап */}
          <div style={{ position: "relative" }}>
            <div
              className="hf-mono"
              style={{
                fontSize: 10,
                color: "var(--hc-fg-3)",
                textTransform: "uppercase",
                letterSpacing: "0.16em",
                marginBottom: 10,
              }}
            >
              <span style={{ color: "var(--hc-cyan)", marginRight: 8 }}>▸</span>
              {a.side}
            </div>
            <div style={{ position: "relative", minHeight: 440 }}>
              <FlowMockSwitch active={active} />
            </div>
          </div>
        </div>
      </div>
    </section>
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
