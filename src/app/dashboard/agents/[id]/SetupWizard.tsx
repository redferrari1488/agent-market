"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, CheckCircle2 } from "lucide-react";

type SetupField = {
  key: string;
  label: string;
  type: "text" | "textarea" | "password" | "select";
  options?: string[];
  required?: boolean;
};

export function SetupWizard({
  subscriptionId,
  schema,
}: {
  subscriptionId: string;
  schema: SetupField[];
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const missing = schema
      .filter((f) => f.required !== false && !values[f.key]?.trim())
      .map((f) => f.label);

    if (missing.length > 0) {
      setError(`Заполните: ${missing.join(", ")}`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/subscriptions/${subscriptionId}/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: values }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Ошибка сохранения");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  // Если у агента нет конфигурируемых полей — стартуем сразу.
  // POST с пустым config переводит подписку pending_setup → active и поднимает контейнер.
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

  if (schema.length === 0) {
    return (
      <div className="rounded-[2px] border border-white/[0.08] bg-[#111115] p-8 text-center">
        <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
        <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
          Запускаем агента…
        </p>
      </div>
    );
  }

  const requiredFields = schema.filter((f) => f.required !== false);
  const filledCount = requiredFields.filter((f) => values[f.key]?.trim()).length;
  const progress = requiredFields.length > 0 ? (filledCount / requiredFields.length) * 100 : 100;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Header с прогрессом */}
      <div className="rounded-[2px] border border-white/[0.08] bg-[#111115] p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-mono text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Настройка
            </h2>
            <p className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.06em] text-muted-foreground/70">
              заполните поля ниже, чтобы агент начал работу.
            </p>
          </div>
          <div className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
            {filledCount} / {requiredFields.length}
          </div>
        </div>

        <div className="mt-4 h-[2px] overflow-hidden bg-white/[0.06]">
          <div
            className="h-full bg-foreground transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Поля */}
      <div className="rounded-[2px] border border-white/[0.08] bg-[#111115] p-5">
        <div className="space-y-5">
          {schema.map((field, i) => {
            const filled = !!values[field.key]?.trim();
            return (
              <div key={field.key}>
                <label className="flex items-center gap-2 text-[13px] font-medium">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-[2px] border border-white/[0.08] font-mono text-[10px] text-muted-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {field.label}
                  {field.required !== false && (
                    <span className="text-rose-400/80">*</span>
                  )}
                  {filled && <CheckCircle2 className="h-3.5 w-3.5 text-foreground/70" />}
                </label>

                <div className="mt-2">
                  {field.type === "textarea" ? (
                    <textarea
                      value={values[field.key] || ""}
                      onChange={(e) =>
                        setValues({ ...values, [field.key]: e.target.value })
                      }
                      rows={4}
                      className="w-full rounded-[2px] border border-white/[0.08] bg-[#08080a] px-3.5 py-2.5 font-mono text-[12.5px] outline-none transition-colors focus:border-white/[0.18]"
                    />
                  ) : field.type === "select" ? (
                    <select
                      value={values[field.key] || ""}
                      onChange={(e) =>
                        setValues({ ...values, [field.key]: e.target.value })
                      }
                      className="w-full rounded-[2px] border border-white/[0.08] bg-[#08080a] px-3.5 py-2.5 text-[13px] outline-none transition-colors focus:border-white/[0.18]"
                    >
                      <option value="">— выбрать —</option>
                      {field.options?.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type === "password" ? "password" : "text"}
                      value={values[field.key] || ""}
                      onChange={(e) =>
                        setValues({ ...values, [field.key]: e.target.value })
                      }
                      className="w-full rounded-[2px] border border-white/[0.08] bg-[#08080a] px-3.5 py-2.5 font-mono text-[12.5px] outline-none transition-colors focus:border-white/[0.18]"
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="rounded-[2px] border border-rose-500/30 bg-rose-500/[0.04] p-3 font-mono text-[12px] text-rose-300">
          {error}
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted-foreground/60">
          <ShieldCheck className="h-3 w-3" />
          AES-256-GCM шифрование
        </p>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-[2px] bg-foreground px-6 font-mono text-[12px] font-medium uppercase tracking-[0.08em] text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Сохранить и запустить
        </button>
      </div>
    </form>
  );
}
