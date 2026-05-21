import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ArrowUpRight, Send, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Контакты - hireon",
  description: "Связаться с командой hireon.",
};

const displayFont =
  "var(--font-manrope), 'Manrope', system-ui, sans-serif";

export default function ContactsPage() {
  return (
    <section className="mx-auto max-w-[760px] px-5 sm:px-8">
      <div className="pt-14 pb-10 sm:pt-22">
        <Link
          href="/"
          className="group inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.1em] text-[rgba(241,235,224,0.36)] transition-colors hover:text-[rgba(241,235,224,0.78)]"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          Главная
        </Link>
        <p className="mt-3.5 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-[rgba(241,235,224,0.36)]">
          Связь · поддержка
        </p>
        <h1
          className="mt-3.5 text-[clamp(34px,4.2vw,52px)] font-extrabold leading-[1.02] tracking-[-0.038em] text-balance text-[var(--hc-fg,#f1ebe0)]"
          style={{ fontFamily: displayFont }}
        >
          Контакты
        </h1>
        <p className="mt-4 max-w-[56ch] text-[17px] leading-[1.55] text-[rgba(241,235,224,0.78)]">
          Команда отвечает в течение рабочего дня. Самый быстрый канал - Telegram.
        </p>
      </div>

      <div className="pb-22">
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <ChannelCard
            href="https://t.me/hireon_agency"
            external
            icon={<Send className="h-5 w-5" />}
            label="Telegram"
            value="@hireon_agency"
          />
          <ChannelCard
            href="mailto:hireon.team@yandex.com"
            icon={<Mail className="h-5 w-5" />}
            label="Email"
            value="hireon.team@yandex.com"
            breakAll
          />
        </div>
      </div>
    </section>
  );
}

function ChannelCard({
  href,
  external,
  icon,
  label,
  value,
  breakAll,
}: {
  href: string;
  external?: boolean;
  icon: React.ReactNode;
  label: string;
  value: string;
  breakAll?: boolean;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      className="group flex items-start gap-4 rounded-[10px] border border-[rgba(244,236,222,0.06)] bg-[#1a1815] p-6 transition-[border-color,transform] hover:translate-y-[-1px] hover:border-[rgba(244,236,222,0.16)]"
    >
      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[rgba(244,236,222,0.06)] bg-[rgba(244,236,222,0.04)] text-[oklch(0.74_0.13_195)]">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-[rgba(241,235,224,0.36)]">
          {label}
        </div>
        <div
          className={`mt-1 ${breakAll ? "text-[15px] sm:text-[17px]" : "text-[19px]"} font-semibold leading-[1.2] tracking-[-0.018em] whitespace-nowrap overflow-hidden text-ellipsis text-[var(--hc-fg,#f1ebe0)]`}
          style={{ fontFamily: displayFont }}
        >
          {value}
        </div>
      </div>
      <ArrowUpRight className="ml-auto h-4 w-4 text-[rgba(241,235,224,0.36)] transition-[color,transform] group-hover:translate-x-0.5 group-hover:text-[oklch(0.74_0.13_195)]" />
    </a>
  );
}
