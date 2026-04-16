"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Search, Settings, Zap, ArrowRight } from "lucide-react";
import Link from "next/link";

const steps = [
  {
    title: "Выбираете",
    desc: "В каталоге уже собраны сценарии: поддержка, контент, аналитика, мониторинг. Не идея, а готовый формат работы.",
    detail: "Каждый агент решает конкретную задачу. Карточка показывает категорию, рейтинг, число запусков и стоимость.",
    icon: Search,
  },
  {
    title: "Подключаете",
    desc: "Ключи и рабочие параметры вводятся в кабинете. Без пересылки доступов в чат и ручной сборки по кускам.",
    detail: "Пошаговый мастер настройки. Всё шифруется AES-256 и хранится безопасно. Ваши данные - только ваши.",
    icon: Settings,
  },
  {
    title: "Работает",
    desc: "После запуска агент живёт в кабинете. Статус, история событий, логи и управление - всё под рукой.",
    detail: "Агент работает 24/7. Логи в реальном времени, метрики, кнопки управления.",
    icon: Zap,
  },
];

const ease = [0.16, 1, 0.3, 1] as const;

function TimelineStep({
  step,
  index,
  isLast,
}: {
  step: (typeof steps)[0];
  index: number;
  isLast: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <div ref={ref} className="relative flex gap-6 sm:gap-10">
      {/* Timeline line + dot */}
      <div className="flex flex-col items-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={inView ? { scale: 1 } : {}}
          transition={{ duration: 0.4, delay: 0.1, ease }}
          className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-primary/30 bg-background"
        >
          <step.icon className="h-5 w-5 text-primary" />
        </motion.div>
        {!isLast && (
          <motion.div
            initial={{ scaleY: 0 }}
            animate={inView ? { scaleY: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.3, ease }}
            className="w-px flex-1 origin-top bg-border/60"
          />
        )}
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={inView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.6, delay: 0.2, ease }}
        className={`pb-16 ${isLast ? "pb-0" : ""}`}
      >
        <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-primary">
          Шаг {index + 1}
        </div>
        <h3 className="mt-1 text-[22px] font-semibold tracking-tight sm:text-[26px]">
          {step.title}
        </h3>
        <p className="mt-3 max-w-md text-[14px] leading-relaxed text-muted-foreground">
          {step.desc}
        </p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.5, ease }}
          className="mt-4 rounded-lg border border-border/40 bg-card/50 px-5 py-4"
        >
          <p className="text-[13px] leading-relaxed text-muted-foreground/80">
            {step.detail}
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function TestV2() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6">
      <p className="font-mono text-[10.5px] uppercase tracking-[0.15em] text-muted-foreground">
        Вариант 2 - Timeline со scroll-анимацией
      </p>
      <h2 className="mt-4 max-w-3xl text-[2.25rem] font-bold leading-[1] tracking-[-0.04em] sm:text-[3.25rem] lg:text-[4rem]">
        От выбора <span className="text-primary">до запуска.</span>
      </h2>

      <div className="mt-14 ml-2 sm:ml-6">
        {steps.map((step, i) => (
          <TimelineStep
            key={step.title}
            step={step}
            index={i}
            isLast={i === steps.length - 1}
          />
        ))}
      </div>

      <div className="mt-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowRight className="h-3.5 w-3.5 rotate-180" />
          Назад на главную
        </Link>
      </div>
    </div>
  );
}
