"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { LogTerminal } from "./LogTerminal";
import "./cockpit.css";

export type DashAgent = {
  id: string;
  agentName: string;
  agentSlug: string;
  agentDescription: string;
  agentCategory: string;
  status: "active" | "paused" | "pending_setup" | "cancelled" | "expired";
  purchaseType: "subscription" | "one_time";
  startedAt: string;
  amount: number | null;
  currency: string;
};

type ContainerStatus = "running" | "stopped" | "error" | "not_found" | "unknown";

const STATUS_LABEL: Record<DashAgent["status"], string> = {
  active: "АКТИВЕН",
  paused: "НА ПАУЗЕ",
  pending_setup: "ЖДЁТ НАСТРОЙКИ",
  cancelled: "ОТМЕНЁН",
  expired: "ИСТЁК",
};

const STATUS_DOT: Record<DashAgent["status"], string> = {
  active: "var(--hc-ok)",
  paused: "var(--hc-mute2)",
  pending_setup: "var(--hc-warn)",
  cancelled: "var(--hc-mute2)",
  expired: "var(--hc-mute2)",
};

const STATUS_SYM: Record<DashAgent["status"], string> = {
  active: "●",
  paused: "◐",
  pending_setup: "◌",
  cancelled: "○",
  expired: "○",
};

function fmtPrice(amount: number | null, currency: string): string {
  if (amount == null) return "—";
  if (currency === "RUB" || currency === "rub") {
    const rub = (amount / 100).toLocaleString("ru-RU", { maximumFractionDigits: 0 });
    return `${rub} ₽`;
  }
  if (currency === "USD" || currency === "usd") {
    const usd = (amount / 100).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `$${usd}`;
  }
  return `${(amount / 100).toFixed(2)} ${currency}`;
}

function formatDate(ymd: string): string {
  if (!ymd) return "—";
  const [y, m, d] = ymd.split("-");
  if (!y || !m || !d) return ymd;
  return `${d}.${m}.${y}`;
}

function StatusDot({ status, size = 6 }: { status: DashAgent["status"]; size?: number }) {
  const pulse = status === "active" || status === "pending_setup";
  return (
    <span
      className={`hc-dot ${pulse ? "hc-dot-pulse" : ""}`}
      style={{ background: STATUS_DOT[status], width: size, height: size }}
    />
  );
}

function AggregateStrip({ agents }: { agents: DashAgent[] }) {
  const counts = {
    active: agents.filter((a) => a.status === "active").length,
    pending: agents.filter((a) => a.status === "pending_setup").length,
    paused: agents.filter((a) => a.status === "paused").length,
    dead: agents.filter((a) => a.status === "expired" || a.status === "cancelled").length,
  };
  const monthly = agents
    .filter((a) => a.status === "active" && a.purchaseType === "subscription" && a.amount != null)
    .reduce((s, a) => s + (a.amount || 0), 0);

  type Cell = { lbl: string; val: string | number; sub: string; dot?: string };
  const items: Cell[] = [
    { lbl: "Всего агентов", val: agents.length, sub: "подписки" },
    { lbl: "Активных", val: counts.active, sub: "работают сейчас", dot: "var(--hc-ok)" },
    {
      lbl: "Ждут настройки",
      val: counts.pending,
      sub: "ваше действие",
      dot: counts.pending ? "var(--hc-warn)" : "var(--hc-mute2)",
    },
    { lbl: "На паузе", val: counts.paused, sub: "остановлены" },
    { lbl: "Истёкшие", val: counts.dead, sub: "можно продлить" },
    { lbl: "Расход в месяц", val: fmtPrice(monthly, "RUB"), sub: "регулярные" },
  ];

  return (
    <section className="hc-agg">
      {items.map((it) => (
        <div className="hc-agg-cell" key={it.lbl}>
          <div className="hc-agg-lbl">
            {it.dot && (
              <span
                className="hc-dot hc-dot-pulse"
                style={{ background: it.dot, width: 5, height: 5 }}
              />
            )}
            {it.lbl}
          </div>
          <div className="hc-agg-val">{it.val}</div>
          <div className="hc-agg-sub">{it.sub}</div>
        </div>
      ))}
    </section>
  );
}

function ListTerminal({
  agents,
  selectedId,
  onSelect,
}: {
  agents: DashAgent[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="hc-lst-term">
      <div className="hc-lst-term-eye">$ hireon agents list --all</div>
      {agents.map((a) => {
        const muted = a.status === "expired" || a.status === "cancelled";
        const sym = STATUS_SYM[a.status];
        return (
          <button
            type="button"
            key={a.id}
            className={`hc-tline ${a.id === selectedId ? "is-sel" : ""} ${muted ? "is-muted" : ""}`}
            onClick={() => onSelect(a.id)}
          >
            <span className="hc-tline-sym" style={{ color: STATUS_DOT[a.status] }}>
              {sym}
            </span>
            <span className="hc-tline-slug">{a.agentSlug}</span>
            <span className="hc-tline-sep">·</span>
            <span className="hc-tline-cat">{a.agentCategory}</span>
            <span className="hc-tline-sep">·</span>
            <span className="hc-tline-price">{fmtPrice(a.amount, a.currency)}</span>
            <span className="hc-tline-sep hc-tline-sep-status">·</span>
            <span className="hc-tline-status">{STATUS_LABEL[a.status]}</span>
          </button>
        );
      })}
      <div className="hc-lst-term-eye dim">— end of list · {agents.length} items</div>
    </div>
  );
}

function MetricCell({ lbl, val, mute = false }: { lbl: string; val: string; mute?: boolean }) {
  return (
    <div className="hc-met">
      <div className="hc-met-lbl">{lbl}</div>
      <div className={`hc-met-val ${mute ? "is-mute" : ""}`}>{val}</div>
    </div>
  );
}

const CONTAINER_LABEL: Record<ContainerStatus, string> = {
  running: "RUNNING",
  stopped: "STOPPED",
  error: "ERROR",
  not_found: "NOT DEPLOYED",
  unknown: "—",
};

function ContainerActions({
  agent,
  containerStatus,
}: {
  agent: DashAgent;
  containerStatus: ContainerStatus;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<null | "start" | "restart">(null);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (endpoint: "start" | "restart") => {
      setBusy(endpoint);
      setError(null);
      try {
        const res = await fetch(`/api/subscriptions/${agent.id}/${endpoint}`, {
          method: "POST",
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || "Ошибка действия");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ошибка");
      } finally {
        setBusy(null);
      }
    },
    [agent.id, router],
  );

  const isRunning = containerStatus === "running";
  const canStart =
    containerStatus === "stopped" ||
    containerStatus === "not_found" ||
    containerStatus === "error";

  return (
    <>
      <div className="hc-actions">
        {isRunning && (
          <>
            <button
              type="button"
              className="hc-btn"
              disabled={busy !== null}
              onClick={() => run("restart")}
            >
              {busy === "restart" ? "..." : "↻ ПЕРЕЗАПУСТИТЬ"}
            </button>
            <Link href={`/dashboard/agents/${agent.id}`} className="hc-btn">
              ⚙ НАСТРОЙКИ
            </Link>
          </>
        )}
        {canStart && (
          <>
            <button
              type="button"
              className="hc-btn hc-btn-primary"
              disabled={busy !== null}
              onClick={() => run("start")}
            >
              {busy === "start" ? "ЗАПУСК..." : "▶ ЗАПУСТИТЬ"}
            </button>
            <Link href={`/dashboard/agents/${agent.id}`} className="hc-btn">
              ⚙ НАСТРОЙКИ
            </Link>
          </>
        )}
        {containerStatus === "unknown" && (
          <Link href={`/dashboard/agents/${agent.id}`} className="hc-btn">
            ⚙ НАСТРОЙКИ
          </Link>
        )}
      </div>
      {error && (
        <div
          className="hc-mono hc-small"
          style={{
            marginTop: 14,
            padding: "10px 14px",
            border: "1px solid rgba(255,80,80,0.3)",
            color: "var(--hc-err)",
            background: "rgba(255,80,80,0.04)",
            textTransform: "none",
            letterSpacing: 0,
          }}
        >
          {error}
        </div>
      )}
    </>
  );
}

function DrillActiveOrPaused({ agent }: { agent: DashAgent }) {
  const [containerStatus, setContainerStatus] = useState<ContainerStatus>("unknown");

  return (
    <>
      <div className="hc-met-grid">
        <MetricCell lbl="CONTAINER" val={CONTAINER_LABEL[containerStatus]} mute={containerStatus !== "running"} />
        <MetricCell lbl="UPTIME" val="—" mute />
        <MetricCell lbl="MESSAGES" val="—" mute />
        <MetricCell lbl="SUCCESS RATE" val="—" mute />
      </div>

      <ContainerActions agent={agent} containerStatus={containerStatus} />

      <div className="hc-dd-rule" />
      <div className="hc-dd-section-eye">LIVE LOG STREAM</div>
      <LogTerminal
        subscriptionId={agent.id}
        agentSlug={agent.agentSlug}
        tall
        onStatusChange={setContainerStatus}
      />
    </>
  );
}

function DrillPending({ agent }: { agent: DashAgent }) {
  const startedFmt = formatDate(agent.startedAt);
  const steps = [
    { done: true, txt: `оплата подтверждена · ${startedFmt}` },
    { done: false, txt: "пройти конфигурацию агента" },
    { done: false, txt: "указать параметры запуска" },
    { done: false, txt: "запустить тестовый прогон" },
  ];
  return (
    <>
      <div className="hc-pending-callout">
        <div className="hc-pending-eye">
          <span
            className="hc-dot hc-dot-pulse"
            style={{ background: "var(--hc-warn)", width: 6, height: 6 }}
          />
          <span>REQUIRES SETUP</span>
        </div>
        <div className="hc-pending-title">Агент куплен, но ещё не запущен.</div>
        <div className="hc-pending-sub">
          Пройдите конфигурацию ниже — это займёт несколько минут.
        </div>
      </div>

      <div className="hc-pending-list">
        {steps.map((s, i) => (
          <div key={i} className={`hc-pstep ${s.done ? "is-done" : ""}`}>
            <span className="hc-pstep-n">{String(i + 1).padStart(2, "0")}</span>
            <span className="hc-pstep-mark">{s.done ? "✓" : "○"}</span>
            <span className="hc-pstep-txt">{s.txt}</span>
          </div>
        ))}
      </div>

      <div className="hc-actions">
        <Link href={`/dashboard/agents/${agent.id}`} className="hc-btn hc-btn-primary">
          НАЧАТЬ НАСТРОЙКУ →
        </Link>
      </div>
    </>
  );
}

function DrillExpired({ agent }: { agent: DashAgent }) {
  return (
    <>
      <div className="hc-met-grid">
        <MetricCell lbl="ПОСЛЕДНЯЯ АКТИВНОСТЬ" val={formatDate(agent.startedAt)} mute />
        <MetricCell lbl="ЦЕНА БЫЛА" val={fmtPrice(agent.amount, agent.currency)} mute />
        <MetricCell lbl="ВСЕГО ЗАПУСКОВ" val="—" mute />
        <MetricCell lbl="СТАТУС" val={STATUS_LABEL[agent.status]} mute />
      </div>
      <div className="hc-expired-callout">
        <div className="hc-mono hc-small hc-mute">
          подписка завершена. данные хранятся 30 дней.
        </div>
      </div>
      <div className="hc-actions">
        <Link href="/agents" className="hc-btn hc-btn-primary">↻ ПРОДЛИТЬ ПОДПИСКУ</Link>
      </div>
    </>
  );
}

function DrillPanel({ agent }: { agent: DashAgent | null }) {
  if (!agent) {
    return (
      <div className="hc-dd hc-dd-empty">
        <div className="hc-mono hc-small hc-mute">$ выберите агента из списка</div>
      </div>
    );
  }

  const showActive = agent.status === "active" || agent.status === "paused";
  const showPending = agent.status === "pending_setup";
  const showExpired = agent.status === "expired" || agent.status === "cancelled";
  const priceSuffix = agent.purchaseType === "subscription" ? "/мес" : " разово";

  return (
    <div className="hc-dd">
      <div className="hc-dd-head">
        <div className="hc-dd-eye">
          <span className="hc-mono hc-small hc-mute">
            {agent.agentCategory.toUpperCase()} · {agent.agentSlug}
          </span>
          <div className="hc-dd-status">
            <StatusDot status={agent.status} size={7} />
            <span className="hc-mono hc-small">{STATUS_LABEL[agent.status]}</span>
          </div>
        </div>
        <h1 className="hc-dd-name">{agent.agentName}</h1>
        {agent.agentDescription && <div className="hc-dd-desc">{agent.agentDescription}</div>}
        <div className="hc-dd-meta">
          с {formatDate(agent.startedAt)} · {fmtPrice(agent.amount, agent.currency)}
          {priceSuffix} · ID {agent.id.slice(0, 8)}
        </div>
      </div>

      <div className="hc-dd-rule" />

      {showActive && <DrillActiveOrPaused agent={agent} />}
      {showPending && <DrillPending agent={agent} />}
      {showExpired && <DrillExpired agent={agent} />}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="hc-empty">
      <div className="hc-empty-eye">$ hireon agents list — empty</div>
      <h1 className="hc-empty-title">У вас ещё нет агентов.</h1>
      <p className="hc-empty-sub">
        Купите первого в каталоге — настройка занимает несколько минут,
        <br />
        работа начинается сразу после.
      </p>
      <div className="hc-empty-actions">
        <Link href="/agents" className="hc-btn hc-btn-primary hc-btn-lg">
          ОТКРЫТЬ КАТАЛОГ →
        </Link>
        <Link href="/agents?browse=1" className="hc-btn hc-btn-lg">
          КАК ЭТО РАБОТАЕТ
        </Link>
      </div>
      <div className="hc-empty-foot">
        ─── обычно первый агент окупается за 8–12 дней ───
      </div>
    </div>
  );
}

export function DashboardCockpit({ agents }: { agents: DashAgent[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    if (agents.length === 0) return null;
    const active = agents.find((a) => a.status === "active");
    return (active || agents[0]).id;
  });

  const selected = agents.find((a) => a.id === selectedId) || null;

  if (agents.length === 0) {
    return (
      <div className="hireon-cockpit">
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="hireon-cockpit">
      <AggregateStrip agents={agents} />
      <div className="hc-cockpit">
        <aside className="hc-side">
          <div className="hc-side-head">
            <span className="hc-mono hc-small hc-mute">СПИСОК · {agents.length}</span>
            <Link href="/agents" className="hc-side-add">+ ДОБАВИТЬ</Link>
          </div>
          <ListTerminal agents={agents} selectedId={selectedId} onSelect={setSelectedId} />
        </aside>
        <main className="hc-main">
          <DrillPanel agent={selected} />
        </main>
      </div>
    </div>
  );
}
