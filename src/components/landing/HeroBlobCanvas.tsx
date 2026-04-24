"use client";

import { useEffect, useRef } from "react";

type Blob = {
  ox: number;
  oy: number;
  orR: number;
  orRy: number;
  angle: number;
  spd: number;
  sz: number;
  r: number;
  g: number;
  b: number;
  a: number;
};

const BLOBS: readonly Blob[] = [
  { ox: 0.55, oy: 0.30, orR: 0.20, orRy: 0.15, angle: 0.0, spd: 0.0022, sz: 0.68, r: 37, g: 99, b: 235, a: 0.56 },
  { ox: 0.38, oy: 0.55, orR: 0.18, orRy: 0.14, angle: 2.1, spd: -0.0018, sz: 0.56, r: 99, g: 102, b: 241, a: 0.48 },
  { ox: 0.72, oy: 0.58, orR: 0.16, orRy: 0.13, angle: 4.3, spd: 0.0028, sz: 0.48, r: 6, g: 182, b: 212, a: 0.42 },
  { ox: 0.48, oy: 0.35, orR: 0.22, orRy: 0.18, angle: 1.5, spd: -0.0015, sz: 0.62, r: 96, g: 165, b: 250, a: 0.36 },
];

export function HeroBlobCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const blobs = BLOBS.map((b) => ({ ...b }));

    let W = 0;
    let H = 0;
    let raf = 0;

    function resize() {
      const parent = canvas!.parentElement;
      if (!parent) return;
      W = parent.offsetWidth;
      H = parent.offsetHeight;
      if (!W || !H) return;
      canvas!.width = Math.floor(W * dpr);
      canvas!.height = Math.floor(H * dpr);
      canvas!.style.width = `${W}px`;
      canvas!.style.height = `${H}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw() {
      if (!W || !H) {
        resize();
        if (!W || !H) {
          raf = requestAnimationFrame(draw);
          return;
        }
      }
      ctx!.clearRect(0, 0, W, H);

      for (const b of blobs) {
        b.angle += b.spd;
        const x = (b.ox + Math.cos(b.angle) * b.orR) * W;
        const y = (b.oy + Math.sin(b.angle) * b.orRy) * H;
        const size = b.sz * Math.max(W, H) * 0.52;

        ctx!.save();
        ctx!.filter = "blur(42px)";
        const g = ctx!.createRadialGradient(x, y, 0, x, y, size);
        g.addColorStop(0, `rgba(${b.r},${b.g},${b.b},${b.a})`);
        g.addColorStop(0.4, `rgba(${b.r},${b.g},${b.b},${(b.a * 0.5).toFixed(3)})`);
        g.addColorStop(1, `rgba(${b.r},${b.g},${b.b},0)`);
        ctx!.beginPath();
        ctx!.arc(x, y, size, 0, Math.PI * 2);
        ctx!.fillStyle = g;
        ctx!.fill();
        ctx!.restore();
      }

      if (!reduceMotion) raf = requestAnimationFrame(draw);
    }

    resize();
    draw();

    const onResize = () => resize();
    window.addEventListener("resize", onResize, { passive: true });

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
      } else if (!reduceMotion) {
        raf = requestAnimationFrame(draw);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 hidden overflow-hidden sm:block"
      style={{
        maskImage: "linear-gradient(to right, transparent 0%, black 22%, black 100%)",
        WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 22%, black 100%)",
      }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
