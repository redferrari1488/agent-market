"use client";

import { useEffect, useState } from "react";
import { Palette, X } from "lucide-react";

type PalettePreset = {
  id: string;
  name: string;
  vars: Record<string, string>;
};

const STORAGE_KEY = "dev-palette";
const STYLE_ID = "dev-palette-style";
const DEFAULT_PALETTE_ID = "violet";

const palettes: PalettePreset[] = [
  {
    id: "violet",
    name: "Violet (default)",
    vars: {
      "--background": "#06060a",
      "--foreground": "#f4f4f8",
      "--card": "#0e0e16",
      "--card-foreground": "#f4f4f8",
      "--popover": "#0e0e16",
      "--popover-foreground": "#f4f4f8",
      "--primary": "#8b5cf6",
      "--primary-foreground": "#ffffff",
      "--secondary": "#13131d",
      "--secondary-foreground": "#f4f4f8",
      "--muted": "#13131d",
      "--muted-foreground": "#a1a1b2",
      "--accent": "#1a1a2e",
      "--accent-foreground": "#f4f4f8",
      "--destructive": "#ef4444",
      "--border": "#2a2a42",
      "--input": "#1e1e30",
      "--ring": "#8b5cf6",
      "--chart-1": "#8b5cf6",
      "--chart-2": "#3b82f6",
      "--chart-3": "#10b981",
      "--chart-4": "#f59e0b",
      "--chart-5": "#ef4444",
      "--sidebar": "#0e0e16",
      "--sidebar-foreground": "#e8e8ed",
      "--sidebar-primary": "#8b5cf6",
      "--sidebar-primary-foreground": "#ffffff",
      "--sidebar-accent": "#1a1a2e",
      "--sidebar-accent-foreground": "#e8e8ed",
      "--sidebar-border": "#1e1e30",
      "--sidebar-ring": "#8b5cf6",
    },
  },
  {
    id: "mono",
    name: "Mono",
    vars: {
      "--background": "#000000",
      "--foreground": "#ededed",
      "--card": "#0a0a0a",
      "--card-foreground": "#ededed",
      "--popover": "#0a0a0a",
      "--popover-foreground": "#ededed",
      "--primary": "#ededed",
      "--primary-foreground": "#000000",
      "--secondary": "#111111",
      "--secondary-foreground": "#ededed",
      "--muted": "#111111",
      "--muted-foreground": "#a1a1aa",
      "--accent": "#1a1a1a",
      "--accent-foreground": "#ededed",
      "--destructive": "#ef4444",
      "--border": "#262626",
      "--input": "#262626",
      "--ring": "#ededed",
      "--chart-1": "#fafafa",
      "--chart-2": "#d4d4d8",
      "--chart-3": "#a3a3a3",
      "--chart-4": "#737373",
      "--chart-5": "#525252",
      "--sidebar": "#0a0a0a",
      "--sidebar-foreground": "#ededed",
      "--sidebar-primary": "#ededed",
      "--sidebar-primary-foreground": "#000000",
      "--sidebar-accent": "#1a1a1a",
      "--sidebar-accent-foreground": "#ededed",
      "--sidebar-border": "#262626",
      "--sidebar-ring": "#ededed",
    },
  },
  {
    id: "emerald",
    name: "Emerald",
    vars: {
      "--background": "#040a08",
      "--foreground": "#ecfdf5",
      "--card": "#061612",
      "--card-foreground": "#ecfdf5",
      "--popover": "#061612",
      "--popover-foreground": "#ecfdf5",
      "--primary": "#10b981",
      "--primary-foreground": "#04120c",
      "--secondary": "#0a1f17",
      "--secondary-foreground": "#ecfdf5",
      "--muted": "#0a1f17",
      "--muted-foreground": "#9ab5ab",
      "--accent": "#0f2e22",
      "--accent-foreground": "#ecfdf5",
      "--destructive": "#f87171",
      "--border": "#1a3a2c",
      "--input": "#1a3a2c",
      "--ring": "#10b981",
      "--chart-1": "#10b981",
      "--chart-2": "#34d399",
      "--chart-3": "#6ee7b7",
      "--chart-4": "#f59e0b",
      "--chart-5": "#f87171",
      "--sidebar": "#061612",
      "--sidebar-foreground": "#ecfdf5",
      "--sidebar-primary": "#10b981",
      "--sidebar-primary-foreground": "#04120c",
      "--sidebar-accent": "#0f2e22",
      "--sidebar-accent-foreground": "#ecfdf5",
      "--sidebar-border": "#1a3a2c",
      "--sidebar-ring": "#10b981",
    },
  },
  {
    id: "amber",
    name: "Amber",
    vars: {
      "--background": "#0a0705",
      "--foreground": "#fef3c7",
      "--card": "#13100a",
      "--card-foreground": "#fef3c7",
      "--popover": "#13100a",
      "--popover-foreground": "#fef3c7",
      "--primary": "#f59e0b",
      "--primary-foreground": "#1a0f00",
      "--secondary": "#1c170e",
      "--secondary-foreground": "#fef3c7",
      "--muted": "#1c170e",
      "--muted-foreground": "#b8a580",
      "--accent": "#2a2014",
      "--accent-foreground": "#fef3c7",
      "--destructive": "#f87171",
      "--border": "#3a2e1c",
      "--input": "#3a2e1c",
      "--ring": "#f59e0b",
      "--chart-1": "#f59e0b",
      "--chart-2": "#fbbf24",
      "--chart-3": "#fde68a",
      "--chart-4": "#fb7185",
      "--chart-5": "#f87171",
      "--sidebar": "#13100a",
      "--sidebar-foreground": "#fef3c7",
      "--sidebar-primary": "#f59e0b",
      "--sidebar-primary-foreground": "#1a0f00",
      "--sidebar-accent": "#2a2014",
      "--sidebar-accent-foreground": "#fef3c7",
      "--sidebar-border": "#3a2e1c",
      "--sidebar-ring": "#f59e0b",
    },
  },
  {
    id: "blue",
    name: "Blue",
    vars: {
      "--background": "#04060d",
      "--foreground": "#eef2ff",
      "--card": "#0a0f1c",
      "--card-foreground": "#eef2ff",
      "--popover": "#0a0f1c",
      "--popover-foreground": "#eef2ff",
      "--primary": "#3b82f6",
      "--primary-foreground": "#ffffff",
      "--secondary": "#0f1628",
      "--secondary-foreground": "#eef2ff",
      "--muted": "#0f1628",
      "--muted-foreground": "#9aa5c4",
      "--accent": "#15213d",
      "--accent-foreground": "#eef2ff",
      "--destructive": "#f87171",
      "--border": "#1e2d50",
      "--input": "#1e2d50",
      "--ring": "#3b82f6",
      "--chart-1": "#3b82f6",
      "--chart-2": "#60a5fa",
      "--chart-3": "#93c5fd",
      "--chart-4": "#c084fc",
      "--chart-5": "#f87171",
      "--sidebar": "#0a0f1c",
      "--sidebar-foreground": "#eef2ff",
      "--sidebar-primary": "#3b82f6",
      "--sidebar-primary-foreground": "#ffffff",
      "--sidebar-accent": "#15213d",
      "--sidebar-accent-foreground": "#eef2ff",
      "--sidebar-border": "#1e2d50",
      "--sidebar-ring": "#3b82f6",
    },
  },
];

function getStyleElement() {
  const existing = document.getElementById(STYLE_ID);
  if (existing instanceof HTMLStyleElement) {
    return existing;
  }

  const style = document.createElement("style");
  style.id = STYLE_ID;
  document.head.appendChild(style);
  return style;
}

function applyPaletteVars(vars: Record<string, string>) {
  const style = getStyleElement();
  const declarations = Object.entries(vars)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join("\n");

  style.textContent = `html.dark {\n${declarations}\n}`;
}

function clearPaletteVars() {
  document.getElementById(STYLE_ID)?.remove();
}

export function PaletteSwitcher() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(() => {
    if (typeof window === "undefined") {
      return DEFAULT_PALETTE_ID;
    }

    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved && palettes.some((palette) => palette.id === saved)) {
      return saved;
    }

    return DEFAULT_PALETTE_ID;
  });

  function applyPalette(id: string) {
    if (!palettes.some((palette) => palette.id === id)) {
      return;
    }

    if (id === DEFAULT_PALETTE_ID) {
      localStorage.removeItem(STORAGE_KEY);
      setActive(DEFAULT_PALETTE_ID);
      return;
    }

    localStorage.setItem(STORAGE_KEY, id);
    setActive(id);
  }

  function resetPalette() {
    clearPaletteVars();
    localStorage.removeItem(STORAGE_KEY);
    setActive(DEFAULT_PALETTE_ID);
  }

  useEffect(() => {
    if (active === DEFAULT_PALETTE_ID) {
      clearPaletteVars();
      return;
    }

    const palette = palettes.find((item) => item.id === active);
    if (!palette) {
      clearPaletteVars();
      localStorage.removeItem(STORAGE_KEY);
      return;
    }

    applyPaletteVars(palette.vars);
  }, [active]);

  return (
    <div className="fixed bottom-5 right-5 z-[100]">
      {open && (
        <div className="mb-3 w-64 overflow-hidden rounded-xl border border-border bg-card shadow-2xl shadow-black/40">
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              Dev - Palette
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="p-2">
            {palettes.map((palette) => (
              <button
                key={palette.id}
                type="button"
                onClick={() => applyPalette(palette.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] transition-colors ${
                  active === palette.id
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                }`}
              >
                <span
                  className="h-4 w-4 shrink-0 rounded-full border border-border"
                  style={{ backgroundColor: palette.vars["--primary"] }}
                />
                <span className="flex-1 truncate">{palette.name}</span>
                {active === palette.id && (
                  <span className="font-mono text-[10px] text-muted-foreground">
                    active
                  </span>
                )}
              </button>
            ))}
            <button
              type="button"
              onClick={resetPalette}
              className="mt-1 w-full rounded-lg px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
            >
              Reset to default
            </button>
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-xl shadow-black/30 transition-colors hover:text-foreground"
        aria-label="Palette switcher"
        aria-pressed={open}
      >
        <Palette className="h-4 w-4" />
      </button>
    </div>
  );
}
