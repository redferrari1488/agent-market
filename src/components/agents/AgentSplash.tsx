"use client";

import { useEffect, useRef, useState } from "react";

export function AgentSplash({
  onSubmit,
  onBrowse,
}: {
  onSubmit: (q: string) => void;
  onBrowse: () => void;
}) {
  const [query, setQuery] = useState("");
  const [phase, setPhase] = useState(0);
  const [exiting, setExiting] = useState(false);
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setPhase(1), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (phase !== 1) return;
    const t = setTimeout(() => taRef.current?.focus({ preventScroll: true }), 600);
    return () => clearTimeout(t);
  }, [phase]);

  const submit = () => {
    setExiting(true);
    setTimeout(() => onSubmit(query.trim()), 360);
  };

  const browse = () => {
    setExiting(true);
    setTimeout(() => onBrowse(), 360);
  };

  return (
    <div
      className={`relative isolate flex min-h-[calc(100vh-72px)] flex-col items-center justify-center px-5 py-10 sm:py-16 ${
        exiting ? "agent-splash-out" : "agent-splash-in"
      }`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 50%, black 30%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 60% at 50% 50%, black 30%, transparent 100%)",
        }}
      />

      <div className="relative w-full max-w-[560px]">
        <div
          className="splash-fade text-center font-mono text-[12px] tracking-[0.18em] text-muted-foreground/55 sm:text-[11px]"
          style={{ animationDelay: "0.1s" }}
        >
          hireon / agents
        </div>

        <h1
          className="splash-fade mt-7 text-center font-extrabold leading-[1.05] tracking-[-0.025em] sm:mt-10"
          style={{
            animationDelay: "0.2s",
            fontSize: "clamp(28px, 6vw, 48px)",
          }}
        >
          Что хотите
          <br />
          <span className="text-primary">автоматизировать?</span>
        </h1>

        <p
          className="splash-fade mx-auto mt-3 max-w-md text-center text-[14px] leading-relaxed text-muted-foreground/85 sm:text-[15px]"
          style={{ animationDelay: "0.32s" }}
        >
          Опишите задачу — подберём подходящих агентов
        </p>

        <div
          className="splash-fade relative mt-7 sm:mt-9"
          style={{ animationDelay: "0.44s" }}
        >
          <textarea
            ref={taRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="например: клиенты пишут в Telegram, а никто не отвечает ночью..."
            rows={3}
            className="splash-textarea w-full resize-none rounded-[2px] border border-border/60 bg-card/60 px-4 py-3.5 text-[14px] leading-relaxed text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground/45 focus:border-primary/40 focus:shadow-[0_0_0_1px_rgba(56,189,248,0.18),0_8px_32px_rgba(0,0,0,0.35)] sm:px-[18px] sm:py-4 sm:text-[15px]"
          />

          <button
            type="button"
            onClick={submit}
            className="absolute bottom-2.5 right-2.5 inline-flex items-center rounded-[2px] border px-3 py-1.5 font-mono text-[12px] tracking-[0.05em] transition-colors sm:bottom-3 sm:right-3"
            style={{
              background: query.trim()
                ? "var(--primary)"
                : "color-mix(in oklch, var(--primary) 12%, transparent)",
              color: query.trim() ? "#0a0a09" : "var(--primary)",
              borderColor: "color-mix(in oklch, var(--primary) 35%, transparent)",
            }}
          >
            {query.trim() ? "подобрать →" : "все агенты →"}
          </button>
        </div>

        <div
          className="splash-fade mt-7 text-center sm:mt-8"
          style={{ animationDelay: "0.6s" }}
        >
          <button
            type="button"
            onClick={browse}
            className="font-mono text-[12px] tracking-[0.05em] text-muted-foreground/50 transition-colors hover:text-muted-foreground sm:text-[11px]"
            style={{
              borderBottom: "1px solid rgba(232,232,236,0.12)",
              paddingBottom: 1,
            }}
          >
            посмотреть каталог AI-агентов
          </button>
        </div>
      </div>

      <style jsx>{`
        .splash-fade {
          opacity: 0;
          animation: splashFadeUp 0.7s cubic-bezier(0.2, 0.7, 0.2, 1) forwards;
        }
        .agent-splash-in {
          animation: splashIn 0.4s ease forwards;
        }
        .agent-splash-out {
          animation: splashOut 0.36s cubic-bezier(0.4, 0, 1, 1) forwards;
        }
        @keyframes splashFadeUp {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes splashIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes splashOut {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(-22px);
          }
        }
      `}</style>
    </div>
  );
}
