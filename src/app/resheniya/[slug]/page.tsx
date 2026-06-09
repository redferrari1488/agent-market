import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";

// SEO-посадочные под поисковый интент (отдельно от карточек каталога
// /agents/[slug]). Контент хардкожен, но рендер динамический — как и весь
// сайт: root layout на каждом запросе дёргает сессию (connection() +
// getUser). force-static тянул этот layout в build-этап, где нет
// BETTER_AUTH_SECRET, и валил сборку. SSR отдаёт полный HTML, для SEO
// этого достаточно. Источник текстов: drafts/marketing/seo-landings-copy.md
export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

const displayFont = "var(--font-manrope), 'Manrope', system-ui, sans-serif";
const ACCENT = "oklch(0.74 0.13 195)";

type Landing = {
  seoTitle: string;
  seoDesc: string;
  eyebrow: string;
  h1: string;
  h1accent: string;
  sub: string;
  pains: string[];
  solution: string;
  steps: string[];
  price: string;
  priceNote: string;
  faq: { q: string; a: string }[];
  cta: string;
};

const LANDINGS: Record<string, Landing> = {
  "otvety-na-otzyvy-2gis": {
    seoTitle: "Автоответы на отзывы в 2ГИС - агент отвечает за вас 24/7 | hireon",
    seoDesc:
      "AI-агент отвечает на каждый новый отзыв в 2ГИС в тоне вашего бренда, круглосуточно. Рейтинг растёт, клиенты видят заботу. 2000 ₽/мес, неделя бесплатно.",
    eyebrow: "Решение · отзывы 2ГИС",
    h1: "Автоматические ответы на отзывы в ",
    h1accent: "2ГИС",
    sub: "Агент отвечает на каждый новый отзыв в тоне вашего бренда, круглосуточно. Рейтинг растёт, клиенты видят, что вам не всё равно.",
    pains: [
      "Отзывы копятся, а отвечать некогда - они висят без ответа неделями.",
      "2ГИС опускает карточки, где владелец не отвечает.",
      "Новый клиент читает не отзыв, а вашу реакцию. Молчание = безразличие.",
    ],
    solution:
      "Агент отслеживает новые отзывы и пишет на каждый человеческий ответ - без шаблонной воды, в вашем тоне, в течение минут после публикации.",
    steps: [
      "Подключаете карточку и задаёте тон: дружелюбный, официальный или тёплый.",
      "Агент видит новый отзыв и пишет ответ.",
      "Вы получаете готовый ответ - автоматически или с вашим подтверждением.",
    ],
    price: "2000 ₽/мес",
    priceNote: "Первая неделя бесплатно, на ваших реальных отзывах.",
    faq: [
      {
        q: "Как отвечать на негативные отзывы в 2ГИС?",
        a: "Спокойно, по существу, с решением. Агент не спорит и не оправдывается - признаёт проблему, предлагает выход и сохраняет лицо бизнеса.",
      },
      {
        q: "Агент отвечает сам или нужно подтверждать?",
        a: "Как настроите. Можно полный автомат, можно с вашим подтверждением перед публикацией.",
      },
      {
        q: "А если отзыв несправедливый?",
        a: "Агент отвечает вежливо и с достоинством, мягко обозначая, что ситуация требует уточнения. Публично это выглядит сильно.",
      },
      {
        q: "Подходит для сети точек?",
        a: "Да, несколько карточек подключаются отдельно.",
      },
    ],
    cta: "Подключить за неделю бесплатно",
  },
  "bot-podderzhki-telegram": {
    seoTitle: "Чат-бот поддержки в Telegram для бизнеса - отвечает клиентам 24/7 | hireon",
    seoDesc:
      "Бот поддержки в Telegram закрывает типовые вопросы клиентов круглосуточно по вашему FAQ. Ночные клиенты не уходят к конкуренту. 2990 ₽/мес, неделя бесплатно.",
    eyebrow: "Решение · бот поддержки",
    h1: "Бот поддержки в Telegram, который отвечает ",
    h1accent: "за вас",
    sub: "Закрывает типовые вопросы клиентов круглосуточно по вашему FAQ. Ночные клиенты не уходят к конкуренту, менеджер занят только сложным.",
    pains: [
      "Менеджер целый день отвечает на одно и то же.",
      "Ночью на вопрос клиента не отвечает никто - и он уходит.",
      "Нанимать второго человека на переписку дорого и долго.",
    ],
    solution:
      "Бот отвечает на частые вопросы сам, мгновенно, по вашей базе. Сложное эскалирует человеку. Работает в вашем Telegram, без отдельного приложения.",
    steps: [
      "Загружаете FAQ и тон общения.",
      "Бот подключается к вашему Telegram и отвечает клиентам.",
      "На вопрос вне базы - передаёт менеджеру, ничего не теряется.",
    ],
    price: "2990 ₽/мес",
    priceNote: "Первая неделя бесплатно.",
    faq: [
      {
        q: "Чем отличается от обычного чат-бота с кнопками?",
        a: "Отвечает свободным текстом по смыслу, а не по жёсткому дереву кнопок. Понимает формулировки клиента.",
      },
      {
        q: "Нужен свой сервер или ключи?",
        a: "Нет, всё на нашей стороне. Подключаете Telegram - и работает.",
      },
      {
        q: "А если бот не знает ответа?",
        a: "Передаёт менеджеру, а не выдумывает. Границы настраиваются.",
      },
      {
        q: "Можно обучить под мою нишу?",
        a: "Да, бот работает по вашему FAQ и тону.",
      },
    ],
    cta: "Подключить бота бесплатно на неделю",
  },
  "kopirayter-telegram-kanala": {
    seoTitle: "AI-копирайтер для Telegram-канала - посты по расписанию в тоне бренда | hireon",
    seoDesc:
      "Агент-копирайтер пишет и публикует посты в Telegram-канал в тоне бренда по расписанию. Канал не висит пустым. 990 ₽/мес, неделя бесплатно.",
    eyebrow: "Решение · копирайтер канала",
    h1: "Агент-копирайтер ведёт ваш ",
    h1accent: "Telegram-канал",
    sub: "Пишет и публикует посты в тоне бренда по расписанию. Канал не висит пустым, а вы не привязаны к нему каждый день.",
    pains: [
      "Канал заглох: два поста и тишина на месяц.",
      "Писать регулярно нет времени и идей.",
      "Нанимать SMM-щика дорого ради нескольких постов в неделю.",
    ],
    solution:
      "Агент пишет посты на ваши темы в вашем тоне и публикует по графику. Вы задаёте направление и правите, рутину делает он.",
    steps: [
      "Задаёте тематику, тон и расписание.",
      "Агент готовит посты.",
      "Публикует сам или отдаёт вам на утверждение.",
    ],
    price: "990 ₽/мес",
    priceNote: "Первая неделя бесплатно.",
    faq: [
      {
        q: "Посты не будут одинаковыми и AI-шными?",
        a: "Тон настраивается, вы правите первые выпуски - дальше агент держит стиль. Лучший тест: этот наш канал частично ведёт он же.",
      },
      {
        q: "Я контролирую, что публикуется?",
        a: "Полностью. Можно режим с подтверждением перед публикацией.",
      },
      {
        q: "Откуда берутся темы?",
        a: "Из заданного направления плюс ваши подсказки.",
      },
      {
        q: "Подходит для экспертного канала?",
        a: "Да, если зададите темы и факты - агент оформит их в посты.",
      },
    ],
    cta: "Запустить копирайтера бесплатно",
  },
};

// Публикуем только лендинги под ГОТOВЫЕ к продаже агенты. Лендинги
// otvety-na-otzyvy-2gis и bot-podderzhki-telegram отложены: их агенты
// (review-responder-2gis, telegram-support-bot) пока в waitlist /
// в разработке - вести трафик на недоступный продукт нельзя. Данные
// лендингов сохранены в LANDINGS выше - вернуть slug сюда после фиксов.
const PUBLISHED_SLUGS = ["kopirayter-telegram-kanala"];

// slug вне списка опубликованных -> 404 (а не лендинг на агента, которого
// нет в продаже). Раньше гейт держался на generateStaticParams +
// dynamicParams=false; после перехода на force-dynamic проверяем в рантайме.
function getPublishedLanding(slug: string): Landing | undefined {
  return PUBLISHED_SLUGS.includes(slug) ? LANDINGS[slug] : undefined;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const l = getPublishedLanding(slug);
  if (!l) return { title: "Решение - hireon" };
  return {
    title: l.seoTitle,
    description: l.seoDesc,
    alternates: { canonical: `/resheniya/${slug}` },
    openGraph: {
      title: l.seoTitle,
      description: l.seoDesc,
      url: `/resheniya/${slug}`,
      type: "website",
    },
  };
}

export default async function ResheniyaPage({ params }: { params: Params }) {
  const { slug } = await params;
  const l = getPublishedLanding(slug);
  if (!l) notFound();

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: l.faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <section className="mx-auto max-w-[760px] px-5 sm:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <div className="pt-14 pb-10 sm:pt-22">
        <Link
          href="/"
          className="group inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.1em] text-[rgba(241,235,224,0.36)] transition-colors hover:text-[rgba(241,235,224,0.78)]"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          Главная
        </Link>
        <p className="mt-3.5 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-[rgba(241,235,224,0.36)]">
          {l.eyebrow}
        </p>
        <h1
          className="mt-3.5 text-[clamp(34px,4.2vw,52px)] font-extrabold leading-[1.02] tracking-[-0.038em] text-balance text-[var(--hc-fg,#f1ebe0)]"
          style={{ fontFamily: displayFont }}
        >
          {l.h1}
          <span style={{ color: ACCENT }}>{l.h1accent}.</span>
        </h1>
        <p className="mt-4 max-w-[56ch] text-[17px] leading-[1.55] text-[rgba(241,235,224,0.78)]">
          {l.sub}
        </p>
      </div>

      <div className="pb-22">
        <div className="prose-warm max-w-[68ch] text-[15px] leading-[1.75] text-[rgba(241,235,224,0.78)]">
          <SectionTitle>Знакомая ситуация</SectionTitle>
          <ul className="my-4 pl-6">
            {l.pains.map((p) => (
              <li key={p} className="my-1.5">
                {p}
              </li>
            ))}
          </ul>

          <SectionTitle>Как агент это решает</SectionTitle>
          <p className="mb-3.5">{l.solution}</p>

          <SectionTitle>Как это работает</SectionTitle>
          <ol className="my-4 list-none pl-0">
            {l.steps.map((s, i) => (
              <li key={s} className="mb-3 flex gap-3">
                <span
                  className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[12px] font-semibold"
                  style={{ background: `color-mix(in oklch, ${ACCENT} 14%, transparent)`, color: ACCENT }}
                >
                  {i + 1}
                </span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        </div>

        <div
          className="my-12 rounded-[10px] border-l-2 px-9 py-8"
          style={{ borderColor: ACCENT, background: "#1a1815" }}
        >
          <div
            className="text-[34px] font-semibold leading-none tracking-[-0.02em] text-[var(--hc-fg,#f1ebe0)]"
            style={{ fontFamily: displayFont }}
          >
            {l.price}
          </div>
          <div className="mt-2.5 text-[14px] leading-[1.5] text-[rgba(241,235,224,0.78)]">
            {l.priceNote}
          </div>
        </div>

        <div className="prose-warm max-w-[68ch] text-[15px] leading-[1.75] text-[rgba(241,235,224,0.78)]">
          <SectionTitle>Частые вопросы</SectionTitle>
          {l.faq.map((f) => (
            <div key={f.q} className="mb-5">
              <p className="mb-1 font-semibold text-[var(--hc-fg,#f1ebe0)]">{f.q}</p>
              <p className="mb-0">{f.a}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-wrap gap-3">
          <Link
            href="/agents"
            className="inline-flex h-[46px] items-center gap-2 rounded-md px-5 text-[14.5px] font-semibold tracking-[-0.005em] text-[#0a0a09] transition-[filter,transform] hover:translate-y-[-1px] hover:brightness-[1.08]"
            style={{ background: ACCENT }}
          >
            {l.cta}
            <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
          </Link>
          <Link
            href="/contacts"
            className="inline-flex h-[46px] items-center gap-2 rounded-md border border-[rgba(244,236,222,0.10)] px-5 text-[14.5px] text-[var(--hc-fg,#f1ebe0)] transition-[border-color,background] hover:border-[rgba(244,236,222,0.16)] hover:bg-[rgba(244,236,222,0.04)]"
          >
            Задать вопрос
          </Link>
        </div>
      </div>
    </section>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="mt-12 mb-4 text-[22px] font-bold leading-[1.2] tracking-[-0.024em] text-[var(--hc-fg,#f1ebe0)] first:mt-0"
      style={{ fontFamily: displayFont }}
    >
      {children}
    </h2>
  );
}
