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
            className={`flex w-full items-center justify-between rounded-xl border p-3.5 text-left transition-all ${
              selected === "subscription"
                ? "border-violet-500/50 bg-violet-500/10 shadow-md shadow-violet-500/10"
                : "border-border/50 bg-white/5 hover:border-violet-500/30 hover:bg-white/10"
            }`}
          >
            <div>
              <div className="text-xs text-muted-foreground">Подписка</div>
              <div className="text-base font-bold">{monthlyPrice} ₽/мес</div>
            </div>
            <div
              className={`h-4 w-4 rounded-full border-2 ${
                selected === "subscription"
                  ? "border-violet-400 bg-violet-500"
                  : "border-border"
              }`}
            />
          </button>
          <button
            onClick={() => setSelected("one_time")}
            className={`flex w-full items-center justify-between rounded-xl border p-3.5 text-left transition-all ${
              selected === "one_time"
                ? "border-violet-500/50 bg-violet-500/10 shadow-md shadow-violet-500/10"
                : "border-border/50 bg-white/5 hover:border-violet-500/30 hover:bg-white/10"
            }`}
          >
            <div>
              <div className="text-xs text-muted-foreground">Разово</div>
              <div className="text-base font-bold">{onetimePrice} ₽</div>
            </div>
            <div
              className={`h-4 w-4 rounded-full border-2 ${
                selected === "one_time"
                  ? "border-violet-400 bg-violet-500"
                  : "border-border"
              }`}
            />
          </button>
        </div>
      ) : pricingModel === "subscription" ? (
        <div>
          <div className="text-xs uppercase tracking-wider text-violet-400/80">Подписка</div>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="bg-gradient-to-r from-violet-300 to-blue-300 bg-clip-text text-3xl font-bold text-transparent">
              {monthlyPrice} ₽
            </span>
            <span className="text-sm text-muted-foreground">/мес</span>
          </div>
        </div>
      ) : (
        <div>
          <div className="text-xs uppercase tracking-wider text-violet-400/80">Разовая покупка</div>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="bg-gradient-to-r from-violet-300 to-blue-300 bg-clip-text text-3xl font-bold text-transparent">
              {onetimePrice} ₽
            </span>
          </div>
        </div>
      )}

      <button
        onClick={handleCheckout}
        className="group mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-blue-600 text-sm font-bold text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/40 hover:brightness-110"
      >
        Подключить
      </button>
    </div>
  );
}
