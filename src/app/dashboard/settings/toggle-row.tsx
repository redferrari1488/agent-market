"use client";

import { useState } from "react";

export function SettingsToggleRow({
  label,
  channel,
  defaultOn,
  last,
}: {
  label: string;
  channel: string;
  defaultOn: boolean;
  last?: boolean;
}) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div
      className={`flex items-center justify-between gap-4 px-5 py-4 ${
        last ? "" : "border-b border-[rgba(244,236,222,0.06)]"
      }`}
    >
      <div className="grid flex-1 grid-cols-1 items-center gap-1.5 sm:grid-cols-[160px_1fr] sm:gap-4">
        <span className="font-mono text-[10.5px] font-medium uppercase tracking-[0.1em] text-[rgba(241,235,224,0.36)]">
          {label}
        </span>
        <span className="text-[14px] text-[var(--hc-fg,#f1ebe0)]">
          {channel}
        </span>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => setOn((v) => !v)}
        className={`relative h-5 w-9 shrink-0 rounded-full border transition-[background,border-color] ${
          on
            ? "border-[oklch(0.74_0.13_195)] bg-[oklch(0.74_0.13_195_/_0.18)]"
            : "border-[rgba(244,236,222,0.10)] bg-[#1f1c19]"
        }`}
      >
        <span
          className={`absolute top-[1px] left-[1px] h-[14px] w-[14px] rounded-full transition-[transform,background] ${
            on
              ? "translate-x-[16px] bg-[oklch(0.74_0.13_195)]"
              : "translate-x-0 bg-[rgba(241,235,224,0.56)]"
          }`}
        />
      </button>
    </div>
  );
}
