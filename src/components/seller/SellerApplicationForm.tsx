"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

type FieldErrors = Partial<Record<
  "name" | "contactEmail" | "contactTelegram" | "agentDescription" | "existingUrl",
  string[]
>>;

export function SellerApplicationForm({
  defaultEmail,
  defaultName,
}: {
  defaultEmail?: string | null;
  defaultName?: string | null;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [topError, setTopError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setTopError(null);
    setErrors({});

    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name") || "").trim(),
      contactEmail: String(fd.get("contactEmail") || "").trim(),
      contactTelegram: String(fd.get("contactTelegram") || "").trim() || null,
      agentDescription: String(fd.get("agentDescription") || "").trim(),
      existingUrl: String(fd.get("existingUrl") || "").trim() || null,
    };

    try {
      const res = await fetch("/api/seller-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 400 && data.details) setErrors(data.details);
        setTopError(data.error || "Не удалось отправить заявку. Попробуйте ещё раз.");
        return;
      }

      setSubmitted(true);
    } catch {
      setTopError("Сеть недоступна. Попробуйте ещё раз.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto mt-12 max-w-xl rounded-xl border border-emerald-500/30 bg-emerald-500/[0.04] p-6 text-left">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          <h3 className="text-[15px] font-semibold text-foreground">Заявка отправлена</h3>
        </div>
        <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
          Свяжемся с вами в течение 1–2 рабочих дней по указанному контакту.
          После согласования вам откроется доступ к кабинету продавца.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto mt-12 max-w-xl space-y-4 text-left"
      noValidate
    >
      <div>
        <label className="mb-1.5 block text-[13px] font-medium text-foreground">
          Как вас зовут
        </label>
        <input
          type="text"
          name="name"
          required
          maxLength={120}
          defaultValue={defaultName || ""}
          placeholder="Иван Иванов"
          className="block w-full rounded-lg border border-border/50 bg-background px-3.5 py-2.5 text-[14px] text-foreground placeholder:text-muted-foreground/60 focus:border-foreground/40 focus:outline-none"
        />
        {errors.name && <FieldHint msgs={errors.name} />}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-foreground">
            Email
          </label>
          <input
            type="email"
            name="contactEmail"
            required
            maxLength={255}
            defaultValue={defaultEmail || ""}
            placeholder="you@example.com"
            className="block w-full rounded-lg border border-border/50 bg-background px-3.5 py-2.5 text-[14px] text-foreground placeholder:text-muted-foreground/60 focus:border-foreground/40 focus:outline-none"
          />
          {errors.contactEmail && <FieldHint msgs={errors.contactEmail} />}
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-foreground">
            Telegram <span className="text-muted-foreground">(не обязательно)</span>
          </label>
          <input
            type="text"
            name="contactTelegram"
            maxLength={80}
            placeholder="@username"
            className="block w-full rounded-lg border border-border/50 bg-background px-3.5 py-2.5 text-[14px] text-foreground placeholder:text-muted-foreground/60 focus:border-foreground/40 focus:outline-none"
          />
          {errors.contactTelegram && <FieldHint msgs={errors.contactTelegram} />}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-[13px] font-medium text-foreground">
          Расскажите про агента
        </label>
        <textarea
          name="agentDescription"
          required
          minLength={20}
          maxLength={2000}
          rows={5}
          placeholder="Что делает ваш AI-агент, для каких задач, на каком стеке. Если есть демо или лендинг — укажите ссылку ниже."
          className="block w-full resize-y rounded-lg border border-border/50 bg-background px-3.5 py-2.5 text-[14px] text-foreground placeholder:text-muted-foreground/60 focus:border-foreground/40 focus:outline-none"
        />
        <p className="mt-1 text-[12px] text-muted-foreground">Минимум 20 символов</p>
        {errors.agentDescription && <FieldHint msgs={errors.agentDescription} />}
      </div>

      <div>
        <label className="mb-1.5 block text-[13px] font-medium text-foreground">
          Ссылка на агента или демо <span className="text-muted-foreground">(не обязательно)</span>
        </label>
        <input
          type="url"
          name="existingUrl"
          maxLength={500}
          placeholder="https://t.me/your_bot или https://your-site.com"
          className="block w-full rounded-lg border border-border/50 bg-background px-3.5 py-2.5 text-[14px] text-foreground placeholder:text-muted-foreground/60 focus:border-foreground/40 focus:outline-none"
        />
        {errors.existingUrl && <FieldHint msgs={errors.existingUrl} />}
      </div>

      {topError && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/[0.04] px-3.5 py-2.5 text-[13px] text-red-400">
          {topError}
        </p>
      )}

      <div className="flex items-center justify-between gap-4 pt-2">
        <p className="text-[12px] leading-relaxed text-muted-foreground">
          Отправляя заявку, вы соглашаетесь с{" "}
          <a href="/privacy" className="text-foreground underline underline-offset-4">
            обработкой персональных данных
          </a>
          .
        </p>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-lg bg-foreground px-6 text-[14px] font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "Отправляем..." : "Отправить заявку"}
        </button>
      </div>
    </form>
  );
}

function FieldHint({ msgs }: { msgs: string[] }) {
  return (
    <p className="mt-1 text-[12px] text-red-400">
      {msgs.join(", ")}
    </p>
  );
}
