"use client";

// V3 demo registry — slug → demo рендер + конфиг.
// Каждый агент с V3-карточкой регистрируется здесь. Демо-компонент знает,
// как нарисовать свой контент (TG-mock, browser-mock, CRM-card, etc.).
// Когда добавляешь нового агента — создаёшь *Mock.tsx + строку в DEMOS.

import type { ReactNode } from "react";
import { TelegramReviewMock } from "./TelegramReviewMock";

export type DemoRenderContext = {
  restartTrigger: number;
  reducedMotion: boolean;
  accent: string;
};

export type DemoConfig = {
  // "● running · X%" в правом верхнем углу demo-панели.
  // Hardcode пока БД не хранит uptime per agent.
  uptime: string;
  // Подпись eyebrow слева ("демо · live" / "превью" / "симуляция").
  eyebrowLabel?: string;
  // Подпись под demo-моком (опционально).
  caption?: string;
  // Рендерер контента левой панели.
  render: (ctx: DemoRenderContext) => ReactNode;
};

const REVIEW_RESPONDER_DEMO: DemoConfig = {
  uptime: "99.94",
  render: ({ restartTrigger, reducedMotion, accent }) => (
    <TelegramReviewMock
      key={restartTrigger}
      accent={accent}
      reducedMotion={reducedMotion}
      review={{
        author: "клиент",
        time: "23:47",
        text: "Заказали на дом — привезли холодное. Что за обслуживание?",
      }}
      reply={{
        author: "агент",
        time: "23:48",
        text:
          "Извините за остывший заказ — это правда не то, чего хочется. Напишите номер заказа, переделаем за наш счёт.",
      }}
    />
  ),
};

export const DEMOS: Record<string, DemoConfig> = {
  "review-responder-2gis": REVIEW_RESPONDER_DEMO,
};

export const V3_SLUGS = new Set(Object.keys(DEMOS));

export function getDemoConfig(slug: string): DemoConfig | null {
  return DEMOS[slug] ?? null;
}
