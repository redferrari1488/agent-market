"use client";

// ContentWriterMock — browser-chrome. Копирайтер печатает черновик поста вживую
// в CMS: заголовок проявляется → 2 параграфа печатаются с мигающей кареткой.
// slug: content-writer. Ширина 380, но maxWidth:100% — чтобы не переполнять
// demo-панель на мобиле (Shell складывается в 1 колонку <880px).

import { useEffect, useState } from "react";
import { MONO, SANS } from "./shared";

const P1 =
  "Клиенты ждут ответа здесь и сейчас. Автоответы в чатах и почте снимают до 60% типовых обращений ещё до того, как их увидит менеджер.";
const P2 =
  "Начните с шаблонов под три сценария: статус заказа, возврат и оплата. Дальше подключайте ИИ — он подберёт тон под конкретного клиента.";

export function ContentWriterMock({
  accent,
  reducedMotion,
}: {
  accent: string;
  reducedMotion: boolean;
}) {
  const total = P1.length + P2.length;
  const [c, setC] = useState(reducedMotion ? total : 0);
  const [titleIn, setTitleIn] = useState(reducedMotion);

  useEffect(() => {
    if (reducedMotion) {
      setC(total);
      setTitleIn(true);
      return;
    }
    let alive = true;
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    const wait = (ms: number) =>
      new Promise<void>((r) => {
        const id = setTimeout(r, ms);
        timeouts.push(id);
      });
    (async function run() {
      for (let loop = 0; loop < 2 && alive; loop++) {
        setC(0);
        setTitleIn(false);
        await wait(250);
        setTitleIn(true);
        await wait(550);
        for (let i = 1; i <= total && alive; i++) {
          setC(i);
          await wait(i === P1.length ? 480 : 20 + Math.random() * 26);
        }
        await wait(1500);
      }
      if (alive) {
        setC(total);
        setTitleIn(true);
      }
    })();
    return () => {
      alive = false;
      timeouts.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

  const t1 = P1.slice(0, Math.min(c, P1.length));
  const t2 = P2.slice(0, Math.max(0, c - P1.length));
  const caretInP1 = c <= P1.length;

  const caret = (
    <span
      style={{
        display: "inline-block",
        width: 2,
        height: "0.95em",
        background: accent,
        marginLeft: 1,
        transform: "translateY(2px)",
        animation: "cwCaret 1s steps(1) infinite",
      }}
    />
  );

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 12,
      }}
    >
      <style>{`@keyframes cwCaret{0%,50%{opacity:1}51%,100%{opacity:0}}`}</style>
      <div
        style={{
          width: 380,
          maxWidth: "100%",
          borderRadius: 8,
          background: "#161412",
          overflow: "hidden",
          boxShadow: "0 24px 60px rgba(0,0,0,.55), 0 0 0 8px #0c0b09",
          outline: "1px solid rgba(255,255,255,.06)",
          fontFamily: SANS,
        }}
      >
        <div
          style={{
            background: "#1f1c19",
            padding: "9px 12px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            borderBottom: "1px solid rgba(255,255,255,.05)",
          }}
        >
          <div style={{ display: "flex", gap: 6 }}>
            {["#ff5f57", "#febc2e", "#28c840"].map((col) => (
              <span
                key={col}
                style={{ width: 11, height: 11, borderRadius: "50%", background: col, opacity: 0.9 }}
              />
            ))}
          </div>
          <div
            style={{
              flex: 1,
              marginLeft: 6,
              background: "#0e0c0a",
              borderRadius: 6,
              padding: "5px 10px",
              display: "flex",
              alignItems: "center",
              gap: 7,
              border: "1px solid rgba(255,255,255,.04)",
            }}
          >
            <span style={{ width: 9, height: 9, borderRadius: 2, border: "1.5px solid #6b7280" }} />
            <span style={{ fontFamily: MONO, fontSize: 11, color: "#9aa2a9" }}>
              blog.tvoybrand.ru/<span style={{ color: "#d8d4cf" }}>draft</span>
            </span>
          </div>
        </div>
        <div style={{ padding: "20px 22px 26px", minHeight: 210, background: "#161412" }}>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 10,
              color: accent,
              letterSpacing: ".5px",
              marginBottom: 12,
              textTransform: "uppercase",
              opacity: 0.85,
            }}
          >
            Черновик · автосохранён
          </div>
          <h1
            style={{
              fontFamily: SANS,
              fontSize: 21,
              lineHeight: 1.2,
              fontWeight: 700,
              color: "#efece8",
              margin: 0,
              opacity: titleIn ? 1 : 0,
              transform: titleIn ? "none" : "translateY(6px)",
              transition: "all .5s ease",
            }}
          >
            5 способов автоматизировать ответы клиентам
          </h1>
          <p
            style={{
              fontFamily: SANS,
              fontSize: 13.5,
              lineHeight: 1.65,
              color: "#b9b4ad",
              margin: "16px 0 0",
            }}
          >
            {t1}
            {caretInP1 && t1.length > 0 && caret}
          </p>
          {t2.length > 0 && (
            <p
              style={{
                fontFamily: SANS,
                fontSize: 13.5,
                lineHeight: 1.65,
                color: "#b9b4ad",
                margin: "12px 0 0",
              }}
            >
              {t2}
              {!caretInP1 && caret}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
