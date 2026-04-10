"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";

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

    // Валидация обязательных полей
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
      <div className="rounded-2xl border border-border/50 bg-card/50 p-6 text-center backdrop-blur-sm">
        <p className="text-sm text-muted-foreground">
          Этот агент не требует настройки.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm"
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />
      <div className="relative mb-6 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
          <Sparkles className="h-4 w-4" />
        </div>
        <h2 className="text-base font-bold">Настройка</h2>
      </div>

      <div className="space-y-4">
        {schema.map((field) => (
          <div key={field.key}>
            <label className="mb-1.5 block text-sm font-medium">
              {field.label}
              {field.required !== false && (
                <span className="ml-1 text-red-500">*</span>
              )}
            </label>

            {field.type === "textarea" ? (
              <textarea
                value={values[field.key] || ""}
                onChange={(e) =>
                  setValues({ ...values, [field.key]: e.target.value })
                }
                rows={4}
                className="w-full rounded-xl border border-border/50 bg-white/5 px-3.5 py-2.5 text-sm outline-none backdrop-blur-sm transition-colors focus:border-violet-500/50 focus:bg-white/[0.07]"
              />
            ) : field.type === "select" ? (
              <select
                value={values[field.key] || ""}
                onChange={(e) =>
                  setValues({ ...values, [field.key]: e.target.value })
                }
                className="w-full rounded-xl border border-border/50 bg-white/5 px-3.5 py-2.5 text-sm outline-none backdrop-blur-sm transition-colors focus:border-violet-500/50 focus:bg-white/[0.07]"
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
                className="w-full rounded-xl border border-border/50 bg-white/5 px-3.5 py-2.5 text-sm outline-none backdrop-blur-sm transition-colors focus:border-violet-500/50 focus:bg-white/[0.07]"
              />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-blue-600 px-6 text-sm font-bold text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/40 hover:brightness-110 disabled:opacity-50"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Сохранить и запустить
      </button>

      <p className="mt-3 text-[11px] text-muted-foreground">
        Данные шифруются AES-256-GCM. Расшифровка только в момент запуска агента.
      </p>
    </form>
  );
}
