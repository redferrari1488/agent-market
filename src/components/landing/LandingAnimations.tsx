"use client";

import Link from "next/link";
import {
  ArrowRight,
  Activity,
  MousePointerClick,
  ShieldCheck,
  CreditCard,
} from "lucide-react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
import { AgentGrid } from "@/components/agents/AgentGrid";
import { HeroDashboardMock } from "@/components/landing/HeroDashboardMock";
import {
  FadeIn,
  TextReveal,
  CountUp,
  ScaleIn,
  SlideIn,
  LineDraw,
  StaggerList,
  StaggerItem,
} from "@/components/motion";
import type { Agent } from "@/components/agents/AgentCard";

const ease = [0.25, 1, 0.5, 1] as const;

/* ── Hero element — staggered entrance with clip reveal ── */
function HeroLine({ children, i }: { children: React.ReactNode; i: number }) {
  return (
    <div className="overflow-hidden">
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.15 + i * 0.12, ease }}
      >
        {children}
      </motion.div>
    </div>
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
  {
    title: "Всё видно в реальном времени",
    icon: Activity,
    content: (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {["Live-логи", "Статус агента", "Последние события", "Ошибки"].map((t) => (
            <span key={t} className="rounded-md bg-primary/10 px-2.5 py-1 text-[12px] font-medium text-primary">{t}</span>
          ))}
        </div>
        <p className="text-[14px] leading-relaxed text-muted-foreground">
          Что делает ваш агент прямо сейчас - в одном окне. Обновление каждые 2 секунды.
        </p>
      </div>
    ),
  },
  {
    title: "Управление в два клика",
    icon: MousePointerClick,
    content: (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {["Запустить", "Остановить", "Перезапустить", "Настройки"].map((t) => (
            <span key={t} className="rounded-md bg-primary/10 px-2.5 py-1 text-[12px] font-medium text-primary">{t}</span>
          ))}
        </div>
        <p className="text-[14px] leading-relaxed text-muted-foreground">
          Всё управление - из дашборда. Без терминала, без SSH.
        </p>
      </div>
    ),
  },
  {
    title: "Работает без перерывов",
    icon: ShieldCheck,
    content: (
      <div className="space-y-3">
        <div className="flex items-baseline gap-3">
          <span className="text-[28px] font-bold tracking-tight text-foreground">99.9%</span>
          <span className="text-[13px] text-muted-foreground">uptime</span>
        </div>
        <ul className="space-y-1.5 text-[14px] text-muted-foreground">
          <li className="flex items-center gap-2"><span className="h-1 w-1 shrink-0 rounded-full bg-emerald-400" />Автоперезапуск при любом сбое</li>
          <li className="flex items-center gap-2"><span className="h-1 w-1 shrink-0 rounded-full bg-emerald-400" />Мониторинг здоровья 24/7</li>
          <li className="flex items-center gap-2"><span className="h-1 w-1 shrink-0 rounded-full bg-emerald-400" />Без вашего участия</li>
        </ul>
      </div>
    ),
  },
  {
    title: "Оплата как удобно",
    icon: CreditCard,
    content: (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border/60 p-3">
            <div className="text-[14px] font-medium">Карта</div>
            <div className="mt-0.5 text-[12px] text-muted-foreground">Рубли, Visa/MC/МИР</div>
          </div>
          <div className="rounded-lg border border-border/60 p-3">
            <div className="text-[14px] font-medium">Криптовалюта</div>
            <div className="mt-0.5 text-[12px] text-muted-foreground">USDT, BTC, ETH</div>
          </div>
        </div>
        <p className="text-[13px] text-muted-foreground">Отмена подписки в любой момент. Без скрытых платежей.</p>
      </div>
    ),
  },
];

/* ── Accordion for capabilities ── */
function CapabilitiesAccordion() {
  const [open, setOpen] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <div ref={ref}>
      {capabilities.map((item, i) => {
        const isOpen = open === i;
        return (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6, delay: 0.2 + i * 0.1, ease }}
            className="border-b border-border/40"
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? -1 : i)}
              className="group flex w-full items-center gap-5 py-6 text-left transition-colors hover:bg-card/50 sm:gap-6 sm:py-7"
            >
              <span className={`font-mono text-[24px] font-bold tabular-nums leading-none transition-colors duration-300 sm:text-[28px] ${isOpen ? "text-primary" : "text-muted-foreground/20"}`}>
                0{i + 1}
              </span>
              <div className="flex flex-1 items-center gap-2.5">
                <item.icon className={`h-4 w-4 shrink-0 transition-colors duration-300 ${isOpen ? "text-primary" : "text-muted-foreground/30"}`} />
                <span className={`text-[17px] font-semibold tracking-tight transition-colors duration-300 sm:text-[19px] ${isOpen ? "text-foreground" : "text-muted-foreground/70 group-hover:text-muted-foreground"}`}>
                  {item.title}
                </span>
              </div>
              <motion.div
                animate={{ rotate: isOpen ? 45 : 0 }}
                transition={{ duration: 0.25, ease }}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors duration-300 ${isOpen ? "border-primary/30 text-primary" : "border-border/60 text-muted-foreground/30"}`}
              >
                <span className="text-[16px] leading-none">+</span>
              </motion.div>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease }}
                  className="overflow-hidden"
                >
                  <div className="pb-6 pl-[calc(28px+1.25rem+1.5rem)] pr-4 sm:pl-[calc(32px+1.5rem+1.5rem)] sm:pr-12">
                    {item.content}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ── Spec rows with stagger ── */
function SpecTable() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <div ref={ref} className="mt-8 rounded-lg border border-border/40 bg-card/50 p-5">
      <div className="space-y-3 font-mono text-[12px]">
        {platformSpecs.map(([label, value], i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
            transition={{ duration: 0.5, delay: 0.3 + i * 0.08, ease }}
            className="flex justify-between gap-4"
          >
            <span className="text-muted-foreground/60">{label}</span>
            <span className="text-right text-foreground/80">{value}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function LandingAnimations({ agents }: { agents: Agent[] }) {
  return (
    <>
      {/* ===== HERO ===== */}
      <section className="mx-auto max-w-6xl px-5 sm:px-6">
        <div className="pt-16 sm:pt-24 lg:pt-28">
          <div className="mx-auto max-w-3xl text-center">
            <HeroLine i={0}>
              <p className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Маркетплейс агентов
              </p>
            </HeroLine>
            <HeroLine i={1}>
              <h1 className="mt-4 text-[2.75rem] font-bold leading-[1.05] tracking-[-0.04em] sm:text-[3.5rem] lg:text-[4.25rem]">
                Запускайте рабочих агентов,
              </h1>
            </HeroLine>
            <HeroLine i={2}>
              <h1 className="text-[2.75rem] font-bold leading-[1.05] tracking-[-0.04em] text-muted-foreground sm:text-[3.5rem] lg:text-[4.25rem]">
                не написав ни строчки.
              </h1>
            </HeroLine>
            <HeroLine i={3}>
              <p className="mx-auto mt-5 max-w-lg text-[16px] leading-relaxed text-muted-foreground">
                Каталог готовых агентов. Поддержка, контент, мониторинг.
                Выберите, настройте, запустите - работает 24/7.
              </p>
            </HeroLine>
            <HeroLine i={4}>
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
            </HeroLine>
          </div>

          {/* Mock — scale in from below, dramatic */}
          <motion.div
            initial={{ opacity: 0, y: 80, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1, delay: 0.7, ease }}
            className="mt-12 sm:mt-16"
          >
            <div className="relative">
              <div className="absolute -inset-12 -z-10 rounded-[50%] bg-primary/[0.07] blur-3xl" />
              <div className="rounded-xl shadow-2xl shadow-black/25">
                <HeroDashboardMock />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== PROCESS ===== */}
      <section id="how" className="mt-20 border-y border-border/40 sm:mt-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-6">
          <StaggerList className="grid divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0 divide-border/40">
            {processSteps.map((s) => (
              <StaggerItem key={s.n}>
                <div className="py-8 sm:px-8 sm:py-10">
                  <span className="font-mono text-[11px] text-muted-foreground/50">{s.n}</span>
                  <h3 className="mt-2 text-[18px] font-semibold tracking-tight">{s.title}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{s.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerList>
        </div>
      </section>

      {/* ===== PLATFORM ===== */}
      <section className="bg-card/50">
        <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <div className="py-20 sm:py-28">
          <div className="grid gap-16 lg:grid-cols-[1.2fr_1fr] lg:items-start">
            <div>
              <SlideIn direction="left">
                <p className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  Платформа
                </p>
              </SlideIn>
              <TextReveal delay={0.1}>
                <h2 className="mt-3 text-[2rem] font-bold leading-[1.1] tracking-[-0.03em] sm:text-[2.5rem]">
                  Запустили - работает.
                </h2>
              </TextReveal>
              <TextReveal delay={0.2}>
                <h2 className="text-[2rem] font-bold leading-[1.1] tracking-[-0.03em] sm:text-[2.5rem]">
                  Всё остальное - на нас.
                </h2>
              </TextReveal>
              <FadeIn delay={0.3} y={40}>
                <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted-foreground">
                  Каждый агент запускается в защищённой среде с выделенными
                  ресурсами. Ваши ключи и настройки зашифрованы. Управление,
                  логи и контроль - в одном дашборде, без технических знаний.
                </p>
              </FadeIn>

              <SpecTable />
            </div>

            {/* Right: capabilities accordion */}
            <div className="lg:pt-10">
              <CapabilitiesAccordion />
            </div>
          </div>
        </div>
        </div>
      </section>

      {/* ===== CATALOG ===== */}
      {agents.length > 0 && (
        <section className="border-t border-border/40">
          <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 sm:py-24">
            <FadeIn y={40}>
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
            <ScaleIn className="text-center lg:text-left">
              <div className="text-[7rem] font-bold leading-none tracking-[-0.06em] text-foreground/20 sm:text-[9rem] lg:text-[11rem]">
                <CountUp target={85} duration={1.8} />
              </div>
              <div className="mt-1 font-mono text-[12px] uppercase tracking-[0.15em] text-muted-foreground">
                процентов выручки - вам
              </div>
            </ScaleIn>

            <div>
              <TextReveal delay={0.2}>
                <h2 className="max-w-md text-[1.75rem] font-bold leading-[1.15] tracking-[-0.02em] sm:text-[2rem]">
                  Загрузите агента. Назначьте цену. Получайте деньги.
                </h2>
              </TextReveal>
              <FadeIn delay={0.4} y={30}>
                <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted-foreground">
                  Мы берём на себя биллинг, запуск и инфраструктуру.
                  Вы загружаете агента, назначаете цену - покупатели
                  находят, настраивают и запускают его из каталога.
                  Платформа удерживает 15%. Остальное - ваше.
                </p>
              </FadeIn>
              <FadeIn delay={0.55} y={20}>
                <Link
                  href="/seller"
                  className="group mt-6 inline-flex items-center gap-2 text-[14px] font-medium transition-colors hover:text-foreground"
                >
                  Стать продавцом
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </FadeIn>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
