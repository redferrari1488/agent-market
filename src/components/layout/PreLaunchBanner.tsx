"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";

const STORAGE_KEY = "hireon:pre-launch-banner-dismissed:v1";

export function PreLaunchBanner() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const dismissed = window.localStorage.getItem(STORAGE_KEY);
    if (dismissed) setVisible(false);
  }, []);

  if (!visible) return null;
  if (pathname?.startsWith("/auth")) return null;

  function dismiss() {
    setVisible(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // localStorage может быть недоступен (приватный режим) — баннер
      // просто не запомнит закрытие, перерисуется при перезагрузке
    }
  }

  return (
    <div className="border-b border-border/40 bg-foreground/[0.03]">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2 text-[12.5px] sm:px-6">
        <span className="inline-flex h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
        <p className="flex-1 text-muted-foreground">
          <span className="font-medium text-foreground">Каталог открыт.</span>{" "}
          Регистрация продавцов бесплатно по заявке.
        </p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Скрыть баннер"
          className="-mr-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
