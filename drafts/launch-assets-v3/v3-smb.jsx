/* global React, V3Lockup, PlusPat */
/* hireon v3 — RU SMB-focused posters */

// SMB business types
const BIZ = [
  { emoji: null, label: "кафе",      ru: "кофейня",     pain: "ответить на отзыв на 2ГИС" },
  { emoji: null, label: "салон",     ru: "салон",       pain: "записать клиента в TG" },
  { emoji: null, label: "магазин",   ru: "магазин",     pain: "пост в Telegram-канал" },
  { emoji: null, label: "студия",    ru: "студия",      pain: "напомнить о визите" },
];

// Custom icon glyphs for each business (simple, line-art, no emoji)
function BizIcon({ kind, size = 64, color = "var(--hr-fg-1)" }) {
  const s = size;
  const sw = Math.max(1.6, size / 28);
  const ic = {
    "кафе": (
      <svg width={s} height={s} viewBox="0 0 64 64" fill="none">
        <path d="M14 22 H42 V44 Q42 52 32 52 Q22 52 22 52 Q14 50 14 42 Z" stroke={color} strokeWidth={sw} strokeLinejoin="round"/>
        <path d="M42 26 Q52 26 52 34 Q52 42 42 42" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
        <path d="M22 8 Q22 14 18 16" stroke={color} strokeWidth={sw} strokeLinecap="round" opacity="0.6"/>
        <path d="M30 8 Q30 14 26 16" stroke={color} strokeWidth={sw} strokeLinecap="round" opacity="0.6"/>
        <path d="M38 8 Q38 14 34 16" stroke={color} strokeWidth={sw} strokeLinecap="round" opacity="0.6"/>
      </svg>
    ),
    "салон": (
      <svg width={s} height={s} viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="22" r="10" stroke={color} strokeWidth={sw}/>
        <path d="M14 56 Q14 38 32 38 Q50 38 50 56" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
        <path d="M44 14 L50 8 M50 8 L46 18 M50 8 L40 12" stroke={color} strokeWidth={sw} strokeLinecap="round" opacity="0.7"/>
      </svg>
    ),
    "магазин": (
      <svg width={s} height={s} viewBox="0 0 64 64" fill="none">
        <path d="M12 22 H52 L48 14 H16 Z" stroke={color} strokeWidth={sw} strokeLinejoin="round"/>
        <path d="M14 22 V54 H50 V22" stroke={color} strokeWidth={sw} strokeLinejoin="round"/>
        <path d="M25 22 V32 H39 V22" stroke={color} strokeWidth={sw}/>
        <line x1="22" y1="44" x2="42" y2="44" stroke={color} strokeWidth={sw} strokeLinecap="round" opacity="0.6"/>
      </svg>
    ),
    "студия": (
      <svg width={s} height={s} viewBox="0 0 64 64" fill="none">
        <rect x="10" y="14" width="44" height="32" rx="2" stroke={color} strokeWidth={sw}/>
        <circle cx="32" cy="30" r="9" stroke={color} strokeWidth={sw}/>
        <circle cx="32" cy="30" r="3" fill={color}/>
        <line x1="22" y1="54" x2="42" y2="54" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
        <line x1="32" y1="46" x2="32" y2="54" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
        <circle cx="48" cy="20" r="1.5" fill={color}/>
      </svg>
    ),
  };
  return ic[kind] || ic["магазин"];
}

// ── S1: «Без разработчиков. Без интеграций.» 1080×1080 ─────────────────────
function V3PostNoDevs() {
  return (
    <div className="hr-grain" style={{
      position: "relative", width: 1080, height: 1080,
      background: "var(--hr-bg-base)", color: "var(--hr-fg-1)",
      fontFamily: "'Inter', system-ui, sans-serif",
      overflow: "hidden", isolation: "isolate",
    }}>
      <PlusPat color="rgba(241,235,224,0.05)" step={48} />
      <div style={{ position: "absolute", inset: 28, border: "1px solid var(--hr-border-1)", borderRadius: 18, zIndex: 2 }} />

      <div style={{
        position: "absolute", top: 56, left: 56, right: 56, zIndex: 3,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <V3Lockup size={24} />
        <span className="font-mono" style={{ fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--hr-fg-3)" }}>
          ─── для малого бизнеса
        </span>
      </div>

      {/* big editorial type — three lines, strike-through 'разработчиков' */}
      <div style={{ position: "absolute", top: 180, left: 56, right: 56, zIndex: 3 }}>
        <h1 className="font-heading" style={{
          margin: 0, fontSize: 124, fontWeight: 800,
          lineHeight: 0.95, letterSpacing: "-0.05em",
        }}>
          <span style={{ display: "block" }}>
            без{" "}
            <span style={{
              color: "var(--hr-fg-3)",
              textDecoration: "line-through",
              textDecorationColor: "var(--hr-teal)",
              textDecorationThickness: "6px",
              fontWeight: 500,
            }}>
              разработчиков
            </span>
          </span>
          <span style={{ display: "block", marginTop: 8 }}>
            без{" "}
            <span style={{
              color: "var(--hr-fg-3)",
              textDecoration: "line-through",
              textDecorationColor: "var(--hr-teal)",
              textDecorationThickness: "6px",
              fontWeight: 500,
            }}>
              интеграций
            </span>
          </span>
          <span style={{ display: "block", marginTop: 8 }}>
            без{" "}
            <span style={{
              color: "var(--hr-fg-3)",
              textDecoration: "line-through",
              textDecorationColor: "var(--hr-teal)",
              textDecorationThickness: "6px",
              fontWeight: 500,
            }}>
              ожидания
            </span>
          </span>
        </h1>
      </div>

      {/* footer line */}
      <div style={{
        position: "absolute", bottom: 56, left: 56, right: 56, zIndex: 3,
        paddingTop: 22, borderTop: "1px solid var(--hr-border-1)",
        display: "flex", justifyContent: "space-between", alignItems: "flex-end",
      }}>
        <div style={{ maxWidth: 720 }}>
          <span className="font-mono" style={{
            fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase",
            color: "var(--hr-teal)",
          }}>
            ↳ выбрал агента — работает в этот же день
          </span>
          <h2 style={{
            margin: "12px 0 0", fontSize: 26, fontWeight: 600, lineHeight: 1.35, color: "var(--hr-fg-1)",
          }}>
            готовые AI-сотрудники для кофейни, салона, магазина и студии.
          </h2>
        </div>
        <span className="font-mono" style={{
          padding: "12px 18px", background: "var(--hr-teal)", color: "var(--hr-teal-ink)",
          fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase",
          fontWeight: 500, borderRadius: 10, whiteSpace: "nowrap",
        }}>
          hireon.agency →
        </span>
      </div>
    </div>
  );
}

// ── S2: «Боли СМБ» — 4 examples in cards (1080×1080) ──────────────────────
function V3PostSMBPains() {
  const items = [
    {
      kind: "кафе",
      pain: "клиент написал отзыв на 2ГИС в 23:47",
      sub: "ответит сам, в тоне кафе, без матов и грубости",
      agent: "Ответы на отзывы 2ГИС",
      cat: "поддержка",
      catColor: "var(--hr-cat-support)",
    },
    {
      kind: "салон",
      pain: "за неделю — 32 заявки в Telegram",
      sub: "разберёт их, запишет в расписание, напомнит мастеру",
      agent: "Лид-квалификатор amoCRM",
      cat: "продажи",
      catColor: "var(--hr-cat-sales)",
    },
    {
      kind: "магазин",
      pain: "в Telegram-канале пусто две недели",
      sub: "опубликует посты по расписанию, в стиле бренда",
      agent: "Контент-копирайтер",
      cat: "контент",
      catColor: "var(--hr-cat-content)",
    },
    {
      kind: "студия",
      pain: "конкуренты опять что-то выкатили",
      sub: "проверит сайты и пришлёт утреннюю сводку",
      agent: "Мониторинг конкурентов",
      cat: "мониторинг",
      catColor: "var(--hr-cat-monitoring)",
    },
  ];

  return (
    <div className="hr-grain" style={{
      position: "relative", width: 1080, height: 1080,
      background: "var(--hr-bg-base)", color: "var(--hr-fg-1)",
      fontFamily: "'Inter', system-ui, sans-serif",
      overflow: "hidden", isolation: "isolate",
    }}>
      <PlusPat color="rgba(241,235,224,0.05)" step={48} />
      <div style={{ position: "absolute", inset: 28, border: "1px solid var(--hr-border-1)", borderRadius: 18, zIndex: 2 }} />

      <div style={{
        position: "absolute", top: 56, left: 56, right: 56, zIndex: 3,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <V3Lockup size={24} />
        <span className="font-mono" style={{ fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--hr-fg-3)" }}>
          ─── 4 рутины, 4 агента
        </span>
      </div>

      {/* title */}
      <div style={{ position: "absolute", top: 140, left: 56, right: 56, zIndex: 3 }}>
        <h1 className="font-heading" style={{
          margin: 0, fontSize: 64, lineHeight: 0.95, letterSpacing: "-0.04em", fontWeight: 800,
        }}>
          типичная неделя<br/>
          <span style={{ color: "var(--hr-teal)" }}>малого бизнеса</span>.
        </h1>
      </div>

      {/* 2x2 cards */}
      <div style={{
        position: "absolute", top: 320, left: 56, right: 56, bottom: 200, zIndex: 3,
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18,
      }}>
        {items.map((it) => (
          <div key={it.kind} style={{
            background: "var(--hr-bg-elev)",
            border: "1px solid var(--hr-border-1)",
            borderRadius: 14,
            padding: "22px 22px 20px",
            display: "flex", flexDirection: "column", gap: 12,
            position: "relative",
            overflow: "hidden",
          }}>
            {/* cat color accent line top */}
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: it.catColor }} />

            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
              <BizIcon kind={it.kind} size={42} color="var(--hr-fg-3)" />
              <span className="font-mono" style={{
                fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase",
                color: it.catColor,
                paddingTop: 6,
              }}>
                {it.kind}
              </span>
            </div>

            <p style={{
              margin: 0, fontSize: 18, lineHeight: 1.35, color: "var(--hr-fg-1)",
              fontWeight: 600, letterSpacing: "-0.01em",
            }}>
              {it.pain}
            </p>
            <p style={{
              margin: 0, fontSize: 13, lineHeight: 1.5, color: "var(--hr-fg-3)",
            }}>
              {it.sub}
            </p>

            <div style={{
              marginTop: "auto", display: "flex", alignItems: "center", gap: 10,
              paddingTop: 12, borderTop: "1px solid var(--hr-border-1)",
            }}>
              <span className="font-mono" style={{
                fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase",
                color: it.catColor,
              }}>
                ● {it.cat}
              </span>
              <span style={{ fontSize: 13, color: "var(--hr-fg-2)", fontWeight: 500 }}>
                {it.agent}
              </span>
              <span className="font-mono" style={{
                marginLeft: "auto", fontSize: 11, color: "var(--hr-fg-4)", letterSpacing: "0.1em",
              }}>
                →
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* footer */}
      <div style={{
        position: "absolute", bottom: 56, left: 56, right: 56, zIndex: 3,
        paddingTop: 22, borderTop: "1px solid var(--hr-border-1)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <p style={{ margin: 0, fontSize: 17, lineHeight: 1.4, color: "var(--hr-fg-2)", maxWidth: 700 }}>
          один маркетплейс, в котором уже есть готовые сотрудники под эти задачи.
        </p>
        <span className="font-mono" style={{
          padding: "12px 18px", background: "var(--hr-teal)", color: "var(--hr-teal-ink)",
          fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase",
          fontWeight: 500, borderRadius: 10, whiteSpace: "nowrap",
        }}>
          hireon.agency →
        </span>
      </div>
    </div>
  );
}

// ── S3: «Ответил клиенту, пока вы спали» — chat mockup (1080×1080) ────────
function V3PostChatStory() {
  return (
    <div className="hr-grain" style={{
      position: "relative", width: 1080, height: 1080,
      background: "var(--hr-bg-base)", color: "var(--hr-fg-1)",
      fontFamily: "'Inter', system-ui, sans-serif",
      overflow: "hidden", isolation: "isolate",
    }}>
      <PlusPat color="rgba(241,235,224,0.05)" step={48} />
      <div style={{ position: "absolute", inset: 28, border: "1px solid var(--hr-border-1)", borderRadius: 18, zIndex: 2 }} />

      <div style={{
        position: "absolute", top: 56, left: 56, right: 56, zIndex: 3,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <V3Lockup size={24} />
        <span className="font-mono" style={{ fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--hr-fg-3)" }}>
          ─── вторник · 23:47
        </span>
      </div>

      {/* big title */}
      <div style={{ position: "absolute", top: 130, left: 56, right: 56, zIndex: 3 }}>
        <h1 className="font-heading" style={{
          margin: 0, fontSize: 76, lineHeight: 0.95, letterSpacing: "-0.04em", fontWeight: 800,
        }}>
          ответил клиенту,<br/>
          <span style={{ color: "var(--hr-teal)" }}>пока вы спали</span>.
        </h1>
      </div>

      {/* chat mock */}
      <div style={{
        position: "absolute", top: 380, left: 80, right: 80, bottom: 200, zIndex: 3,
        background: "var(--hr-bg-elev)",
        border: "1px solid var(--hr-border-1)",
        borderRadius: 18,
        padding: "20px 22px",
        display: "flex", flexDirection: "column",
        overflow: "hidden",
      }}>
        {/* chat header */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          paddingBottom: 14, borderBottom: "1px solid var(--hr-border-1)",
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 99,
            background: "var(--hr-teal)", color: "var(--hr-teal-ink)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 700,
          }}>
            АИ
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--hr-fg-1)" }}>
              Ответы на отзывы 2ГИС · поддержка
            </div>
            <div className="font-mono" style={{
              fontSize: 10, letterSpacing: "0.14em", color: "var(--hr-fg-4)", textTransform: "uppercase", marginTop: 2,
            }}>
              ● онлайн
            </div>
          </div>
          <span className="font-mono" style={{
            marginLeft: "auto", fontSize: 10, letterSpacing: "0.14em", color: "var(--hr-fg-4)", textTransform: "uppercase",
          }}>
            2ГИС · отзыв
          </span>
        </div>

        {/* messages */}
        <div style={{
          flex: 1, display: "flex", flexDirection: "column", gap: 14, marginTop: 18,
        }}>
          {/* incoming */}
          <div style={{
            alignSelf: "flex-start", maxWidth: 560,
            background: "var(--hr-bg-elev-3)",
            color: "var(--hr-fg-2)",
            padding: "12px 16px", borderRadius: 14,
            borderTopLeftRadius: 4,
            fontSize: 15, lineHeight: 1.45,
          }}>
            «Заказали на дом, привезли холодное.<br/>Что за обслуживание, ребят?»
            <div className="font-mono" style={{ marginTop: 8, fontSize: 10, color: "var(--hr-fg-4)", letterSpacing: "0.1em" }}>
              23:47 · клиент
            </div>
          </div>

          {/* outgoing — agent reply */}
          <div style={{
            alignSelf: "flex-end", maxWidth: 560,
            background: "var(--hr-teal)",
            color: "var(--hr-teal-ink)",
            padding: "12px 16px", borderRadius: 14,
            borderTopRightRadius: 4,
            fontSize: 15, lineHeight: 1.45,
            fontWeight: 500,
          }}>
            Извините за остывший заказ — это правда не то, чего хочется. Напишите номер заказа, переделаем за наш счёт и привезём горячим в любое удобное время.
            <div className="font-mono" style={{
              marginTop: 8, fontSize: 10, letterSpacing: "0.1em", opacity: 0.8,
            }}>
              23:48 · агент
            </div>
          </div>

          {/* meta line */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 14,
            marginTop: "auto", paddingTop: 14,
            borderTop: "1px dashed var(--hr-border-1)",
          }}>
            <span className="font-mono" style={{ fontSize: 10, letterSpacing: "0.14em", color: "var(--hr-fg-4)", textTransform: "uppercase" }}>
              время ответа · 53 секунды
            </span>
            <span style={{ width: 4, height: 4, borderRadius: 99, background: "var(--hr-fg-4)" }} />
            <span className="font-mono" style={{ fontSize: 10, letterSpacing: "0.14em", color: "var(--hr-fg-4)", textTransform: "uppercase" }}>
              тон · бренд кофейни
            </span>
            <span style={{ width: 4, height: 4, borderRadius: 99, background: "var(--hr-fg-4)" }} />
            <span className="font-mono" style={{ fontSize: 10, letterSpacing: "0.14em", color: "var(--hr-teal)", textTransform: "uppercase" }}>
              без вмешательства
            </span>
          </div>
        </div>
      </div>

      {/* footer */}
      <div style={{
        position: "absolute", bottom: 56, left: 56, right: 56, zIndex: 3,
        paddingTop: 22, borderTop: "1px solid var(--hr-border-1)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <p style={{ margin: 0, fontSize: 17, lineHeight: 1.4, color: "var(--hr-fg-2)", maxWidth: 700 }}>
          агент <strong style={{ color: "var(--hr-fg-1)", fontWeight: 700 }}>Ответы на отзывы 2ГИС</strong> работает с отзывами на 2ГИС, Яндекс Картах и Telegram.
        </p>
        <span className="font-mono" style={{
          padding: "12px 18px", background: "var(--hr-teal)", color: "var(--hr-teal-ink)",
          fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase",
          fontWeight: 500, borderRadius: 10, whiteSpace: "nowrap",
        }}>
          hireon.agency →
        </span>
      </div>
    </div>
  );
}

// ── S4: Wide post — 1600×900 — «Не нужен разработчик» ──────────────────────
function V3PostNoDevWide() {
  return (
    <div className="hr-grain" style={{
      position: "relative", width: 1600, height: 900,
      background: "var(--hr-bg-base)", color: "var(--hr-fg-1)",
      fontFamily: "'Inter', system-ui, sans-serif",
      overflow: "hidden", isolation: "isolate",
    }}>
      <PlusPat color="rgba(241,235,224,0.04)" step={48} />
      <div style={{ position: "absolute", inset: 32, border: "1px solid var(--hr-border-1)", borderRadius: 18, zIndex: 2 }} />

      <div style={{
        position: "absolute", top: 56, left: 72, right: 72, zIndex: 3,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <V3Lockup size={26} />
        <span className="font-mono" style={{ fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--hr-fg-3)" }}>
          ─── для малого бизнеса
        </span>
      </div>

      <div style={{
        position: "absolute", inset: "130px 72px 100px 72px",
        display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: 64, zIndex: 3,
      }}>
        {/* LEFT — big copy */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <span className="font-mono" style={{
              fontSize: 13, letterSpacing: "0.22em", textTransform: "uppercase",
              color: "var(--hr-teal)",
            }}>
              ↳ для кофейни, салона, магазина, студии
            </span>
            <h1 className="font-heading" style={{
              margin: "26px 0 0", fontSize: 116, lineHeight: 0.92, letterSpacing: "-0.05em", fontWeight: 800,
            }}>
              без<br/>
              <span style={{
                color: "var(--hr-fg-3)", fontWeight: 500,
                textDecoration: "line-through",
                textDecorationColor: "var(--hr-teal)",
                textDecorationThickness: "6px",
              }}>
                разработчиков
              </span>.
            </h1>
            <p style={{
              margin: "26px 0 0", fontSize: 19, lineHeight: 1.5, color: "var(--hr-fg-2)", maxWidth: 540,
            }}>
              готовый AI-сотрудник, который отвечает клиентам, пишет посты и ведёт расписание. подключается за минуты — не за месяцы.
            </p>
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
            <span className="font-mono" style={{
              padding: "14px 22px", background: "var(--hr-teal)", color: "var(--hr-teal-ink)",
              fontSize: 13, letterSpacing: "0.18em", textTransform: "uppercase",
              fontWeight: 500, borderRadius: 10,
            }}>
              hireon.agency →
            </span>
            <span className="font-mono" style={{
              padding: "14px 22px", color: "var(--hr-fg-1)",
              border: "1px solid var(--hr-border-2)",
              fontSize: 13, letterSpacing: "0.18em", textTransform: "uppercase",
              borderRadius: 10,
            }}>
              посмотреть каталог
            </span>
          </div>
        </div>

        {/* RIGHT — 4 biz icons in a column */}
        <div style={{
          background: "var(--hr-bg-elev)",
          border: "1px solid var(--hr-border-1)",
          borderRadius: 16,
          padding: "26px 30px",
          display: "flex", flexDirection: "column", gap: 0,
        }}>
          <div className="font-mono" style={{
            fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase",
            color: "var(--hr-fg-4)", marginBottom: 16,
            paddingBottom: 14, borderBottom: "1px solid var(--hr-border-1)",
          }}>
            кто покупает / типичный день
          </div>
          {[
            ["кофейня", "отвечает на отзыв на 2ГИС"],
            ["салон",   "разбирает заявки и записывает"],
            ["магазин", "публикует посты в Telegram"],
            ["студия",  "следит за конкурентами"],
          ].map(([k, v], i, arr) => (
            <div key={k} style={{
              display: "flex", alignItems: "center", gap: 18,
              padding: "16px 0",
              borderBottom: i < arr.length - 1 ? "1px solid var(--hr-border-1)" : "none",
            }}>
              <BizIcon kind={k === "кофейня" ? "кафе" : k} size={44} color="var(--hr-teal)" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 600, color: "var(--hr-fg-1)", letterSpacing: "-0.01em" }}>
                  {k}
                </div>
                <div className="font-mono" style={{
                  marginTop: 2, fontSize: 12, color: "var(--hr-fg-3)", letterSpacing: "0.04em",
                }}>
                  ↳ {v}
                </div>
              </div>
              <span className="font-mono" style={{ fontSize: 11, color: "var(--hr-fg-4)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
                → агент
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  BizIcon, BIZ,
  V3PostNoDevs, V3PostSMBPains, V3PostChatStory, V3PostNoDevWide,
});
