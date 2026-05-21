"use client";

import { useEffect, useState } from "react";

// ──────────────────────────────────────────────────────────────────────
//  Mobile-only Flow section — v3 (Claude Design after.jsx).
//  Tab-stepper: 01 / 02 / 03 → один активный мок + prev/next кнопки.
//  Toggle через CSS .hf-cinematic-mobile { display: block on ≤640px }.
// ──────────────────────────────────────────────────────────────────────

const STEPS = [
  {
    label: "Выбираете",
    desc: "Открываете каталог и выбираете готовый сценарий с метриками, ценой и историей запусков у других клиентов.",
    mock: "catalog" as const,
  },
  {
    label: "Подключаете",
    desc: "Вводите ключи и параметры прямо в кабинете. Без созвонов с менеджером и копания в коде.",
    mock: "config" as const,
  },
  {
    label: "Работает",
    desc: "Агент работает в кабинете 24/7. Логи, метрики и кнопка рестарта всегда на виду.",
    mock: "cockpit" as const,
  },
];

export function FlowCinematicMobile() {
  const [active, setActive] = useState(0);
  const step = STEPS[active];

  return (
    <section className="hireon-flow hf-cinematic-mobile">
      <div className="fcm-eyebrow">
        <span>◆ §02</span>
        <span className="rule" />
      </div>

      <h2 className="fcm-h2">
        <span style={{ whiteSpace: "nowrap" }}>От выбора до запуска -</span>
        <br />
        <span className="cy" style={{ whiteSpace: "nowrap" }}>три шага</span>.
      </h2>

      {/* Stepper tabs */}
      <div className="fcm-tabs">
        {STEPS.map((s, i) => (
          <button
            key={i}
            type="button"
            className={`fcm-tab${i === active ? " is-active" : ""}`}
            onClick={() => setActive(i)}
            aria-selected={i === active}
            role="tab"
          >
            <div className="fcm-tab-num">0{i + 1}</div>
            <div className="fcm-tab-label">{s.label}</div>
          </button>
        ))}
      </div>

      {/* Active step body */}
      <div key={active} className="fcm-step-body">
        <h3 className="fcm-step-title">{step.label}</h3>
        <p className="fcm-step-desc">{step.desc}</p>
        {step.mock === "catalog" && <CompactCatalog />}
        {step.mock === "config" && <CompactConfig />}
        {step.mock === "cockpit" && <CompactCockpit />}
      </div>

      {/* prev/next */}
      <div className="fcm-nav">
        <button
          type="button"
          className="fcm-nav-btn"
          disabled={active === 0}
          onClick={() => setActive((a) => Math.max(0, a - 1))}
        >
          ← назад
        </button>
        <button
          type="button"
          className="fcm-nav-btn"
          disabled={active === 2}
          onClick={() => setActive((a) => Math.min(2, a + 1))}
        >
          дальше →
        </button>
      </div>
    </section>
  );
}

// ── Compact Catalog mock ─────────────────────────────────────────────
const CAT_ROWS = [
  { name: "Бот поддержки в Telegram", meta: "telegram", price: "2 990 ₽", color: "oklch(0.74 0.13 195)", active: true },
  { name: "Контент-копирайтер", meta: "еженедельно", price: "990 ₽", color: "oklch(0.66 0.04 250)" },
  { name: "Мониторинг сайтов", meta: "uptime", price: "1 490 ₽", color: "oklch(0.70 0.05 25)" },
];

function CompactCatalog() {
  return (
    <div className="fcm-mockcard">
      <div className="fcm-mock-bar">
        <span>каталог · 126</span>
        <span style={{ color: "var(--hc-cyan)" }}>фильтр: все</span>
      </div>
      <div>
        {CAT_ROWS.map((r, i) => (
          <div
            key={i}
            className={`fcm-cat-row${r.active ? " is-active" : ""}${i === 0 ? " is-first" : ""}`}
          >
            <span className="fcm-cat-stripe" style={{ background: r.color }} />
            <div className="fcm-cat-body">
              <div className="fcm-cat-name">{r.name}</div>
              <div className="fcm-cat-meta">{r.meta}</div>
            </div>
            <span className="fcm-cat-price">{r.price}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Compact Config mock ──────────────────────────────────────────────
function CompactConfig() {
  const [v, setV] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setV((x) => (x + 1) % 4), 900);
    return () => clearInterval(t);
  }, []);
  const checks = [
    "api_key валиден",
    "telegram отвечает",
    "cron корректен",
    "crm доступен",
  ];

  return (
    <div className="fcm-mockcard">
      <div className="fcm-mock-bar">
        <span>настройка · шаг 2 / 3</span>
      </div>
      <div className="fcm-cfg-body">
        <Field lbl="api_key" val="sk-ag-pj4···k82q" />
        <Field lbl="telegram bot" val="7421:AAH···xQ" />
        <Field lbl="расписание" val="каждые 2 мин" />
        <div className="fcm-cfg-check-label">проверка</div>
        {checks.map((lbl, i) => (
          <div
            key={i}
            className={`fcm-cfg-check ${v >= i ? "is-ok" : "is-pending"}`}
          >
            <span className="m">{v >= i ? "✓" : "·"}</span>
            <span>{lbl}</span>
          </div>
        ))}
      </div>
      <div className="fcm-cfg-foot">
        <span className="fcm-cfg-cta">запустить →</span>
      </div>
    </div>
  );
}

function Field({ lbl, val }: { lbl: string; val: string }) {
  return (
    <div className="fcm-cfg-field">
      <div className="fcm-cfg-field-lbl">{lbl}</div>
      <div className="fcm-cfg-field-val">{val}</div>
    </div>
  );
}

// ── Compact Cockpit mock ─────────────────────────────────────────────
const COCKPIT_LINES = [
  { t: "17:39:24", tag: "INTAKE", msg: "msg @ivan_k · routed → support" },
  { t: "17:39:27", tag: "REPLY", msg: "response sent · 1.4s" },
  { t: "17:39:30", tag: "CRM", msg: "updated #4821 · amoCRM" },
];

function CompactCockpit() {
  const [tickerN, setTickerN] = useState(12866);
  useEffect(() => {
    const t = setInterval(
      () => setTickerN((v) => v + Math.floor(Math.random() * 3) + 1),
      2400,
    );
    return () => clearInterval(t);
  }, []);
  return (
    <div className="fcm-mockcard">
      <div className="fcm-mock-bar">
        <span>cockpit · live</span>
        <span className="fcm-ck-ticker">
          <i />
          {tickerN.toLocaleString("ru-RU")}
        </span>
      </div>
      <div className="fcm-ck-head">
        <span className="fcm-ck-head-dot" />
        <span className="fcm-ck-head-name">Поддержка клиентов</span>
        <div className="fcm-ck-head-meta">работает · 14 дней</div>
      </div>
      <div className="fcm-ck-metrics">
        <div className="fcm-ck-metric">
          <div className="lbl">uptime</div>
          <div className="v">99.94%</div>
        </div>
        <div className="fcm-ck-metric">
          <div className="lbl">msg · 24ч</div>
          <div className="v">1 284</div>
        </div>
      </div>
      <div className="fcm-ck-log">
        {COCKPIT_LINES.map((l, i) => (
          <div className="ln" key={i}>
            <span className="t">{l.t}</span>
            <span className="b">
              <span className="tag">{l.tag}</span>
              <span className="ok">✓</span>
              {l.msg}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
