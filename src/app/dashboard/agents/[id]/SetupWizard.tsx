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
      <div className="rounded-xl border border-border p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Этот агент не требует настройки.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-border p-6"
    >
      <div className="mb-5 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
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
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            ) : field.type === "select" ? (
              <select
                value={values[field.key] || ""}
                onChange={(e) =>
                  setValues({ ...values, [field.key]: e.target.value })
                }
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
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
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
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
        className="mt-5 inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
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
