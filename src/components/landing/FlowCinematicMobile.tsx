"use client";

import { useEffect, useState } from "react";

// ──────────────────────────────────────────────────────────────────────
//  Mobile-only Flow section — ported from Claude Design after.jsx.
//  Three steps vertical, each with its own compact mock card.
//  Toggled in/out via CSS .hf-cinematic-mobile { display: none/block }.
// ──────────────────────────────────────────────────────────────────────

const FLOW_STEPS = [
  {
    n: 1,
    kicker: "t = 0 · ВЫБОР",
    title: "Выбираете",
    desc: "Готовый сценарий из каталога. Не идея, а формат работы — с метриками и ценой.",
  },
  {
    n: 2,
    kicker: "t + 2 МИН · ПОДКЛЮЧЕНИЕ",
    title: "Подключаете",
    desc: "Настройка и интеграции — в кабинете. Без созвонов и переписок.",
    active: true,
  },
  {
    n: 3,
    kicker: "24 / 7 · РАБОТА",
    title: "Работает",
    desc: "Живёт в кабинете 24/7. Логи, метрики, контроль.",
  },
];

export function FlowCinematicMobile() {
  return (
    <section className="hireon-flow hf-cinematic-mobile">
      <div className="fcm-head">
        <div className="fcm-eyebrow">
          <span>◆ §02</span>
          <span className="rule" />
          <span className="meta">avg · 4 мин</span>
        </div>
        <h2 className="fcm-h2">
          От выбора до запуска — <span className="cy">три шага</span>.
        </h2>
      </div>

      <FlowStep step={FLOW_STEPS[0]}>
        <FlowCatalogMockMobile />
      </FlowStep>
      <FlowStep step={FLOW_STEPS[1]}>
        <FlowConfigMockMobile />
      </FlowStep>
      <FlowStep step={FLOW_STEPS[2]}>
        <FlowMiniMockMobile />
      </FlowStep>
    </section>
  );
}

function FlowStep({
  step,
  children,
}: {
  step: (typeof FLOW_STEPS)[number];
  children: React.ReactNode;
}) {
  return (
    <div className={`fcm-step${step.active ? " is-active" : ""}`}>
      <div className="fcm-kicker">
        0{step.n} · {step.kicker}
      </div>
      <h3 className="fcm-step-title">{step.title}</h3>
      <p className="fcm-step-desc">{step.desc}</p>
      {children}
    </div>
  );
}

// ── Catalog mock ─────────────────────────────────────────────────────
const CAT_ROWS = [
  { name: "Поддержка клиентов", meta: "поддержка · telegram", price: "4 900 ₽", color: "oklch(0.68 0.19 195)" },
  { name: "Контент-копирайтер", meta: "контент · еженедельно", price: "9 900 ₽", color: "oklch(0.66 0.04 250)" },
  { name: "Дайджест новостей", meta: "новости · ленты", price: "3 900 ₽", color: "oklch(0.72 0.04 80)" },
  { name: "Мониторинг сайтов", meta: "ops · uptime", price: "5 900 ₽", color: "oklch(0.70 0.05 25)" },
];

function FlowCatalogMockMobile() {
  return (
    <div className="fcm-mockcard">
      <div className="fcm-mock-bar">
        <span>/agents · каталог</span>
        <span style={{ color: "var(--hc-fg-3)" }}>126</span>
      </div>
      <div className="fcm-catlist">
        {CAT_ROWS.map((r, i) => (
          <div className="fcm-catrow" key={i}>
            <span className="fcm-catrow-stripe" style={{ background: r.color }} />
            <div className="fcm-catrow-body">
              <div className="fcm-catrow-name">{r.name}</div>
              <div className="fcm-catrow-meta">{r.meta}</div>
            </div>
            <span className="fcm-catrow-price">
              {r.price}
              <br />
              <span style={{ color: "var(--hc-fg-3)" }}>/мес</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Config mock with rolling validation ──────────────────────────────
function FlowConfigMockMobile() {
  const [v, setV] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setV((x) => (x + 1) % 4), 1100);
    return () => clearInterval(t);
  }, []);
  const checks = [
    { l: "api_key · валидный формат", ok: true },
    { l: "telegram-бот · отвечает", ok: v >= 1 },
    { l: "расписание · cron валиден", ok: v >= 2 },
    { l: "amoCRM · доступ к записи", ok: v >= 3 },
  ];
  return (
    <div className="fcm-mockcard">
      <div className="fcm-mock-bar">
        <span>/agents/ai-support · настройка</span>
        <span>шаг 2 / 3</span>
      </div>
      <div className="fcm-config">
        <Field lbl="api_key · encrypted" val="sk-ag-pj4···k82q" />
        <Field lbl="telegram_bot_token" val="7421:AAH···xQ" />
        <Field lbl="schedule · каждые 2 мин" val="*/2 * * * *" />
        <Field lbl="crm" val="amoCRM · prod ▾" />
        <div className="fcm-config-ticks">
          <div className="fcm-config-eye">валидация</div>
          {checks.map((c, i) => (
            <div key={i} className={`fcm-tick ${c.ok ? "ok" : "pending"}`}>
              <span className="m">{c.ok ? "✓" : "·"}</span>
              <span>{c.l}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="fcm-config-foot">
        <span>готовность · ~4 сек</span>
        <span className="fcm-config-cta">запустить →</span>
      </div>
    </div>
  );
}

function Field({ lbl, val }: { lbl: string; val: string }) {
  return (
    <div className="fcm-field">
      <div className="fcm-field-lbl">{lbl}</div>
      <div className="fcm-field-val">{val}</div>
    </div>
  );
}

// ── Mini cockpit mock ────────────────────────────────────────────────
const MINI_TAGS = ["REPLY", "INTAKE", "CRM", "TOOL"];
const MINI_MSGS = [
  "response sent · 1.1s · gpt-tier-2",
  "msg @t.berg · routed → qualify",
  "updated #4856 · amoCRM",
  "telegram.notify · #support-warm",
  "enriched · score 78",
  "response sent · 0.8s · gpt-tier-2",
];

function fmtClock(d: Date) {
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
}

function FlowMiniMockMobile() {
  const [activeIdx, setActive] = useState(0);
  const [lines, setLines] = useState<{ t: string; tag: string; msg: string }[]>([
    { t: "17:37:24", tag: "CRM", msg: "enriched · score 81" },
    { t: "17:37:27", tag: "CRM", msg: "enriched · score 78" },
    { t: "17:37:30", tag: "CRM", msg: "enriched · score 84" },
    { t: "17:37:32", tag: "INTAKE", msg: "msg @lebedev → support" },
    { t: "17:37:35", tag: "INTAKE", msg: "msg @t.berg → qualify" },
    { t: "17:37:38", tag: "CRM", msg: "updated #4863 · amoCRM" },
    { t: "17:37:41", tag: "REPLY", msg: "response sent · 1.1s" },
    { t: "17:37:43", tag: "TOOL", msg: "telegram.notify" },
  ]);

  const agents = [
    { name: "Поддержка клиентов", st: "running", paused: false },
    { name: "Контент-копирайтер", st: "running", paused: false },
    { name: "Дайджест", st: "paused", paused: true },
  ];

  const [tickerN, setTickerN] = useState(12866);
  useEffect(() => {
    const t = setInterval(() => {
      setLines((prev) => {
        const next = [
          ...prev,
          {
            t: fmtClock(new Date()),
            tag: MINI_TAGS[Math.floor(Math.random() * MINI_TAGS.length)],
            msg: MINI_MSGS[Math.floor(Math.random() * MINI_MSGS.length)],
          },
        ];
        return next.length > 10 ? next.slice(-10) : next;
      });
      setTickerN((v) => v + Math.floor(Math.random() * 3) + 1);
    }, 2400);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="fcm-mockcard fcm-minicpit">
      <div className="fcm-mock-bar">
        <span>cockpit · live</span>
        <span className="fcm-mini-ticker">
          <i />
          {tickerN.toLocaleString("ru-RU")}
        </span>
      </div>
      <div className="fcm-mini-strip">
        {agents.map((a, i) => (
          <button
            key={i}
            type="button"
            className={`fcm-mini-pill${i === activeIdx ? " is-active" : ""}${
              a.paused ? " is-paused" : ""
            }`}
            onClick={() => setActive(i)}
          >
            <span className="dot" />
            <span>
              <span className="nm">{a.name}</span>
              <br />
              <span className="st">{a.st}</span>
            </span>
          </button>
        ))}
      </div>
      <div className="fcm-mini-row3">
        <div className="fcm-mini-cell">
          <div className="lbl">uptime</div>
          <div className="v">99.94%</div>
        </div>
        <div className="fcm-mini-cell">
          <div className="lbl">msg · 24ч</div>
          <div className="v">1 284</div>
        </div>
        <div className="fcm-mini-cell">
          <div className="lbl">avg</div>
          <div className="v">1.2с</div>
        </div>
      </div>
      <div className="fcm-mini-log">
        {lines.map((l, i) => (
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
