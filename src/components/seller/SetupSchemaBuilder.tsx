"use client";

import { Plus, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type SetupField = {
  key: string;
  label: string;
  type: "text" | "textarea" | "password" | "select";
  options?: string[];
  required: boolean;
};

const fieldTypes = [
  { value: "text", label: "Текст" },
  { value: "textarea", label: "Многострочный текст" },
  { value: "password", label: "Пароль / Секрет" },
  { value: "select", label: "Выбор из списка" },
] as const;

export function SetupSchemaBuilder({
  value,
  onChange,
}: {
  value: SetupField[];
  onChange: (fields: SetupField[]) => void;
}) {
  const addField = () => {
    onChange([
      ...value,
      { key: "", label: "", type: "text", required: true },
    ]);
  };

  const updateField = (index: number, updates: Partial<SetupField>) => {
    const next = value.map((f, i) => (i === index ? { ...f, ...updates } : f));
    onChange(next);
  };

  const removeField = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const moveField = (from: number, to: number) => {
    if (to < 0 || to >= value.length) return;
    const next = [...value];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
          Поля настройки (Setup Schema)
        </Label>
        <Button type="button" variant="outline" size="sm" onClick={addField}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Добавить поле
        </Button>
      </div>

      <div className="rounded-lg border border-border/40 bg-muted/20 p-3 text-[12px] text-muted-foreground space-y-1">
        <p className="font-medium text-foreground">Интеграции и токены</p>
        <p>
          Здесь укажите токены интеграций, которые нужны агенту для работы (Telegram Bot, webhook-и сторонних сервисов и т.д.).
          AI-модель подключена через платформу — про неё спрашивать не надо.
        </p>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Какие данные покупатель должен указать при настройке агента (токены интеграций, параметры).
      </p>

      {value.length === 0 && (
        <div className="rounded-lg border border-dashed border-border/40 p-6 text-center text-[13px] text-muted-foreground">
          Нет полей. Нажмите «Добавить поле» чтобы начать.
        </div>
      )}

      <div className="space-y-2">
        {value.map((field, i) => (
          <div
            key={i}
            className="space-y-2 rounded-lg border border-border/40 p-3"
          >
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="cursor-grab text-muted-foreground hover:text-foreground"
                onClick={() => moveField(i, i - 1)}
                title="Переместить вверх"
              >
                <GripVertical className="h-4 w-4" />
              </button>

              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Input
                  placeholder="Ключ (key)"
                  value={field.key}
                  onChange={(e) =>
                    updateField(i, {
                      key: e.target.value.replace(/[^a-zA-Z0-9_]/g, ""),
                    })
                  }
                  className="h-8 text-[13px]"
                />
                <Input
                  placeholder="Название (label)"
                  value={field.label}
                  onChange={(e) => updateField(i, { label: e.target.value })}
                  className="h-8 text-[13px]"
                />
              </div>

              <select
                value={field.type}
                onChange={(e) =>
                  updateField(i, { type: e.target.value as SetupField["type"] })
                }
                className="h-8 rounded-lg border border-border/40 bg-background px-2 text-[13px] focus:border-border focus:outline-none"
              >
                {fieldTypes.map((ft) => (
                  <option key={ft.value} value={ft.value}>
                    {ft.label}
                  </option>
                ))}
              </select>

              <label className="flex items-center gap-1 text-[11px] text-muted-foreground whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange={(e) => updateField(i, { required: e.target.checked })}
                  className="rounded"
                />
                Обяз.
              </label>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-red-400"
                onClick={() => removeField(i)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>

            {field.type === "select" && (
              <div className="ml-6">
                <Input
                  placeholder="Варианты через запятую (option1, option2, option3)"
                  value={(field.options || []).join(", ")}
                  onChange={(e) =>
                    updateField(i, {
                      options: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  className="h-8 text-[13px]"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
