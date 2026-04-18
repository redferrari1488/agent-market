"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  initial: {
    yookassaAccountId: string | null;
    cryptomusWalletAddress: string | null;
    onboardingData?: Record<string, unknown> | null;
    onboardingStatus?: string | null;
  };
};

type ProviderTab = "yookassa" | "cryptomus";
type EntityType = "ip" | "ooo" | "self_employed";

export function OnboardingForm({ initial }: Props) {
  const savedData = initial.onboardingData ?? {};
  const [provider, setProvider] = useState<ProviderTab>("yookassa");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [yookassa, setYookassa] = useState({
    entityType: (savedData.entityType as EntityType) || "ip",
    inn: (savedData.inn as string) || "",
    legalName: (savedData.legalName as string) || "",
    legalAddress: (savedData.legalAddress as string) || "",
    email: (savedData.email as string) || "",
    phone: (savedData.phone as string) || "",
    accountId: initial.yookassaAccountId || ((savedData.accountId as string) || ""),
  });
  const [cryptomusWallet, setCryptomusWallet] = useState(
    initial.cryptomusWalletAddress || "",
  );

  const setYookassaField = <K extends keyof typeof yookassa>(key: K, value: (typeof yookassa)[K]) => {
    setYookassa((prev) => ({ ...prev, [key]: value }));
  };

  const submit = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const body =
        provider === "yookassa"
          ? { provider, data: yookassa }
          : { provider, data: { wallet: cryptomusWallet } };

      const res = await fetch("/api/seller/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Не удалось сохранить данные");
        return;
      }

      setMessage(
        json.message ||
          (provider === "cryptomus"
            ? "Кошелёк сохранён."
            : "Данные для onboarding сохранены."),
      );
    } catch {
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setProvider("yookassa")}
          className={`rounded-lg border p-4 text-left transition-colors ${
            provider === "yookassa"
              ? "border-foreground/20 bg-secondary"
              : "border-border/40 hover:border-border"
          }`}
        >
          <div className="text-[15px] font-semibold">ЮKassa (для РФ)</div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            Реквизиты продавца и маркетплейс-аккаунт
          </div>
        </button>
        <button
          type="button"
          onClick={() => setProvider("cryptomus")}
          className={`rounded-lg border p-4 text-left transition-colors ${
            provider === "cryptomus"
              ? "border-foreground/20 bg-secondary"
              : "border-border/40 hover:border-border"
          }`}
        >
          <div className="text-[15px] font-semibold">Криптовалюта (международно)</div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            USDT TRC-20 кошелёк для автоматических выплат
          </div>
        </button>
      </div>

      {initial.onboardingStatus === "pending_review" && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-[13px] text-amber-400">
          Заявка на onboarding уже отправлена и ждёт ручной проверки.
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4 text-[13px] text-red-400">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 text-[13px] text-emerald-400">
          {message}
        </div>
      )}

      {provider === "yookassa" ? (
        <section className="rounded-lg border border-border/40 p-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="rounded-lg border border-border/40 p-3.5 text-[13px]">
              <input
                type="radio"
                name="entityType"
                checked={yookassa.entityType === "ip"}
                onChange={() => setYookassaField("entityType", "ip")}
                className="mr-2"
              />
              ИП
            </label>
            <label className="rounded-lg border border-border/40 p-3.5 text-[13px]">
              <input
                type="radio"
                name="entityType"
                checked={yookassa.entityType === "ooo"}
                onChange={() => setYookassaField("entityType", "ooo")}
                className="mr-2"
              />
              ООО
            </label>
            <label className="rounded-lg border border-border/40 p-3.5 text-[13px]">
              <input
                type="radio"
                name="entityType"
                checked={yookassa.entityType === "self_employed"}
                onChange={() => setYookassaField("entityType", "self_employed")}
                className="mr-2"
              />
              Самозанятый
            </label>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-[13px]">ИНН</Label>
              <Input
                value={yookassa.inn}
                onChange={(e) => setYookassaField("inn", e.target.value.replace(/\D/g, ""))}
                placeholder="10 или 12 цифр"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Полное имя / название</Label>
              <Input
                value={yookassa.legalName}
                onChange={(e) => setYookassaField("legalName", e.target.value)}
                placeholder="ООО Ромашка"
              />
            </div>
          </div>

          <div className="mt-4 space-y-1.5">
            <Label className="text-[13px]">Юр. адрес</Label>
            <Textarea
              rows={4}
              value={yookassa.legalAddress}
              onChange={(e) => setYookassaField("legalAddress", e.target.value)}
              placeholder="Полный юридический адрес"
            />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-[13px]">Email</Label>
              <Input
                type="email"
                value={yookassa.email}
                onChange={(e) => setYookassaField("email", e.target.value)}
                placeholder="seller@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Телефон</Label>
              <Input
                value={yookassa.phone}
                onChange={(e) => setYookassaField("phone", e.target.value)}
                placeholder="+7 999 123-45-67"
              />
            </div>
          </div>

          <div className="mt-4 space-y-1.5">
            <Label className="text-[13px]">YooKassa account ID</Label>
            <Input
              value={yookassa.accountId}
              onChange={(e) => setYookassaField("accountId", e.target.value)}
              placeholder="Если аккаунт уже создан вручную, введите ID"
              readOnly={Boolean(initial.yookassaAccountId)}
            />
            <p className="text-[11px] text-muted-foreground">
              {initial.yookassaAccountId
                ? "Текущий идентификатор аккаунта YooKassa. Если нужен другой — очистите его через БД или админку."
                : "Если аккаунт уже создан вручную, введите ID."}
            </p>
          </div>
        </section>
      ) : (
        <section className="rounded-lg border border-border/40 p-5">
          <div className="space-y-1.5">
            <Label className="text-[13px]">USDT TRC-20 адрес</Label>
            <Input
              value={cryptomusWallet}
              onChange={(e) => setCryptomusWallet(e.target.value)}
              placeholder="T..."
            />
            <p className="text-[11px] text-muted-foreground">
              Поддерживается адрес длиной 34 символа, начинающийся с T.
            </p>
          </div>
        </section>
      )}

      <Button
        type="button"
        onClick={submit}
        disabled={loading}
        className="bg-foreground text-background hover:opacity-90"
      >
        {loading ? "Сохраняем..." : "Сохранить реквизиты"}
      </Button>
    </div>
  );
}
