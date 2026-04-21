"use client";

import { Fragment } from "react";
import { motion } from "framer-motion";
import { Upload, ShieldCheck, Wallet } from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

const STEPS = [
  {
    icon: Upload,
    title: "Создайте агента",
    desc: "Опишите функционал, загрузите образ и настройте поля для покупателей.",
  },
  {
    icon: ShieldCheck,
    title: "Модерация",
    desc: "Команда проверит безопасность и опубликует агента в каталоге.",
  },
  {
    icon: Wallet,
    title: "Получайте доход",
    desc: "Покупатели подключают агента — 88% с каждого платежа на ваш счёт.",
  },
];

function FlowArrow({ delay }: { delay: number }) {
  return (
    <motion.svg
      viewBox="0 0 88 14"
      className="hidden h-3 w-20 self-center text-border sm:block"
      aria-hidden
    >
      <motion.line
        x1="2"
        y1="7"
        x2="74"
        y2="7"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeDasharray="2 5"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 0.7 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.9, delay, ease: "easeOut" }}
      />
      <motion.path
        d="M74 1.5 L86 7 L74 12.5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={{ opacity: 0, x: -8 }}
        whileInView={{ opacity: 0.7, x: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.4, delay: delay + 0.7, ease: "easeOut" }}
      />
    </motion.svg>
  );
}

export function BecomeSellerSteps() {
  return (
    <div className="mt-14 grid gap-10 text-left sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-start sm:gap-4">
      {STEPS.map((step, i) => {
        const Icon = step.icon;
        const stepDelay = i * 0.18;
        return (
          <Fragment key={step.title}>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.55, delay: stepDelay, ease }}
              className="flex flex-col items-start gap-4 sm:items-center sm:text-center"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: 0.5, delay: stepDelay + 0.1, ease }}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-border/50 bg-background"
              >
                <Icon className="h-5 w-5 text-foreground/80" />
              </motion.div>
              <div className="space-y-1.5">
                <h3 className="text-[16px] font-semibold tracking-[-0.01em]">
                  {step.title}
                </h3>
                <p className="max-w-[18rem] text-[13.5px] leading-relaxed text-muted-foreground">
                  {step.desc}
                </p>
              </div>
            </motion.div>
            {i < STEPS.length - 1 && <FlowArrow delay={stepDelay + 0.35} />}
          </Fragment>
        );
      })}
    </div>
  );
}
