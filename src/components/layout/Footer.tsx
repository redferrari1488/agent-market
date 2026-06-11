import Link from "next/link";
import { HireonLogo } from "@/components/branding/HireonMark";
import { Bot } from "@/components/landing/redesign/Bot";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/40">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <div className="flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/"
              aria-label="hireon"
              className="inline-flex items-center gap-2.5 text-foreground"
            >
              <HireonLogo
                className="inline-flex items-center gap-2"
                markClassName="h-[20px] w-[20px] text-foreground"
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

          <div className="flex flex-col items-start gap-2 sm:items-end">
            <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1">
              <Link
                href="/contacts"
                className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
              >
                Контакты
              </Link>
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
              &copy; {new Date().getFullYear()} hireon. Все права защищены.
            </p>
          </div>

          {/* бот-фигурка машет на прощание (Claude Design handoff 2026-06-11) */}
          <div className="self-end">
            <Bot variant="wave" title="до связи" />
          </div>
        </div>
      </div>
    </footer>
  );
}
