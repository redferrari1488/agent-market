"use client";

import { useState } from "react";
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
        <Label className="text-sm font-medium">Поля настройки (Setup Schema)</Label>
        <Button type="button" variant="outline" size="sm" onClick={addField}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Добавить поле
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Какие данные покупатель должен указать при настройке агента (API-ключи, токены, параметры).
      </p>

      {value.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Нет полей. Нажмите «Добавить поле» чтобы начать.
        </div>
      )}

      <div className="space-y-2">
        {value.map((field, i) => (
          <div
            key={i}
            className="rounded-lg border border-border bg-secondary/30 p-3 space-y-2"
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

              <div className="flex-1 grid grid-cols-2 gap-2">
                <Input
                  placeholder="Ключ (key)"
                  value={field.key}
                  onChange={(e) =>
                    updateField(i, {
                      key: e.target.value.replace(/[^a-zA-Z0-9_]/g, ""),
                    })
                  }
                  className="h-8 text-sm"
                />
                <Input
                  placeholder="Название (label)"
                  value={field.label}
                  onChange={(e) => updateField(i, { label: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>

              <select
                value={field.type}
                onChange={(e) =>
                  updateField(i, { type: e.target.value as SetupField["type"] })
                }
                className="h-8 rounded-md border border-input bg-background px-2 text-sm"
              >
                {fieldTypes.map((ft) => (
                  <option key={ft.value} value={ft.value}>
                    {ft.label}
                  </option>
                ))}
              </select>

              <label className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
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
                className="h-8 w-8 text-muted-foreground hover:text-red-500"
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
                  className="h-8 text-sm"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
