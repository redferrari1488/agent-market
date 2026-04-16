"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Settings, Zap, ArrowRight } from "lucide-react";
import Link from "next/link";

const steps = [
  {
    id: 1,
    title: "Выбираете",
    desc: "В каталоге уже собраны сценарии: поддержка, контент, аналитика, мониторинг. Не идея, а готовый формат работы.",
    icon: Search,
    detail: "Каждый агент решает конкретную задачу. Карточка показывает категорию, рейтинг, число запусков и стоимость - всё для быстрого выбора.",
  },
  {
    id: 2,
    title: "Подключаете",
    desc: "Ключи и рабочие параметры вводятся в кабинете. Без пересылки доступов в чат и ручной сборки по кускам.",
    icon: Settings,
    detail: "Пошаговый мастер настройки: вводите API-ключи и параметры. Всё шифруется AES-256 и хранится безопасно. Ваши данные - только ваши.",
  },
  {
    id: 3,
    title: "Работает",
    desc: "После запуска агент живёт в кабинете. Статус, история событий, логи и управление - всё под рукой.",
    icon: Zap,
    detail: "Агент работает 24/7. В кабинете видны логи в реальном времени, метрики производительности, кнопки стоп/перезапуск.",
  },
];

const ease = [0.16, 1, 0.3, 1] as const;

export default function TestV1() {
  const [active, setActive] = useState(1);
  const current = steps.find((s) => s.id === active)!;

  return (
    <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6">
      <p className="font-mono text-[10.5px] uppercase tracking-[0.15em] text-muted-foreground">
        Вариант 1 - Интерактивный stepper
      </p>
      <h2 className="mt-4 max-w-3xl text-[2.25rem] font-bold leading-[1] tracking-[-0.04em] sm:text-[3.25rem] lg:text-[4rem]">
        От выбора <span className="text-primary">до запуска.</span>
      </h2>

      <div className="mt-14 grid gap-8 lg:grid-cols-[1fr_1.2fr] lg:gap-14">
        {/* Step selector */}
        <div className="space-y-2">
          {steps.map((step) => {
            const isActive = step.id === active;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setActive(step.id)}
                className={`group relative w-full rounded-xl border px-6 py-5 text-left transition-all ${
                  isActive
                    ? "border-primary/30 bg-primary/5"
                    : "border-border/40 bg-background hover:border-border"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="step-indicator"
                    className="absolute left-0 top-4 bottom-4 w-[3px] rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <div className="flex items-center gap-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors ${
                    isActive ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                  }`}>
                    <step.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className={`text-[15px] font-semibold tracking-tight transition-colors ${
                      isActive ? "text-foreground" : "text-foreground/70"
                    }`}>
                      {step.title}
                    </div>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">
                      {step.desc}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Detail panel */}
        <div className="relative min-h-[240px] overflow-hidden rounded-xl border border-border/40 bg-card p-8 sm:p-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease }}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <current.icon className="h-6 w-6" />
                </div>
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    Шаг {current.id} из 3
                  </div>
                  <h3 className="text-[22px] font-semibold tracking-tight">
                    {current.title}
                  </h3>
                </div>
              </div>
              <p className="mt-6 text-[15px] leading-relaxed text-muted-foreground">
                {current.detail}
              </p>

              {/* Progress dots */}
              <div className="mt-8 flex items-center gap-2">
                {steps.map((s) => (
                  <div
                    key={s.id}
                    className={`h-1.5 rounded-full transition-all ${
                      s.id === active ? "w-8 bg-primary" : "w-1.5 bg-border"
                    }`}
                  />
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
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
