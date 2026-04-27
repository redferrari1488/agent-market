import Link from "next/link";
import { HireonLogo } from "@/components/branding/HireonMark";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/40">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <div className="flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between">
          {/* Brand */}
          <div>
            <Link
              href="/"
              aria-label="Hireon"
              className="inline-flex items-center gap-2.5 text-foreground"
            >
              <HireonLogo
                className="inline-flex items-center gap-2.5"
                markClassName="h-[16px] w-[32px] text-foreground"
                wordmarkClassName="text-[16px] font-bold tracking-[-0.025em] text-foreground"
              />
            </Link>
            <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-muted-foreground">
              Маркетплейс рабочих AI-агентов. Выбери, настрой, запусти.
            </p>
            <div className="mt-3 inline-flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.15em] text-muted-foreground/60">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
              Все системы работают
            </div>
          </div>

          {/* Legal links */}
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <div className="flex items-center gap-4">
              <Link
                href="/terms"
                className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
              >
                Оферта
              </Link>
              <Link
                href="/privacy"
                className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
              >
                Политика конфиденциальности
              </Link>
            </div>
            <p className="text-[12px] text-muted-foreground/60">
              &copy; {new Date().getFullYear()} Hireon. Все права защищены.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
