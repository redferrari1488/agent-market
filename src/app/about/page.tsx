import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "О нас — AgentMarket",
  description: "Маркетплейс готовых AI-агентов для бизнеса.",
};

export default function AboutPage() {
  return (
    <section className="mx-auto max-w-3xl px-5 sm:px-6">
      <div className="py-16 sm:py-20">
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          О проекте
        </p>
        <h1 className="mt-2 text-[2rem] font-bold tracking-[-0.03em] sm:text-[2.5rem]">
          AgentMarket
        </h1>
        <div className="mt-8 space-y-6 text-[15px] leading-relaxed text-muted-foreground">
          <p>
            AgentMarket — маркетплейс готовых AI-агентов, которые работают
            24/7 в изолированных Docker-контейнерах. Не промпты, не инструкции,
            а полноценные системы: выбрал, оплатил, настроил — и агент уже
            решает твою задачу.
          </p>
          <p>
            Мы запускаемся с каталогом из нескольких «идеальных» агентов,
            собранных командой: боты поддержки, генераторы контента, мониторы
            конкурентов. Дальше каталог растёт за счёт сторонних разработчиков,
            платформа берёт 15% комиссии с каждой подписки.
          </p>
          <p>
            Проект находится в активной разработке. Если хочешь обсудить
            сотрудничество или стать первым продавцом — напиши нам в Telegram.
          </p>
        </div>
      </div>
    </section>
  );
}
