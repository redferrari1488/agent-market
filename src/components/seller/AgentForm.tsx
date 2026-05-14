"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Send, Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SetupSchemaBuilder, type SetupField } from "./SetupSchemaBuilder";
import { COMPUTE_CLASSES } from "@/lib/compute";

// Phase 0: только subscription, compute_class зафиксирован на M.
// Селекторы pricing_model и compute_class скрыты из UI; поля в БД сохраняются.
const FIXED_PRICING_MODEL = "subscription";
const FIXED_COMPUTE_CLASS = "M" as const;

type AgentData = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  longDescription: string;
  category: string;
  priceMonthly: number | null;
  dockerImage: string;
  features: string[];
  keywords: string[];
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

export function AgentForm({
  initial,
}: {
  initial?: AgentData;
}) {
  const router = useRouter();
  const isEdit = !!initial?.id;

  const [form, setForm] = useState<AgentData>({
    name: initial?.name || "",
    slug: initial?.slug || "",
    description: initial?.description || "",
    longDescription: initial?.longDescription || "",
    category: initial?.category || "support",
    priceMonthly: initial?.priceMonthly ?? null,
    dockerImage: initial?.dockerImage || "",
    features: initial?.features || [],
    keywords: initial?.keywords || [],
    setupSchema: initial?.setupSchema || [],
    envTemplate: initial?.envTemplate || {},
    status: initial?.status,
  });

  const [featureInput, setFeatureInput] = useState("");
  const [keywordInput, setKeywordInput] = useState("");
  const [envKey, setEnvKey] = useState("");
  const [envVal, setEnvVal] = useState("");
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof AgentData>(key: K, val: AgentData[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

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

  const addKeyword = () => {
    const cleaned = keywordInput
      .toLowerCase()
      .split(/[,\n]/)
      .map((k) => k.trim())
      .filter((k) => k.length > 0 && k.length <= 40);
    if (cleaned.length === 0) return;
    const merged = Array.from(new Set([...form.keywords, ...cleaned])).slice(0, 30);
    set("keywords", merged);
    setKeywordInput("");
  };

  const removeKeyword = (i: number) => {
    set("keywords", form.keywords.filter((_, idx) => idx !== i));
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
    pricing_model: FIXED_PRICING_MODEL,
    price_monthly: form.priceMonthly,
    price_onetime: null,
    compute_class: FIXED_COMPUTE_CLASS,
    needs_cron: false,
    docker_image: form.dockerImage,
    features: form.features,
    keywords: form.keywords,
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

  const canSubmit = isEdit && (form.status === "draft" || form.status === "rejected");

  const inputClass = "flex h-10 w-full rounded-[2px] border border-[rgba(244,236,222,0.08)] bg-[#08080a] px-3 text-[13px] transition-colors focus:border-[rgba(244,236,222,0.18)] focus:outline-none";

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-[2px] border border-rose-500/30 bg-rose-500/[0.04] p-3 font-mono text-[12px] text-rose-300">
          {error}
        </div>
      )}

      {/* Основная информация */}
      <section className="rounded-[2px] border border-[rgba(244,236,222,0.08)] bg-[#161412] p-5">
        <h3 className="font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
          Основная информация
        </h3>
        <div className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-[13px]">Название</Label>
              <Input
                id="name"
                placeholder="Telegram Support Bot"
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="slug" className="text-[13px]">Slug (URL)</Label>
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
            <Label htmlFor="description" className="text-[13px]">Краткое описание (10–300 символов)</Label>
            <Textarea
              id="description"
              placeholder="Что делает этот агент?"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="longDescription" className="text-[13px]">Подробное описание (опционально)</Label>
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
              <Label className="text-[13px]">Категория</Label>
              <select
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                className={inputClass}
              >
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Docker-образ</Label>
              <Input
                placeholder="registry/image:tag"
                value={form.dockerImage}
                onChange={(e) => set("dockerImage", e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Цена подписки */}
      <section className="rounded-[2px] border border-[rgba(244,236,222,0.08)] bg-[#161412] p-5">
        <h3 className="font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
          Цена подписки
        </h3>
        <div className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[13px]">Ваша цена (руб/мес)</Label>
            <Input
              type="number"
              placeholder="500"
              value={form.priceMonthly ? form.priceMonthly / 100 : ""}
              onChange={(e) =>
                set(
                  "priceMonthly",
                  e.target.value ? Math.round(Number(e.target.value) * 100) : null
                )
              }
            />
            <p className="text-[11px] text-muted-foreground">Ваш труд, без хостинга и AI. Минимум 100 руб.</p>
          </div>

          {form.priceMonthly != null && (
            <div className="rounded-[2px] border border-[rgba(244,236,222,0.08)] bg-[#1a1815] p-4 text-[13px] space-y-1">
              <div className="flex justify-between text-muted-foreground">
                <span>Ваша цена</span>
                <span>{(form.priceMonthly / 100).toLocaleString("ru")} ₽</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Хостинг + AI</span>
                <span>+{(COMPUTE_CLASSES[FIXED_COMPUTE_CLASS].priceKopecks / 100).toLocaleString("ru")} ₽</span>
              </div>
              <div className="flex justify-between border-t border-[rgba(244,236,222,0.06)] pt-1 font-medium">
                <span>Покупатель платит</span>
                <span>{((form.priceMonthly + COMPUTE_CLASSES[FIXED_COMPUTE_CLASS].priceKopecks) / 100).toLocaleString("ru")} ₽/мес</span>
              </div>
              <div className="flex justify-between text-muted-foreground text-[11px]">
                <span>Комиссия платформы</span>
                <span className="text-foreground">0 ₽</span>
              </div>
              <div className="flex justify-between font-semibold text-foreground">
                <span>К выплате вам</span>
                <span>{(form.priceMonthly / 100).toLocaleString("ru")} ₽/мес</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Фичи */}
      <section className="rounded-[2px] border border-[rgba(244,236,222,0.08)] bg-[#161412] p-5">
        <h3 className="font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
          Возможности (features)
        </h3>
        <div className="mt-4 space-y-4">
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
                  className="inline-flex items-center gap-1.5 rounded-[2px] border border-[rgba(244,236,222,0.08)] bg-[#1a1815] px-2.5 py-1 text-[13px]"
                >
                  {f}
                  <button
                    type="button"
                    onClick={() => removeFeature(i)}
                    className="text-muted-foreground transition-colors hover:text-rose-300"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Keywords */}
      <section className="rounded-[2px] border border-[rgba(244,236,222,0.08)] bg-[#161412] p-5">
        <h3 className="font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
          Ключевые слова
        </h3>
        <p className="mt-2 text-[12px] text-muted-foreground">
          По чему вас найдут в поиске. Описывайте боль клиента, а не функции:
          «клиенты пишут ночью», «теряются лиды», «не успеваю отвечать». До 30
          штук.
        </p>
        <div className="mt-4 space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="клиенты, поддержка, telegram, ночью, faq..."
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())}
              className="flex-1"
            />
            <Button type="button" variant="outline" size="sm" onClick={addKeyword}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {form.keywords.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.keywords.map((k, i) => (
                <span
                  key={k + i}
                  className="inline-flex items-center gap-1.5 rounded-[2px] border border-[rgba(244,236,222,0.08)] bg-[#08080a] px-2 py-0.5 font-mono text-[11px] tracking-[0.02em] text-muted-foreground"
                >
                  {k}
                  <button
                    type="button"
                    onClick={() => removeKeyword(i)}
                    className="text-muted-foreground transition-colors hover:text-rose-300"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Setup Schema */}
      <section className="rounded-[2px] border border-[rgba(244,236,222,0.08)] bg-[#161412] p-5">
        <SetupSchemaBuilder
          value={form.setupSchema}
          onChange={(fields) => set("setupSchema", fields)}
        />
      </section>

      {/* Env Template */}
      <section className="rounded-[2px] border border-[rgba(244,236,222,0.08)] bg-[#161412] p-5">
        <h3 className="font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
          Переменные окружения (env_template)
        </h3>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Статические переменные окружения, которые будут переданы в контейнер для всех покупателей.
        </p>
        <div className="mt-4 space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="KEY"
              value={envKey}
              onChange={(e) => setEnvKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""))}
              className="w-full sm:w-40"
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
            <div className="divide-y divide-[rgba(244,236,222,0.06)] rounded-[2px] border border-[rgba(244,236,222,0.08)] bg-[#161412]">
              {Object.entries(form.envTemplate).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between px-3 py-2 text-[13px]">
                  <span className="font-mono text-[11px]">
                    {k}={v}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeEnvVar(k)}
                    className="text-muted-foreground transition-colors hover:text-rose-300"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Кнопки */}
      <div className="flex items-center gap-3 border-t border-[rgba(244,236,222,0.06)] pt-6">
        <Button onClick={save} disabled={saving} className="bg-foreground text-background hover:opacity-90">
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
