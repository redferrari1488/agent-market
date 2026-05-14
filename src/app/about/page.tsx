import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "О проекте - hireon",
  description: "Маркетплейс готовых AI-агентов для бизнеса.",
};

const displayFont =
  "var(--font-manrope), 'Manrope', system-ui, sans-serif";

const FACTS = [
  { num: "47", label: "Готовых агентов", desc: "отобраны командой, упакованы в Docker" },
  { num: "5", label: "Категорий", desc: "поддержка, контент, аналитика, мониторинг, продажи" },
  { num: "0%", label: "Комиссия первой волны", desc: "для продавцов до публичного запуска" },
];

export default function AboutPage() {
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
          О проекте
        </p>
        <h1
          className="mt-3.5 text-[clamp(34px,4.2vw,52px)] font-extrabold leading-[1.02] tracking-[-0.038em] text-balance text-[var(--hc-fg,#f1ebe0)]"
          style={{ fontFamily: displayFont }}
        >
          Маркетплейс готовых AI-агентов{" "}
          <span style={{ color: "oklch(0.74 0.13 195)" }}>для&nbsp;бизнеса.</span>
        </h1>
        <p className="mt-4 max-w-[56ch] text-[17px] leading-[1.55] text-[rgba(241,235,224,0.78)]">
          Не промпты, а готовые AI-агенты в Docker. Выбрали, оплатили, запустили.
        </p>
      </div>

      <div className="pb-22">
        <Prose>
          <p>
            hireon собирает в одном каталоге AI-агентов, которые уже работают:
            боты поддержки, генераторы контента, мониторы конкурентов,
            лид-квалификаторы. Каждый агент проходит модерацию командой.
          </p>
          <p>
            Стартуем с каталогом агентов собственной разработки. Параллельно
            открываем платформу для сторонних разработчиков: первая волна
            размещается бесплатно, без комиссии.
          </p>

          <PullQuote cite="команда hireon · апрель 2026">
            Запуск AI-агента должен занимать столько же, сколько установка
            приложения на телефон.
          </PullQuote>

          <h2 style={{ fontFamily: displayFont }}>Что мы строим</h2>
          <p>
            Витрина проверенных агентов. Прямой контакт покупателя с продавцом.
            Прозрачные цены и единый Docker-формат запуска.
          </p>
          <ul>
            <li>
              <strong>Покупателю</strong> - отобранный каталог, фильтры по
              задаче, единый формат запуска.
            </li>
            <li>
              <strong>Продавцу</strong> - витрина, оплаты, кабинет, бесплатное
              размещение в первой волне.
            </li>
          </ul>

          <h2 style={{ fontFamily: displayFont }}>На какой стадии мы сейчас</h2>
          <p>
            Каталог открыт, оплата работает, кабинеты доступны. Идёт набор
            первой волны продавцов. Хотите обсудить сотрудничество или стать
            первым продавцом - напишите нам в Telegram или на почту.
          </p>
        </Prose>

        <div className="my-14 grid grid-cols-1 gap-0 border-y border-[rgba(244,236,222,0.06)] md:grid-cols-3">
          {FACTS.map((f, i) => (
            <div
              key={f.label}
              className={`py-7 pr-7 ${i < FACTS.length - 1 ? "md:border-r border-[rgba(244,236,222,0.06)]" : ""}`}
            >
              <div
                className="text-[44px] font-semibold leading-none tracking-[-0.028em] text-[var(--hc-fg,#f1ebe0)]"
                style={{ fontFamily: displayFont }}
              >
                {f.num}
              </div>
              <div className="mt-2.5 font-mono text-[10.5px] uppercase tracking-[0.1em] text-[rgba(241,235,224,0.36)]">
                {f.label}
              </div>
              <div className="mt-1 max-w-[32ch] text-[13.5px] leading-[1.5] text-[rgba(241,235,224,0.78)]">
                {f.desc}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-wrap gap-3">
          <Link
            href="/contacts"
            className="inline-flex h-[46px] items-center gap-2 rounded-md bg-[oklch(0.74_0.13_195)] px-5 text-[14.5px] font-semibold tracking-[-0.005em] text-[#0a0a09] transition-[filter,transform] hover:translate-y-[-1px] hover:brightness-[1.08]"
          >
            Написать нам
            <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
          </Link>
          <Link
            href="/agents"
            className="inline-flex h-[46px] items-center gap-2 rounded-md border border-[rgba(244,236,222,0.10)] px-5 text-[14.5px] text-[var(--hc-fg,#f1ebe0)] transition-[border-color,background] hover:border-[rgba(244,236,222,0.16)] hover:bg-[rgba(244,236,222,0.04)]"
          >
            Смотреть каталог
          </Link>
        </div>
      </div>
    </section>
  );
}

function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div className="prose-warm max-w-[68ch] text-[15px] leading-[1.75] text-[rgba(241,235,224,0.78)] [&_h2]:mt-14 [&_h2]:mb-4 [&_h2]:text-[22px] [&_h2]:font-bold [&_h2]:leading-[1.2] [&_h2]:tracking-[-0.024em] [&_h2]:text-[var(--hc-fg,#f1ebe0)] [&_h2:first-child]:mt-0 [&_p]:mb-3.5 [&_ul]:my-4 [&_ul]:pl-6 [&_li]:my-1.5 [&_strong]:font-semibold [&_strong]:text-[var(--hc-fg,#f1ebe0)] [&_a]:text-[oklch(0.74_0.13_195)] [&_a]:border-b [&_a]:border-[oklch(0.74_0.13_195_/_0.18)] [&_a:hover]:border-[oklch(0.74_0.13_195)]">
      {children}
    </div>
  );
}

function PullQuote({
  children,
  cite,
}: {
  children: React.ReactNode;
  cite: string;
}) {
  return (
    <blockquote
      className="my-12 rounded-[10px] border-l-2 border-[oklch(0.74_0.13_195)] bg-[#1a1815] px-9 py-9 text-[26px] leading-[1.3] tracking-[-0.018em] text-balance text-[var(--hc-fg,#f1ebe0)]"
      style={{ fontFamily: displayFont }}
    >
      {children}
      <cite className="mt-4 block font-mono text-[11px] not-italic font-normal uppercase tracking-[0.14em] text-[rgba(241,235,224,0.36)]">
        {cite}
      </cite>
    </blockquote>
  );
}
