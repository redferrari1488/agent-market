"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { AgentGrid } from "@/components/agents/AgentGrid";
import { HeroDashboardMock } from "@/components/landing/HeroDashboardMock";
import { FadeIn, CountUp } from "@/components/motion";
import type { Agent } from "@/components/agents/AgentCard";

const ease = [0.16, 1, 0.3, 1] as const;

function HeroStagger({ children, i }: { children: React.ReactNode; i: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 + i * 0.08, ease }}
    >
      {children}
    </motion.div>
  );
}

const processSteps = [
  { n: "01", title: "Выберите", desc: "Каталог агентов по категориям - поддержка, контент, мониторинг, аналитика." },
  { n: "02", title: "Настройте", desc: "Укажите Telegram-бот, API-ключи и параметры. Пошаговая настройка проведёт через каждый шаг." },
  { n: "03", title: "Запустите", desc: "Агент работает в облаке. Логи, статус и управление - из дашборда." },
];

const platformSpecs = [
  ["Среда", "Изолированная, отдельная для каждого агента"],
  ["Ресурсы", "Выделенная память и процессор"],
  ["Безопасность", "AES-256 шифрование настроек"],
  ["AI-модели", "Claude или OpenAI - ваш ключ"],
  ["Автозапуск", "Перезапуск при любом сбое"],
];

const capabilities = [
  { title: "Всё видно в реальном времени", desc: "Что делает ваш агент прямо сейчас - логи, события, статус. Обновляется автоматически." },
  { title: "Управление в два клика", desc: "Запустить, остановить, перезапустить, изменить настройки. Всё из дашборда." },
  { title: "Работает без перерывов", desc: "Агент запускается автоматически после любого сбоя. Работает 24/7 без вашего участия." },
  { title: "Оплата как удобно", desc: "Картой в рублях или криптовалютой. Выбираете при оформлении." },
];

export function LandingAnimations({ agents }: { agents: Agent[] }) {
  return (
    <>
      {/* ===== HERO ===== */}
      <section className="mx-auto max-w-6xl px-5 sm:px-6">
        <div className="pt-16 sm:pt-24 lg:pt-28">
          <div className="mx-auto max-w-3xl text-center">
            <HeroStagger i={0}>
              <p className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Маркетплейс агентов
              </p>
            </HeroStagger>
            <HeroStagger i={1}>
              <h1 className="mt-4 text-[2.75rem] font-bold leading-[1.05] tracking-[-0.04em] sm:text-[3.5rem] lg:text-[4.25rem]">
                Запускайте рабочих агентов,
                <br className="hidden sm:block" />{" "}
                <span className="text-muted-foreground">не написав ни строчки.</span>
              </h1>
            </HeroStagger>
            <HeroStagger i={2}>
              <p className="mx-auto mt-5 max-w-lg text-[16px] leading-relaxed text-muted-foreground">
                Каталог готовых агентов. Поддержка, контент, мониторинг.
                Выберите, настройте, запустите - работает 24/7.
              </p>
            </HeroStagger>
            <HeroStagger i={3}>
              <div className="mt-8 flex items-center justify-center gap-3">
                <Link
                  href="/agents"
                  className="group inline-flex h-11 items-center gap-2 rounded-lg bg-foreground px-6 text-[14px] font-medium text-background transition-opacity hover:opacity-90"
                >
                  Каталог
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="#how"
                  className="inline-flex h-11 items-center px-4 text-[14px] text-muted-foreground transition-colors hover:text-foreground"
                >
                  Как это работает
                </Link>
              </div>
            </HeroStagger>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5, ease }}
            className="mt-12 sm:mt-16"
          >
            <HeroDashboardMock />
          </motion.div>
        </div>
      </section>

      {/* ===== PROCESS ===== */}
      <section id="how" className="mt-20 border-y border-border/40 sm:mt-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-6">
          <div className="grid divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0 divide-border/40">
            {processSteps.map((s, i) => (
              <FadeIn key={s.n} delay={i * 0.1} y={16}>
                <div className="py-8 sm:px-8 sm:py-10 sm:first:pl-0 sm:last:pr-0">
                  <span className="font-mono text-[11px] text-muted-foreground/50">{s.n}</span>
                  <h3 className="mt-2 text-[18px] font-semibold tracking-tight">{s.title}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{s.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PLATFORM ===== */}
      <section className="mx-auto max-w-6xl px-5 sm:px-6">
        <div className="py-20 sm:py-28">
          <div className="grid gap-16 lg:grid-cols-[1.2fr_1fr] lg:items-start">
            <div>
              <FadeIn>
                <p className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  Платформа
                </p>
                <h2 className="mt-3 text-[2rem] font-bold leading-[1.1] tracking-[-0.03em] sm:text-[2.5rem]">
                  Запустили - работает.
                  <br />
                  Всё остальное - на нас.
                </h2>
                <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted-foreground">
                  Каждый агент запускается в защищённой среде с выделенными
                  ресурсами. Ваши ключи и настройки зашифрованы. Управление,
                  логи и контроль - в одном дашборде, без технических знаний.
                </p>
              </FadeIn>

              <FadeIn delay={0.15}>
                <div className="mt-8 rounded-lg border border-border/40 bg-card/50 p-5">
                  <div className="space-y-3 font-mono text-[12px]">
                    {platformSpecs.map(([label, value]) => (
                      <div key={label} className="flex justify-between gap-4">
                        <span className="text-muted-foreground/60">{label}</span>
                        <span className="text-right text-foreground/80">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </FadeIn>
            </div>

            <div className="lg:pt-14">
              <div className="space-y-8">
                {capabilities.map((f, i) => (
                  <FadeIn key={f.title} delay={i * 0.08} y={16}>
                    <div className="border-l-2 border-border/60 pl-5">
                      <h3 className="text-[15px] font-semibold">{f.title}</h3>
                      <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{f.desc}</p>
                    </div>
                  </FadeIn>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CATALOG ===== */}
      {agents.length > 0 && (
        <section className="border-t border-border/40">
          <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 sm:py-24">
            <FadeIn>
              <div className="flex items-end justify-between">
                <div>
                  <p className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    Каталог
                  </p>
                  <h2 className="mt-2 text-[2rem] font-bold tracking-[-0.03em] sm:text-[2.5rem]">
                    Агенты
                  </h2>
                </div>
                <Link
                  href="/agents"
                  className="hidden items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground sm:flex"
                >
                  Все агенты
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </FadeIn>

            <div className="mt-10">
              <AgentGrid agents={agents} animated />
            </div>

            <div className="mt-8 text-center sm:hidden">
              <Link
                href="/agents"
                className="text-[13px] text-muted-foreground hover:text-foreground"
              >
                Все агенты →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ===== SELLER ===== */}
      <section className="border-t border-border/40">
        <div className="mx-auto max-w-6xl px-5 sm:px-6">
          <div className="grid items-center gap-10 py-20 sm:py-28 lg:grid-cols-[auto_1fr] lg:gap-20">
            <FadeIn className="text-center lg:text-left">
              <div className="text-[7rem] font-bold leading-none tracking-[-0.06em] text-foreground/10 sm:text-[9rem] lg:text-[11rem]">
                <CountUp target={85} duration={1.4} />
              </div>
              <div className="mt-1 font-mono text-[12px] uppercase tracking-[0.15em] text-muted-foreground">
                процентов выручки - вам
              </div>
            </FadeIn>

            <FadeIn delay={0.12}>
              <div className="max-w-md">
                <h2 className="text-[1.75rem] font-bold leading-[1.15] tracking-[-0.02em] sm:text-[2rem]">
                  Загрузите агента. Назначьте цену. Получайте деньги.
                </h2>
                <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
                  Мы берём на себя биллинг, запуск и инфраструктуру.
                  Вы загружаете агента, назначаете цену - покупатели
                  находят, настраивают и запускают его из каталога.
                  Платформа удерживает 15%. Остальное - ваше.
                </p>
                <Link
                  href="/seller"
                  className="group mt-6 inline-flex items-center gap-2 text-[14px] font-medium transition-colors hover:text-foreground"
                >
                  Стать продавцом
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>
    </>
  );
}
