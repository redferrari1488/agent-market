"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  profileId: string;
  initialYookassaAccountId?: string;
};

export function OnboardingReviewForm({
  profileId,
  initialYookassaAccountId = "",
}: Props) {
  const router = useRouter();
  const [yookassaAccountId, setYookassaAccountId] = useState(initialYookassaAccountId);
  const [reason, setReason] = useState("");
  const [submittingAction, setSubmittingAction] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (
    body:
      | { action: "approve"; yookassaAccountId?: string }
      | { action: "reject"; reason: string }
  ) => {
    setSubmittingAction(body.action);
    setError(null);

    try {
      const res = await fetch(`/api/admin/sellers/onboarding/${profileId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        setError(json?.error || "Не удалось сохранить решение");
        return;
      }

      router.push("/admin/sellers/onboarding");
      router.refresh();
    } catch {
      setError("Ошибка сети");
    } finally {
      setSubmittingAction(null);
    }
  };

  const approve = async () => {
    await submit({
      action: "approve",
      yookassaAccountId: yookassaAccountId.trim() || undefined,
    });
  };

  const reject = async () => {
    if (!reason.trim()) {
      setError("Укажите причину отказа");
      return;
    }

    await submit({ action: "reject", reason: reason.trim() });
  };

  const isSubmitting = submittingAction !== null;

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-[13px] text-red-400">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-border/40 p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-lg border border-emerald-500/20 p-2 text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-[15px] font-semibold">Одобрение</h3>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Укажите YooKassa account ID, если админ создавал его вручную в кабинете YooKassa.
            </p>
            <div className="mt-4 space-y-1.5">
              <Label htmlFor="yookassaAccountId" className="text-[13px]">
                YooKassa account ID (создать вручную в кабинете YooKassa и вставить сюда)
              </Label>
              <Input
                id="yookassaAccountId"
                value={yookassaAccountId}
                onChange={(event) => setYookassaAccountId(event.target.value)}
                placeholder="shop_..."
                disabled={isSubmitting}
                className="h-10 border-border/40 bg-background"
              />
            </div>
            <Button
              type="button"
              onClick={approve}
              disabled={isSubmitting}
              className="mt-4 h-10 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
            >
              {submittingAction === "approve" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Одобрить
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border/40 p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-lg border border-red-500/20 p-2 text-red-400">
            <XCircle className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-[15px] font-semibold">Отклонение</h3>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Причина отказа будет сохранена в заявке для дальнейшего разбора.
            </p>
            <div className="mt-4 space-y-1.5">
              <Label htmlFor="rejectionReason" className="text-[13px]">
                Причина отказа (будет сохранена)
              </Label>
              <Textarea
                id="rejectionReason"
                rows={5}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Например: не хватает реквизитов или есть расхождение в ИНН."
                disabled={isSubmitting}
                className="border-border/40 bg-background"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={reject}
              disabled={isSubmitting}
              className="mt-4 h-10 border-red-500/20 text-red-400 hover:bg-red-500/5 hover:text-red-400"
            >
              {submittingAction === "reject" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              Отклонить
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
