"use client";

import { useState } from "react";

type Props = {
  agentId: string;
  pricingModel: "subscription" | "one_time" | "both";
  priceMonthly: number | null;
  priceOnetime: number | null;
  isLoggedIn: boolean;
};

export function PurchaseButton({
  agentId: _agentId,
  pricingModel,
  priceMonthly,
  priceOnetime,
  isLoggedIn: _isLoggedIn,
}: Props) {
  const [selected, setSelected] = useState<"subscription" | "one_time">(
    pricingModel === "one_time" ? "one_time" : "subscription"
  );

  // Платежи временно отключены — будут подключены на финальном этапе (YooKassa + Cryptomus).
  const handleCheckout = () => {
    alert("Оплата скоро появится. Платформа в активной разработке.");
  };

  // Цены хранятся в копейках RUB
  const monthlyPrice =
    priceMonthly != null ? (priceMonthly / 100).toFixed(0) : null;
  const onetimePrice =
    priceOnetime != null ? (priceOnetime / 100).toFixed(0) : null;

  return (
    <div>
      {/* Цены */}
      {pricingModel === "both" ? (
        <div className="space-y-2">
          <button
            onClick={() => setSelected("subscription")}
            className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors ${
              selected === "subscription"
                ? "border-primary bg-primary/5"
                : "border-border hover:bg-secondary"
            }`}
          >
            <div>
              <div className="text-xs text-muted-foreground">Подписка</div>
              <div className="text-base font-bold">{monthlyPrice} ₽/мес</div>
            </div>
            <div
              className={`h-4 w-4 rounded-full border-2 ${
                selected === "subscription"
                  ? "border-primary bg-primary"
                  : "border-border"
              }`}
            />
          </button>
          <button
            onClick={() => setSelected("one_time")}
            className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors ${
              selected === "one_time"
                ? "border-primary bg-primary/5"
                : "border-border hover:bg-secondary"
            }`}
          >
            <div>
              <div className="text-xs text-muted-foreground">Разово</div>
              <div className="text-base font-bold">{onetimePrice} ₽</div>
            </div>
            <div
              className={`h-4 w-4 rounded-full border-2 ${
                selected === "one_time"
                  ? "border-primary bg-primary"
                  : "border-border"
              }`}
            />
          </button>
        </div>
      ) : pricingModel === "subscription" ? (
        <div>
          <div className="text-xs text-muted-foreground">Подписка</div>
          <div className="mt-1 flex items-baseline gap-0.5">
            <span className="text-2xl font-bold">{monthlyPrice} ₽</span>
            <span className="text-sm text-muted-foreground">/мес</span>
          </div>
        </div>
      ) : (
        <div>
          <div className="text-xs text-muted-foreground">Разовая покупка</div>
          <div className="mt-1 flex items-baseline gap-0.5">
            <span className="text-2xl font-bold">{onetimePrice} ₽</span>
          </div>
        </div>
      )}

      <button
        onClick={handleCheckout}
        className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-bold text-white transition-opacity hover:opacity-90"
      >
        Подключить
      </button>
    </div>
  );
}
