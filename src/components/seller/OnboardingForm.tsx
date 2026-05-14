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

type ProviderTab = "cryptomus" | "yookassa";
type EntityType = "ip" | "ooo" | "self_employed";

export function OnboardingForm({ initial }: Props) {
  const savedData = initial.onboardingData ?? {};
  const [provider, setProvider] = useState<ProviderTab>("cryptomus");
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
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setProvider("cryptomus")}
          className={`rounded-[2px] border p-4 text-left transition-colors ${
            provider === "cryptomus"
              ? "border-[rgba(244,236,222,0.18)] bg-[#1a1815]"
              : "border-[rgba(244,236,222,0.08)] bg-[#161412] hover:border-[rgba(244,236,222,0.14)]"
          }`}
        >
          <div className="text-[14px] font-semibold">Cryptomus — быстрый старт</div>
          <div className="mt-1.5 font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground/80">
            USDT TRC-20. Без юр.статуса, в крипте, международно.
          </div>
        </button>
        <button
          type="button"
          onClick={() => setProvider("yookassa")}
          className={`rounded-[2px] border p-4 text-left transition-colors ${
            provider === "yookassa"
              ? "border-[rgba(244,236,222,0.18)] bg-[#1a1815]"
              : "border-[rgba(244,236,222,0.08)] bg-[#161412] hover:border-[rgba(244,236,222,0.14)]"
          }`}
        >
          <div className="text-[14px] font-semibold">ЮKassa — рублёвые выплаты</div>
          <div className="mt-1.5 font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground/80">
            ИП / ООО / самозанятый. Подключай, когда нужны выплаты в ₽.
          </div>
        </button>
      </div>

      {initial.onboardingStatus === "pending_review" && (
        <div className="rounded-[2px] border border-amber-300/20 bg-amber-300/[0.04] p-4 font-mono text-[12px] uppercase tracking-[0.04em] text-amber-200/90">
          Заявка на onboarding уже отправлена и ждёт ручной проверки.
        </div>
      )}

      {error && (
        <div className="rounded-[2px] border border-rose-500/30 bg-rose-500/[0.04] p-4 font-mono text-[12px] text-rose-300">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-[2px] border border-[rgba(244,236,222,0.12)] bg-[rgba(244,236,222,0.03)] p-4 font-mono text-[12px] uppercase tracking-[0.04em] text-foreground/80">
          {message}
        </div>
      )}

      {provider === "yookassa" ? (
        <section className="rounded-[2px] border border-[rgba(244,236,222,0.08)] bg-[#161412] p-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="rounded-[2px] border border-[rgba(244,236,222,0.08)] bg-[#1a1815] p-3.5 text-[13px] cursor-pointer">
              <input
                type="radio"
                name="entityType"
                checked={yookassa.entityType === "ip"}
                onChange={() => setYookassaField("entityType", "ip")}
                className="mr-2"
              />
              ИП
            </label>
            <label className="rounded-[2px] border border-[rgba(244,236,222,0.08)] bg-[#1a1815] p-3.5 text-[13px] cursor-pointer">
              <input
                type="radio"
                name="entityType"
                checked={yookassa.entityType === "ooo"}
                onChange={() => setYookassaField("entityType", "ooo")}
                className="mr-2"
              />
              ООО
            </label>
            <label className="rounded-[2px] border border-[rgba(244,236,222,0.08)] bg-[#1a1815] p-3.5 text-[13px] cursor-pointer">
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
        <section className="rounded-[2px] border border-[rgba(244,236,222,0.08)] bg-[#161412] p-5">
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
        {loading ? "Сохраняем..." : "Сохранить"}
      </Button>
    </div>
  );
}
