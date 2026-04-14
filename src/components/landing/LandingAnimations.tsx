"use client";

import Link from "next/link";
import {
  ArrowRight,
  Activity,
  MousePointerClick,
  ShieldCheck,
  CreditCard,
  Search,
  Settings2,
  Rocket,
  Wallet,
  TrendingUp,
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
  {
    n: "01",
    title: "Выберите",
    desc: "Каталог агентов по категориям: поддержка, контент, мониторинг, аналитика.",
    icon: Search,
  },
  {
    n: "02",
    title: "Настройте",
    desc: "Подключите свои ключи и параметры - пошаговая настройка без кода.",
    icon: Settings2,
  },
  {
    n: "03",
    title: "Запустите",
    desc: "Агент запускается у нас. Логи и управление - в дашборде.",
    icon: Rocket,
  },
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
          Всё управление - из дашборда. Без лишних технических шагов.
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
              <h1 className="mt-4 text-[2.75rem] font-bold leading-[1.02] tracking-[-0.04em] sm:text-[3.5rem] lg:text-[4.25rem]">
                Каталог рабочих{" "}
                <span className="text-muted-foreground">AI-агентов</span>
              </h1>
            </HeroLine>
            <HeroLine i={2}>
              <p className="mx-auto mt-6 max-w-xl text-[16px] leading-relaxed text-muted-foreground">
                Поддержка, контент, аналитика, мониторинг. Выбираете агента,
                подключаете свои ключи - дальше он работает у нас в облаке.
              </p>
            </HeroLine>
            <HeroLine i={3}>
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
          <div className="pt-14 sm:pt-16">
            <FadeIn>
              <p className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Процесс
              </p>
              <h2 className="mt-2 max-w-xl text-[2rem] font-bold leading-[1.1] tracking-[-0.03em] sm:text-[2.5rem]">
                Три шага до запуска
              </h2>
            </FadeIn>
          </div>

          <StaggerList className="mt-10 grid gap-px overflow-hidden sm:mt-14 sm:grid-cols-3 sm:rounded-lg sm:border sm:border-border/40 sm:bg-border/40">
            {processSteps.map((s, idx) => {
              const Icon = s.icon;
              return (
                <StaggerItem key={s.n}>
                  <div className="group relative h-full border-t border-border/40 bg-background px-2 py-8 transition-colors hover:bg-card/40 sm:border-t-0 sm:p-9">
                    <div className="flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border/40 text-muted-foreground transition-colors group-hover:border-border group-hover:text-foreground">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="font-mono text-[40px] font-bold leading-none tracking-[-0.04em] text-muted-foreground/15 transition-colors group-hover:text-muted-foreground/30 sm:text-[52px]">
                        {s.n}
                      </span>
                    </div>
                    <h3 className="mt-6 text-[18px] font-semibold tracking-tight sm:text-[20px]">
                      {s.title}
                    </h3>
                    <p className="mt-2 max-w-xs text-[13.5px] leading-relaxed text-muted-foreground">
                      {s.desc}
                    </p>
                    {idx < processSteps.length - 1 && (
                      <div className="absolute right-6 top-1/2 hidden -translate-y-1/2 text-muted-foreground/20 sm:block">
                        <ArrowRight className="h-3.5 w-3.5" />
                      </div>
                    )}
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerList>

          <div className="h-14 sm:h-16" />
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
                  Инфраструктура под ключ
                </h2>
              </TextReveal>
              <FadeIn delay={0.2} y={40}>
                <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted-foreground">
                  Изолированная среда, шифрование ключей, логи и метрики
                  в дашборде. Отдельную инфраструктуру настраивать не нужно.
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
          <div className="grid items-center gap-12 py-20 sm:py-28 lg:grid-cols-2 lg:gap-16">
            <div>
              <FadeIn>
                <p className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  Продавцам
                </p>
              </FadeIn>
              <TextReveal delay={0.1}>
                <h2 className="mt-3 max-w-md text-[2rem] font-bold leading-[1.1] tracking-[-0.03em] sm:text-[2.5rem]">
                  Загрузите агента.
                </h2>
              </TextReveal>
              <TextReveal delay={0.2}>
                <h2 className="max-w-md text-[2rem] font-bold leading-[1.1] tracking-[-0.03em] text-muted-foreground sm:text-[2.5rem]">
                  Получайте деньги.
                </h2>
              </TextReveal>
              <FadeIn delay={0.4} y={30}>
                <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted-foreground">
                  Мы берём на себя биллинг, запуск и инфраструктуру.
                  Вы загружаете агента, назначаете цену - покупатели
                  находят, настраивают и запускают его из каталога.
                </p>
              </FadeIn>
              <FadeIn delay={0.5} y={20}>
                <div className="mt-8 grid max-w-md grid-cols-2 gap-px overflow-hidden rounded-lg border border-border/40 bg-border/40">
                  <div className="bg-background p-5">
                    <div className="font-mono text-[10.5px] uppercase tracking-[0.15em] text-muted-foreground/70">
                      Ваша доля
                    </div>
                    <div className="mt-2 text-[2rem] font-bold leading-none tracking-[-0.03em] text-foreground">
                      <CountUp target={88} duration={1.6} />%
                    </div>
                  </div>
                  <div className="bg-background p-5">
                    <div className="font-mono text-[10.5px] uppercase tracking-[0.15em] text-muted-foreground/70">
                      Комиссия
                    </div>
                    <div className="mt-2 text-[2rem] font-bold leading-none tracking-[-0.03em] text-muted-foreground/50">
                      12%
                    </div>
                  </div>
                </div>
              </FadeIn>
              <FadeIn delay={0.6} y={20}>
                <Link
                  href="/seller"
                  className="group mt-8 inline-flex h-11 items-center gap-2 rounded-lg bg-foreground px-6 text-[14px] font-medium text-background transition-opacity hover:opacity-90"
                >
                  Стать продавцом
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </FadeIn>
            </div>

            {/* Mock payout card */}
            <ScaleIn>
              <div className="relative mx-auto w-full max-w-md">
                <div className="overflow-hidden rounded-xl border border-border/40 bg-card/50 shadow-xl shadow-black/20">
                  <div className="flex items-center justify-between border-b border-border/40 px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                        <Wallet className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-[12px] font-semibold tracking-tight">Выплата</div>
                        <div className="font-mono text-[10px] text-muted-foreground/60">MAR 2026</div>
                      </div>
                    </div>
                    <span className="flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2 py-1 font-mono text-[10px] font-medium uppercase tracking-wider text-emerald-400">
                      <span className="h-1 w-1 rounded-full bg-emerald-400" />
                      Выплачено
                    </span>
                  </div>

                  <div className="px-5 py-5">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[2.5rem] font-bold leading-none tracking-[-0.03em]">
                        146 960
                      </span>
                      <span className="text-[14px] text-muted-foreground">₽</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5 text-[12px] text-emerald-400">
                      <TrendingUp className="h-3 w-3" />
                      +24% к февралю
                    </div>
                  </div>

                  <div className="space-y-2.5 border-t border-border/40 px-5 py-4 font-mono text-[11.5px]">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground/70">Ваша часть</span>
                      <span className="text-foreground/90">167 000 ₽</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground/70">Комиссия (12%)</span>
                      <span className="text-muted-foreground/60">−20 040 ₽</span>
                    </div>
                    <div className="flex justify-between border-t border-border/40 pt-2.5 text-foreground">
                      <span className="font-semibold">К выплате</span>
                      <span className="font-semibold">146 960 ₽</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-border/40 bg-card/50 px-5 py-3 font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted-foreground/60">
                    <span>Продаж · 47</span>
                    <span>Активных · 31</span>
                  </div>
                </div>
              </div>
            </ScaleIn>
          </div>
        </div>
      </section>
    </>
  );
}
