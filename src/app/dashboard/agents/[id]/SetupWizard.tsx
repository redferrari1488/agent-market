"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Play,
  ArrowRight,
  Check,
  X as XIcon,
} from "lucide-react";
import styles from "./setup-wizard.module.css";

type SetupField = {
  key: string;
  label: string;
  type: "text" | "textarea" | "password" | "select" | "json_array";
  options?: string[];
  required?: boolean;
  help?: string;
  placeholder?: string;
};

type FieldStatus = { valid: boolean; count?: number; error?: string | null };

function validateUrls(raw: string): FieldStatus {
  if (!raw || !raw.trim()) return { valid: false, count: 0, error: null };
  try {
    const v = JSON.parse(raw);
    if (!Array.isArray(v)) return { valid: false, count: 0, error: "нужен массив" };
    if (v.length === 0) return { valid: false, count: 0, error: "пусто" };
    const bad = v.find(
      (x: unknown) => typeof x !== "string" || !/^https?:\/\//i.test(x),
    );
    if (bad) return { valid: false, count: v.length, error: "не URL" };
    return { valid: true, count: v.length, error: null };
  } catch {
    return { valid: false, count: 0, error: "invalid JSON" };
  }
}

function validateBotToken(raw: string): FieldStatus {
  if (!raw || !raw.trim()) return { valid: false, error: null };
  if (!/^\d+:[A-Za-z0-9_-]{20,}$/.test(raw.trim()))
    return { valid: false, error: "формат: 123:ABC…" };
  return { valid: true, error: null };
}

function validateChatId(raw: string): FieldStatus {
  const v = (raw || "").trim();
  if (!v) return { valid: false, error: null };
  // Принимаем три формата:
  // 1) numeric chat_id: -1001234567890 (приватный канал/супергруппа) или просто 12345 (личка)
  // 2) @username: @public_channel — для публичных каналов и пользователей
  // 3) t.me-ссылка: https://t.me/public_channel — нормализуется как @public_channel
  if (/^-?\d+$/.test(v)) return { valid: true, error: null };
  if (/^@[A-Za-z0-9_]{4,32}$/.test(v)) return { valid: true, error: null };
  if (/^https?:\/\/t\.me\/[A-Za-z0-9_]{4,32}$/.test(v)) return { valid: true, error: null };
  return { valid: false, error: "число (-100...) или @username" };
}

// Чат-ID / Telegram-токен ловим по эвристике на имени ключа — паттерн
// единый для всех агентов: TELEGRAM_BOT_TOKEN, CHAT_ID, CHANNEL_ID, OWNER_CHAT_ID и т.п.
const TOKEN_KEY_RE = /(telegram[_-]?bot[_-]?token|bot[_-]?token)/i;
const CHAT_ID_KEY_RE = /(chat[_-]?id|channel[_-]?id)$/i;

function fieldStatus(field: SetupField, value: string | undefined): FieldStatus {
  const v = value || "";
  // Тип > имя ключа: json_array проверяется одинаково для всех полей.
  if (field.type === "json_array") return validateUrls(v);
  if (TOKEN_KEY_RE.test(field.key)) return validateBotToken(v);
  if (CHAT_ID_KEY_RE.test(field.key)) return validateChatId(v);
  if (field.type === "select") return { valid: !!v, error: null };
  return { valid: !!v.trim(), error: null };
}

function shortLabel(label: string): string {
  // Take a 1–2 word breadcrumb hint out of the full field label.
  return label
    .split(/[,·]/)[0]
    .split(" ")
    .slice(0, 2)
    .join(" ");
}

function displayValue(field: SetupField, value: string): string {
  if (!value) return "— не задано —";
  if (field.type === "password") {
    return "••••••••" + value.slice(-4);
  }
  if (field.type === "textarea") {
    const flat = value.replace(/\s+/g, " ");
    return flat.length > 80 ? flat.slice(0, 80) + "…" : flat;
  }
  return value;
}

type WizardProps = {
  subscriptionId: string;
  schema: SetupField[];
  agentSlug?: string | null;
  initialValues?: Record<string, string>;
  mode?: "setup" | "edit";
};

export function SetupWizard({
  subscriptionId,
  schema,
  agentSlug,
  initialValues,
  mode = "setup",
}: WizardProps) {
  const router = useRouter();
  // edit: конфиг уже работающего агента. /config всё равно пересоздаёт
  // контейнер (deployContainer), поэтому формулировки про «запуск» меняем на
  // «сохранить и перезапустить» — иначе юзеру при правке показывают первичный
  // онбординг-текст про docker pull.
  const isEdit = mode === "edit";
  const [values, setValues] = useState<Record<string, string>>(initialValues ?? {});
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  const total = schema.length;
  const onRecap = step >= total;
  const field = onRecap ? null : schema[step];
  const fStatus = useMemo(
    () => (field ? fieldStatus(field, values[field.key]) : null),
    [field, values],
  );
  const canAdvance = !field || fStatus?.valid || field.required === false;

  const required = schema.filter((f) => f.required !== false);
  const filledRequired = required.filter((f) => fieldStatus(f, values[f.key]).valid)
    .length;
  const allValid = filledRequired === required.length;

  const setValue = (key: string, value: string) =>
    setValues((s) => ({ ...s, [key]: value }));

  const next = () => setStep((s) => Math.min(total, s + 1));
  const prev = () => setStep((s) => Math.max(0, s - 1));

  // Autofocus on step change
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, [step]);

  // Empty schema → POST empty config and refresh.
  useEffect(() => {
    if (schema.length !== 0) return;
    let cancelled = false;
    (async () => {
      try {
        await fetch(`/api/subscriptions/${subscriptionId}/config`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ config: {} }),
        });
      } finally {
        if (!cancelled) router.refresh();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [schema.length, subscriptionId, router]);

  const onSubmit = async () => {
    setError(null);
    const missing = required
      .filter((f) => !fieldStatus(f, values[f.key]).valid)
      .map((f) => f.label);

    if (missing.length > 0) {
      setError(`Заполните: ${missing.join(", ")}`);
      const firstMissingIdx = schema.findIndex(
        (f) => f.required !== false && !fieldStatus(f, values[f.key]).valid,
      );
      if (firstMissingIdx >= 0) setStep(firstMissingIdx);
      return;
    }

    setLoading(true);
    try {
      // Нормализация chat_id-полей перед отправкой: URL t.me/foo → @foo.
      // Контейнер агента шлёт chat_id напрямую в bot.send_message — URL он не
      // поймёт, нужен @username или числовой id.
      const normalized: Record<string, string> = {};
      for (const f of schema) {
        const raw = (values[f.key] || "").trim();
        if (CHAT_ID_KEY_RE.test(f.key)) {
          const m = raw.match(/^https?:\/\/t\.me\/([A-Za-z0-9_]{4,32})$/);
          normalized[f.key] = m ? `@${m[1]}` : raw;
        } else {
          normalized[f.key] = raw;
        }
      }
      const res = await fetch(`/api/subscriptions/${subscriptionId}/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: normalized }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({ error: "" }));
        throw new Error(json.error || "Ошибка сохранения");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!field) return;
    if (e.key === "Enter" && !e.shiftKey && field.type !== "textarea" && canAdvance) {
      e.preventDefault();
      next();
    }
  };

  if (schema.length === 0) {
    return (
      <div className={styles.wrap}>
        <div className={styles.shell}>
          <div className={styles.bar}>
            <span className={styles.lights}>
              <i />
              <i />
              <i />
            </span>
            <span className={styles.cmd}>
              $ hireon setup <span className={styles.flag}>--agent</span>{" "}
              {agentSlug || "agent"}
            </span>
            <span className={styles.live}>BOOTING</span>
          </div>
          <div className={styles.autoLaunch}>
            <div className={styles.spinner} />
            <p className={styles.label2}>Запускаем агента…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.shell}>
        {/* terminal title bar */}
        <div className={styles.bar}>
          <span className={styles.lights}>
            <i />
            <i />
            <i />
          </span>
          <span className={styles.cmd}>
            $ hireon setup <span className={styles.flag}>--agent</span>{" "}
            {agentSlug || "agent"}
          </span>
          <span className={styles.live}>
            {onRecap ? "READY" : "AWAITING INPUT"}
          </span>
        </div>

        {/* step breadcrumb */}
        <div className={styles.stepbar} role="tablist" aria-label="Шаги настройки">
          {schema.map((s, i) => {
            const done = i < step || fieldStatus(s, values[s.key]).valid;
            const active = i === step;
            const cls = [
              styles.step,
              active ? styles.stepActive : "",
              !active && done ? styles.stepDone : "",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <span key={s.key} style={{ display: "contents" }}>
                {i > 0 && <span className={styles.sep} />}
                <button
                  type="button"
                  className={cls}
                  onClick={() => setStep(i)}
                  role="tab"
                  aria-selected={active}
                >
                  <span className={styles.n}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{shortLabel(s.label)}</span>
                </button>
              </span>
            );
          })}
          <span className={styles.sep} />
          <button
            type="button"
            className={`${styles.step} ${onRecap ? styles.stepActive : ""}`}
            onClick={() => setStep(total)}
            role="tab"
            aria-selected={onRecap}
          >
            <span className={styles.n}>
              {String(total + 1).padStart(2, "0")}
            </span>
            <span>{isEdit ? "Сохранение" : "Запуск"}</span>
          </button>
        </div>

        {/* body */}
        <div className={styles.body}>
          {!onRecap && field && (
            <>
              <div className={styles.prompt}>
                <span className={styles.caret}>›</span>
                <span className={styles.label}>
                  <span className={styles.stepN}>
                    [{String(step + 1).padStart(2, "0")}/
                    {String(total).padStart(2, "0")}]
                  </span>
                  {field.label}
                </span>
              </div>
              {field.help && (
                <div className={styles.hint}>
                  {field.help}
                  {field.required !== false ? " · обязательно" : " · опционально"}
                </div>
              )}

              <div className={styles.inputWrap}>
                {field.type === "textarea" ? (
                  <textarea
                    ref={(el) => {
                      inputRef.current = el;
                    }}
                    className={`${styles.textarea} ${
                      fStatus?.valid ? styles.inputValid : ""
                    }`}
                    rows={5}
                    placeholder={field.placeholder}
                    value={values[field.key] || ""}
                    onChange={(e) => setValue(field.key, e.target.value)}
                  />
                ) : field.type === "select" ? (
                  <div className={styles.chips}>
                    {(field.options || []).map((opt) => {
                      const on = values[field.key] === opt;
                      return (
                        <button
                          type="button"
                          key={opt}
                          className={`${styles.chip} ${on ? styles.chipOn : ""}`}
                          onClick={() => setValue(field.key, opt)}
                        >
                          {opt}
                          {field.key === "interval" && (
                            <span className={styles.chipSuffix}>мин</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <input
                    ref={(el) => {
                      inputRef.current = el;
                    }}
                    type={field.type === "password" ? "password" : "text"}
                    className={`${styles.input} ${
                      fStatus?.valid ? styles.inputValid : ""
                    }`}
                    placeholder={field.placeholder}
                    value={values[field.key] || ""}
                    onChange={(e) => setValue(field.key, e.target.value)}
                    onKeyDown={onKeyDown}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                  />
                )}
              </div>

              {/* validation pill */}
              <div className={styles.pillRow}>
                {(() => {
                  if (!fStatus) return null;
                  const hasValue = !!(values[field.key] && values[field.key].trim());
                  if (!hasValue) return null;
                  if (fStatus.valid) {
                    let msg = "ok";
                    if (field.key === "urls" && fStatus.count) {
                      msg = `${fStatus.count} URL · ready`;
                    } else if (field.key === "bot_token") {
                      msg = "токен валиден";
                    } else if (field.type === "select" && field.key === "interval") {
                      msg = `каждые ${values[field.key]} мин`;
                    }
                    return (
                      <span className={`${styles.pill} ${styles.pillOk}`}>
                        <Check className="h-2.5 w-2.5" />
                        {msg}
                      </span>
                    );
                  }
                  if (fStatus.error) {
                    return (
                      <span className={`${styles.pill} ${styles.pillErr}`}>
                        <XIcon className="h-2.5 w-2.5" />
                        {fStatus.error}
                      </span>
                    );
                  }
                  return null;
                })()}
              </div>
            </>
          )}

          {onRecap && (
            <>
              <div className={styles.prompt}>
                <span className={styles.caret}>›</span>
                <span className={styles.label}>
                  <span className={styles.stepN}>
                    [{String(total + 1).padStart(2, "0")}/
                    {String(total + 1).padStart(2, "0")}]
                  </span>
                  {isEdit ? "Сверка и сохранение" : "Сверка и запуск"}
                </span>
              </div>
              <div className={styles.hint}>
                проверь — это попадёт в зашифрованный конфиг агента. правки безболезненны.
              </div>

              <div className={styles.recap}>
                {schema.map((s, i) => {
                  const value = values[s.key] || "";
                  const valid = fieldStatus(s, value).valid;
                  return (
                    <div key={s.key} className={styles.recapRow}>
                      <span
                        className={`${styles.numBox} ${
                          valid ? styles.numBoxDone : ""
                        }`}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <div className={styles.recapK}>{s.label}</div>
                        <div
                          className={`${styles.recapV} ${
                            !value ? styles.recapVMissing : ""
                          }`}
                        >
                          {displayValue(s, value)}
                        </div>
                      </div>
                      <button
                        type="button"
                        className={styles.edit}
                        onClick={() => setStep(i)}
                      >
                        edit ↗
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className={styles.launchRow}>
                <button
                  type="button"
                  className={styles.launchBtn}
                  disabled={!allValid || loading}
                  onClick={onSubmit}
                >
                  <Play className="h-3.5 w-3.5" />
                  {loading
                    ? isEdit
                      ? "Сохраняем…"
                      : "Запускаем…"
                    : isEdit
                      ? "Сохранить и перезапустить"
                      : "Поднять контейнер агента"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
                <span className={styles.launchHint}>
                  {isEdit ? "конфиг обновится · агент перезапустится" : "~3 сек · docker pull → start"}
                </span>
              </div>
            </>
          )}

          {error && (
            <div className={styles.errBanner} role="alert">
              {error}
            </div>
          )}

          {/* terminal footer with keyboard hints */}
          <div className={styles.foot}>
            <span className={styles.shieldRow}>
              <ShieldCheck className="h-3 w-3" />
              AES-256-GCM
            </span>
            <span className={styles.keys}>
              {step > 0 && (
                <button type="button" className={styles.kbd} onClick={prev}>
                  <span className={styles.glyph}>←</span> назад
                </button>
              )}
              {!onRecap && (
                <button
                  type="button"
                  className={styles.kbd}
                  onClick={next}
                  disabled={!canAdvance}
                >
                  далее <span className={styles.glyph}>⏎</span>
                </button>
              )}
              {!onRecap && field?.required === false && (
                <button type="button" className={styles.kbd} onClick={next}>
                  пропустить
                </button>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
