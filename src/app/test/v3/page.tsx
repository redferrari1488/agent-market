"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Settings, Zap, ArrowRight, ChevronRight } from "lucide-react";
import Link from "next/link";

const steps = [
  {
    title: "Выбираете",
    desc: "Готовые сценарии: поддержка, контент, аналитика, мониторинг.",
    detail: "Каждый агент решает конкретную задачу. Карточка показывает категорию, рейтинг, число запусков и стоимость - всё для быстрого выбора без лишних вопросов.",
    icon: Search,
    accent: "bg-blue-500/10 text-blue-500",
  },
  {
    title: "Подключаете",
    desc: "Ключи и параметры вводятся в кабинете за несколько минут.",
    detail: "Пошаговый мастер настройки проведёт через каждый параметр. API-ключи шифруются AES-256-GCM. Ваши данные не покидают платформу и остаются только вашими.",
    icon: Settings,
    accent: "bg-amber-500/10 text-amber-500",
  },
  {
    title: "Работает",
    desc: "Агент запущен 24/7. Логи, статус и управление в кабинете.",
    detail: "После запуска агент живёт в кабинете. Статус в реальном времени, полная история действий, стриминг логов, кнопки стоп и перезапуск - полный контроль без командной строки.",
    icon: Zap,
    accent: "bg-emerald-500/10 text-emerald-500",
  },
];

const ease = [0.16, 1, 0.3, 1] as const;

function ExpandCard({ step, index }: { step: (typeof steps)[0]; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.12, ease }}
      className="group"
    >
      <div
        className="cursor-pointer rounded-xl border border-border/40 bg-background p-6 transition-all hover:border-border sm:p-8"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${step.accent}`}>
              <step.icon className="h-5 w-5" />
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                Шаг {index + 1}
              </div>
              <h3 className="mt-1 text-[18px] font-semibold tracking-tight sm:text-[22px]">
                {step.title}
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                {step.desc}
              </p>
            </div>
          </div>
          <motion.div
            animate={{ rotate: expanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
            className="mt-1 shrink-0 text-muted-foreground/40"
          >
            <ChevronRight className="h-5 w-5" />
          </motion.div>
        </div>

        <motion.div
          initial={false}
          animate={{
            height: expanded ? "auto" : 0,
            opacity: expanded ? 1 : 0,
          }}
          transition={{ duration: 0.3, ease }}
          className="overflow-hidden"
        >
          <div className="mt-5 border-t border-border/40 pt-5">
            <p className="text-[14px] leading-relaxed text-muted-foreground">
              {step.detail}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Connector line */}
      {index < steps.length - 1 && (
        <div className="flex justify-center py-2">
          <div className="h-6 w-px bg-border/40" />
        </div>
      )}
    </motion.div>
  );
}

export default function TestV3() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-20 sm:px-6">
      <p className="font-mono text-[10.5px] uppercase tracking-[0.15em] text-muted-foreground">
        Вариант 3 - Раскрывающиеся карточки (accordion)
      </p>
      <h2 className="mt-4 max-w-3xl text-[2.25rem] font-bold leading-[1] tracking-[-0.04em] sm:text-[3.25rem] lg:text-[4rem]">
        От выбора <span className="text-primary">до запуска.</span>
      </h2>

      <div className="mt-14 space-y-0">
        {steps.map((step, i) => (
          <ExpandCard key={step.title} step={step} index={i} />
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
