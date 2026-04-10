import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "О нас — AgentMarket",
  description: "Маркетплейс готовых AI-агентов для бизнеса.",
};

export default function AboutPage() {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[400px] overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[300px] w-[600px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-violet-600/10 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="bg-gradient-to-r from-violet-300 to-blue-300 bg-clip-text text-4xl font-bold text-transparent">
          О проекте
        </h1>
        <div className="mt-8 space-y-6 text-muted-foreground">
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
    </div>
  );
}
