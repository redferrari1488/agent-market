"use client";

import { useEffect, useRef } from "react";

export function HeroAmbient() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0;
    let H = 0;
    let raf = 0;
    let t = 0;

    const resize = () => {
      W = canvas.offsetWidth;
      H = canvas.offsetHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.matchMedia("(max-width: 640px)").matches;
    const STEP = mobile ? 56 : 40;

    const drawFrame = () => {
      ctx.clearRect(0, 0, W, H);
      const cols = Math.ceil(W / STEP) + 1;
      const rows = Math.ceil(H / STEP) + 1;
      const cx = W / 2;
      const cy = H / 2;
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          const x = c * STEP;
          const y = r * STEP;
          const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
          const wave = Math.sin(dist * 0.02 - t * 0.8) * 0.5 + 0.5;
          const a = wave * 0.12 + 0.02;
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(139,92,246,${a})`;
          ctx.fill();
        }
      }
    };

    if (reduceMotion) {
      drawFrame();
    } else {
      const loop = () => {
        drawFrame();
        t += 0.016;
        raf = requestAnimationFrame(loop);
      };
      loop();
    }

    const ro = new ResizeObserver(() => {
      resize();
      if (reduceMotion) drawFrame();
    });
    ro.observe(canvas);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
