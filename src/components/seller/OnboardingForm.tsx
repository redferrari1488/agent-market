"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CryptoWallets } from "@/lib/db/schema";

type Props = {
  initial: {
    yookassaAccountId: string | null;
    cryptoWallets: CryptoWallets | null;
    onboardingData?: Record<string, unknown> | null;
    onboardingStatus?: string | null;
  };
};

type ProviderTab = "nowpayments" | "yookassa";
type EntityType = "ip" | "ooo" | "self_employed";

export function OnboardingForm({ initial }: Props) {
  const savedData = initial.onboardingData ?? {};
  const [provider, setProvider] = useState<ProviderTab>("nowpayments");
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

  const [cryptoWallets, setCryptoWallets] = useState({
    usdt_trc20: initial.cryptoWallets?.usdt_trc20 || "",
    usdc_sol: initial.cryptoWallets?.usdc_sol || "",
    btc: initial.cryptoWallets?.btc || "",
  });

  const setYookassaField = <K extends keyof typeof yookassa>(key: K, value: (typeof yookassa)[K]) => {
    setYookassa((prev) => ({ ...prev, [key]: value }));
  };

  const setCryptoField = <K extends keyof typeof cryptoWallets>(key: K, value: string) => {
    setCryptoWallets((prev) => ({ ...prev, [key]: value }));
  };

  const submit = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const body =
        provider === "yookassa"
          ? { provider, data: yookassa }
          : {
              provider,
              data: {
                usdt_trc20: cryptoWallets.usdt_trc20.trim() || undefined,
                usdc_sol: cryptoWallets.usdc_sol.trim() || undefined,
                btc: cryptoWallets.btc.trim() || undefined,
              },
            };

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
          (provider === "nowpayments"
            ? "Кошельки сохранены."
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
          onClick={() => setProvider("nowpayments")}
          className={`rounded-[2px] border p-4 text-left transition-colors ${
            provider === "nowpayments"
              ? "border-[rgba(244,236,222,0.18)] bg-[#1a1815]"
              : "border-[rgba(244,236,222,0.08)] bg-[#161412] hover:border-[rgba(244,236,222,0.14)]"
          }`}
        >
          <div className="text-[14px] font-semibold">Крипта — быстрый старт</div>
          <div className="mt-1.5 font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground/80">
            USDT / USDC / BTC. Без юр.статуса, международно.
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
        <section className="space-y-4 rounded-[2px] border border-[rgba(244,236,222,0.08)] bg-[#161412] p-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-muted-foreground/80">
            Заполни хотя бы один адрес — на него админ переведёт деньги после первой продажи.
          </p>

          <div className="space-y-1.5">
            <Label className="text-[13px]">USDT TRC-20</Label>
            <Input
              value={cryptoWallets.usdt_trc20}
              onChange={(e) => setCryptoField("usdt_trc20", e.target.value)}
              placeholder="T..."
            />
            <p className="text-[11px] text-muted-foreground">
              Адрес длиной 34 символа, начинающийся с T.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[13px]">USDC Solana</Label>
            <Input
              value={cryptoWallets.usdc_sol}
              onChange={(e) => setCryptoField("usdc_sol", e.target.value)}
              placeholder="Solana base58 адрес"
            />
            <p className="text-[11px] text-muted-foreground">
              SPL-токен USDC в сети Solana. Дешёвые комиссии.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[13px]">Bitcoin (BTC)</Label>
            <Input
              value={cryptoWallets.btc}
              onChange={(e) => setCryptoField("btc", e.target.value)}
              placeholder="bc1... или 1.../3..."
            />
            <p className="text-[11px] text-muted-foreground">
              Bech32 (bc1...) или legacy/SegWit (1.../3...).
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
