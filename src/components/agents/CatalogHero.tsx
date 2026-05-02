"use client";

import { HeroAmbient } from "./HeroAmbient";
import { FadeIn } from "@/components/motion";

function pluralize(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 19) return "агентов";
  if (mod10 === 1) return "агент";
  if (mod10 >= 2 && mod10 <= 4) return "агента";
  return "агентов";
}

export function CatalogHero({ totalCount }: { totalCount: number }) {
  return (
    <section className="relative -mx-5 overflow-hidden px-5 py-14 sm:-mx-6 sm:px-6 sm:py-20">
      <HeroAmbient />

      <FadeIn>
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground/60">
            каталог{" "}
            <span className="text-muted-foreground/40">·</span>{" "}
            <span className="text-muted-foreground tabular-nums">
              {totalCount} {pluralize(totalCount)}
            </span>
          </p>

          <h1 className="mt-5 text-[clamp(2rem,5vw,3.5rem)] font-semibold leading-[1.05] tracking-[-0.03em]">
            Готовые агенты
          </h1>

          <p className="mx-auto mt-5 max-w-lg text-[15px] leading-relaxed text-muted-foreground">
            Выберите агента по задаче. Подключайте за минуту - работает 24/7
            без вашего участия.
          </p>
        </div>
      </FadeIn>
    </section>
  );
}
