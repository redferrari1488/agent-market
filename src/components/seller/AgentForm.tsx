"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Send, Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SetupSchemaBuilder, type SetupField } from "./SetupSchemaBuilder";

type AgentData = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  longDescription: string;
  category: string;
  pricingModel: string;
  priceMonthly: number | null;
  priceOnetime: number | null;
  dockerImage: string;
  features: string[];
  setupSchema: SetupField[];
  envTemplate: Record<string, string>;
  status?: string;
};

const categories = [
  { value: "support", label: "Поддержка" },
  { value: "content", label: "Контент" },
  { value: "analytics", label: "Аналитика" },
  { value: "sales", label: "Продажи" },
  { value: "monitoring", label: "Мониторинг" },
];

const pricingModels = [
  { value: "subscription", label: "Подписка (ежемесячно)" },
  { value: "one_time", label: "Разовая покупка" },
  { value: "both", label: "Оба варианта" },
];

export function AgentForm({ initial }: { initial?: AgentData }) {
  const router = useRouter();
  const isEdit = !!initial?.id;

  const [form, setForm] = useState<AgentData>({
    name: initial?.name || "",
    slug: initial?.slug || "",
    description: initial?.description || "",
    longDescription: initial?.longDescription || "",
    category: initial?.category || "support",
    pricingModel: initial?.pricingModel || "subscription",
    priceMonthly: initial?.priceMonthly ?? null,
    priceOnetime: initial?.priceOnetime ?? null,
    dockerImage: initial?.dockerImage || "",
    features: initial?.features || [],
    setupSchema: initial?.setupSchema || [],
    envTemplate: initial?.envTemplate || {},
    status: initial?.status,
  });

  const [featureInput, setFeatureInput] = useState("");
  const [envKey, setEnvKey] = useState("");
  const [envVal, setEnvVal] = useState("");
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof AgentData>(key: K, val: AgentData[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  // Авто-slug из имени
  const handleNameChange = (name: string) => {
    set("name", name);
    if (!isEdit) {
      set(
        "slug",
        name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
      );
    }
  };

  const addFeature = () => {
    if (featureInput.trim() && form.features.length < 20) {
      set("features", [...form.features, featureInput.trim()]);
      setFeatureInput("");
    }
  };

  const removeFeature = (i: number) => {
    set("features", form.features.filter((_, idx) => idx !== i));
  };

  const addEnvVar = () => {
    if (envKey.trim()) {
      set("envTemplate", { ...form.envTemplate, [envKey.trim()]: envVal });
      setEnvKey("");
      setEnvVal("");
    }
  };

  const removeEnvVar = (key: string) => {
    const next = { ...form.envTemplate };
    delete next[key];
    set("envTemplate", next);
  };

  const toPayload = () => ({
    name: form.name,
    slug: form.slug,
    description: form.description,
    long_description: form.longDescription || undefined,
    category: form.category,
    pricing_model: form.pricingModel,
    price_monthly:
      form.pricingModel === "one_time" ? null : form.priceMonthly,
    price_onetime:
      form.pricingModel === "subscription" ? null : form.priceOnetime,
    docker_image: form.dockerImage,
    features: form.features,
    setup_schema: form.setupSchema,
    env_template: form.envTemplate,
  });

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const url = isEdit
        ? `/api/seller/agents/${initial!.id}`
        : "/api/seller/agents";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload()),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Ошибка сохранения");
        return;
      }

      if (!isEdit) {
        router.push(`/seller/agents/${json.data.id}/edit`);
      }
      router.refresh();
    } catch {
      setError("Ошибка сети");
    } finally {
      setSaving(false);
    }
  };

  const submitForReview = async () => {
    if (!initial?.id) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/seller/agents/${initial.id}/submit`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Ошибка отправки");
        return;
      }
      router.refresh();
    } catch {
      setError("Ошибка сети");
    } finally {
      setSubmitting(false);
    }
  };

  const showMonthly = form.pricingModel !== "one_time";
  const showOnetime = form.pricingModel !== "subscription";
  const canSubmit = isEdit && (form.status === "draft" || form.status === "rejected");

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">
          {error}
        </div>
      )}

      {/* Основная информация */}
      <section className="space-y-4">
        <h3 className="text-base font-bold">Основная информация</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Название</Label>
            <Input
              id="name"
              placeholder="Telegram Support Bot"
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="slug">Slug (URL)</Label>
            <Input
              id="slug"
              placeholder="telegram-support-bot"
              value={form.slug}
              onChange={(e) =>
                set(
                  "slug",
                  e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9-]/g, "")
                )
              }
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Краткое описание (10–300 символов)</Label>
          <Textarea
            id="description"
            placeholder="Что делает этот агент?"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={2}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="longDescription">Подробное описание (опционально)</Label>
          <Textarea
            id="longDescription"
            placeholder="Подробности: как работает, какие задачи решает, примеры..."
            value={form.longDescription}
            onChange={(e) => set("longDescription", e.target.value)}
            rows={5}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Категория</Label>
            <select
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Docker-образ</Label>
            <Input
              placeholder="registry/image:tag"
              value={form.dockerImage}
              onChange={(e) => set("dockerImage", e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Ценообразование */}
      <section className="space-y-4">
        <h3 className="text-base font-bold">Ценообразование</h3>

        <div className="space-y-1.5">
          <Label>Модель оплаты</Label>
          <select
            value={form.pricingModel}
            onChange={(e) => set("pricingModel", e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {pricingModels.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {showMonthly && (
            <div className="space-y-1.5">
              <Label>Цена подписки (руб/мес)</Label>
              <Input
                type="number"
                placeholder="1500"
                value={form.priceMonthly ? form.priceMonthly / 100 : ""}
                onChange={(e) =>
                  set(
                    "priceMonthly",
                    e.target.value ? Math.round(Number(e.target.value) * 100) : null
                  )
                }
              />
              <p className="text-xs text-muted-foreground">Минимум 100 руб</p>
            </div>
          )}
          {showOnetime && (
            <div className="space-y-1.5">
              <Label>Разовая цена (руб)</Label>
              <Input
                type="number"
                placeholder="9900"
                value={form.priceOnetime ? form.priceOnetime / 100 : ""}
                onChange={(e) =>
                  set(
                    "priceOnetime",
                    e.target.value ? Math.round(Number(e.target.value) * 100) : null
                  )
                }
              />
              <p className="text-xs text-muted-foreground">Минимум 100 руб</p>
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Комиссия платформы — 15%. Вы получаете 85% от каждого платежа.
        </p>
      </section>

      {/* Фичи */}
      <section className="space-y-4">
        <h3 className="text-base font-bold">Возможности (features)</h3>

        <div className="flex gap-2">
          <Input
            placeholder="Добавить возможность..."
            value={featureInput}
            onChange={(e) => setFeatureInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())}
            className="flex-1"
          />
          <Button type="button" variant="outline" size="sm" onClick={addFeature}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {form.features.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {form.features.map((f, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-sm"
              >
                {f}
                <button
                  type="button"
                  onClick={() => removeFeature(i)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Setup Schema */}
      <section className="space-y-4">
        <SetupSchemaBuilder
          value={form.setupSchema}
          onChange={(fields) => set("setupSchema", fields)}
        />
      </section>

      {/* Env Template */}
      <section className="space-y-4">
        <h3 className="text-base font-bold">Переменные окружения (env_template)</h3>
        <p className="text-xs text-muted-foreground">
          Статические переменные окружения, которые будут переданы в контейнер для всех покупателей.
        </p>

        <div className="flex gap-2">
          <Input
            placeholder="KEY"
            value={envKey}
            onChange={(e) => setEnvKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""))}
            className="w-40"
          />
          <Input
            placeholder="value"
            value={envVal}
            onChange={(e) => setEnvVal(e.target.value)}
            className="flex-1"
          />
          <Button type="button" variant="outline" size="sm" onClick={addEnvVar}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {Object.keys(form.envTemplate).length > 0 && (
          <div className="rounded-lg border border-border divide-y divide-border">
            {Object.entries(form.envTemplate).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between px-3 py-2 text-sm">
                <span className="font-mono text-xs">
                  {k}={v}
                </span>
                <button
                  type="button"
                  onClick={() => removeEnvVar(k)}
                  className="text-muted-foreground hover:text-red-500"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Кнопки */}
      <div className="flex items-center gap-3 border-t border-border pt-6">
        <Button onClick={save} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {isEdit ? "Сохранить" : "Создать черновик"}
        </Button>

        {canSubmit && (
          <Button variant="outline" onClick={submitForReview} disabled={submitting}>
            {submitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            На модерацию
          </Button>
        )}
      </div>
    </div>
  );
}
