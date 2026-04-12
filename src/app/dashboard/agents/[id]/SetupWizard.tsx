"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

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

  if (schema.length === 0) {
    return (
      <div className="rounded-lg border border-border/40 p-6 text-center">
        <p className="text-[13px] text-muted-foreground">
          Этот агент не требует настройки.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-border/40 p-5"
    >
      <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
        Настройка
      </h2>

      <div className="mt-4 space-y-4">
        {schema.map((field) => (
          <div key={field.key}>
            <label className="mb-1.5 block text-[13px] font-medium">
              {field.label}
              {field.required !== false && (
                <span className="ml-1 text-red-400">*</span>
              )}
            </label>

            {field.type === "textarea" ? (
              <textarea
                value={values[field.key] || ""}
                onChange={(e) =>
                  setValues({ ...values, [field.key]: e.target.value })
                }
                rows={4}
                className="w-full rounded-lg border border-border/40 bg-background px-3.5 py-2.5 text-[13px] outline-none transition-colors focus:border-border"
              />
            ) : field.type === "select" ? (
              <select
                value={values[field.key] || ""}
                onChange={(e) =>
                  setValues({ ...values, [field.key]: e.target.value })
                }
                className="w-full rounded-lg border border-border/40 bg-background px-3.5 py-2.5 text-[13px] outline-none transition-colors focus:border-border"
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
                className="w-full rounded-lg border border-border/40 bg-background px-3.5 py-2.5 text-[13px] outline-none transition-colors focus:border-border"
              />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-[13px] text-red-400">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-6 inline-flex h-11 items-center gap-2 rounded-lg bg-foreground px-6 text-[14px] font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Сохранить и запустить
      </button>

      <p className="mt-3 font-mono text-[10px] text-muted-foreground">
        Данные шифруются AES-256-GCM. Расшифровка только в момент запуска агента.
      </p>
    </form>
  );
}
