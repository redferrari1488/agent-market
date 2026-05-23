/* global React, V3Lockup, PlusPat */
/* hireon × lock-in v3 — friendly, handmade, sms — NO «OFFICIAL COLLAB» */

const LI_ORANGE = "#ff5722";
const LI_ORANGE_DEEP = "#c53d12";
const LI_INK = "#0e0a08";

// LOCK·IN wordmark (recreated from their site logo)
function LIMark({ size = 64, color = "#f1ebe0", accent = LI_ORANGE, weight = 800 }) {
  return (
    <span style={{
      fontFamily: "'Geist', 'Inter', system-ui, sans-serif",
      fontWeight: weight,
      fontSize: size,
      letterSpacing: "0.04em",
      color,
      display: "inline-flex", alignItems: "center",
      gap: `${size * 0.18}px`,
      lineHeight: 1,
    }}>
      <span style={{ color: accent, fontWeight: 400, fontSize: size * 1.08 }}>[</span>
      <span>LOCK</span>
      <span style={{ color: accent, fontSize: size * 1.1, lineHeight: 0.6 }}>·</span>
      <span>IN</span>
      <span style={{ color: accent, fontWeight: 400, fontSize: size * 1.08 }}>]</span>
    </span>
  );
}

// hire.on wordmark (full)
function HireOnMark({ size = 64, color = "var(--hr-fg-1)", dotColor = "var(--hr-teal)" }) {
  return (
    <span className="hr-logo" style={{
      fontSize: size, color, lineHeight: 0.85, letterSpacing: "-0.055em",
    }}>
      <span>hire</span><span style={{ color: dotColor }}>.</span><span>on</span>
    </span>
  );
}

// ── L1: Chat bubbles — sms-style "say hi" (1080×1080) ─────────────────────
function V3LockinChat() {
  return (
    <div className="hr-grain" style={{
      position: "relative", width: 1080, height: 1080,
      background: "var(--hr-bg-base)", color: "var(--hr-fg-1)",
      fontFamily: "'Inter', system-ui, sans-serif",
      overflow: "hidden", isolation: "isolate",
    }}>
      <PlusPat color="rgba(241,235,224,0.04)" step={48} />
      <div style={{ position: "absolute", inset: 28, border: "1px solid var(--hr-border-1)", borderRadius: 18, zIndex: 2 }} />

      {/* top */}
      <div style={{
        position: "absolute", top: 56, left: 56, right: 56, zIndex: 3,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span className="font-mono" style={{ fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--hr-fg-3)" }}>
          ─── привет, ребята
        </span>
        <span className="font-mono" style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--hr-fg-4)" }}>
          вторник · 14:22
        </span>
      </div>

      {/* title */}
      <div style={{ position: "absolute", top: 130, left: 56, right: 56, zIndex: 3 }}>
        <h1 className="font-heading" style={{
          margin: 0, fontSize: 70, lineHeight: 0.95, letterSpacing: "-0.04em", fontWeight: 800,
        }}>
          собрались делать<br/>
          <span style={{ color: "var(--hr-teal)" }}>что-то</span> вместе<span style={{ color: "var(--hr-teal)" }}>.</span>
        </h1>
      </div>

      {/* chat bubbles */}
      <div style={{
        position: "absolute", top: 380, left: 80, right: 80, bottom: 200, zIndex: 3,
        display: "flex", flexDirection: "column", gap: 16,
        overflow: "hidden",
      }}>
        {/* from lock-in (left, orange tint) */}
        <div style={{
          alignSelf: "flex-start", maxWidth: 560,
          background: "rgba(255,87,34,0.10)",
          border: "1px solid rgba(255,87,34,0.30)",
          padding: "16px 20px", borderRadius: 18, borderTopLeftRadius: 4,
          fontSize: 18, lineHeight: 1.45, color: "var(--hr-fg-1)",
        }}>
          ребят, у нас идея — что если сделать пару ботов вместе?
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
            <LIMark size={14} color="rgba(241,235,224,0.55)" accent={LI_ORANGE} weight={600}/>
            <span className="font-mono" style={{ fontSize: 10, letterSpacing: "0.14em", color: "var(--hr-fg-4)" }}>· 14:22</span>
          </div>
        </div>

        {/* from hireon (right, cyan tint) */}
        <div style={{
          alignSelf: "flex-end", maxWidth: 560,
          background: "rgba(34,211,238,0.12)",
          border: "1px solid rgba(34,211,238,0.35)",
          padding: "16px 20px", borderRadius: 18, borderTopRightRadius: 4,
          fontSize: 18, lineHeight: 1.45, color: "var(--hr-fg-1)",
        }}>
          ↳ давайте.
          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8, marginTop: 10 }}>
            <span className="font-mono" style={{ fontSize: 10, letterSpacing: "0.14em", color: "var(--hr-fg-4)" }}>14:22 ·</span>
            <span className="hr-logo" style={{ fontSize: 14, color: "rgba(241,235,224,0.55)", letterSpacing: "-0.04em" }}>
              <span>hire</span><span style={{ color: "var(--hr-teal)" }}>.</span><span>on</span>
            </span>
          </div>
        </div>

        {/* lock-in follow-up */}
        <div style={{
          alignSelf: "flex-start", maxWidth: 620,
          background: "rgba(255,87,34,0.10)",
          border: "1px solid rgba(255,87,34,0.30)",
          padding: "16px 20px", borderRadius: 18, borderTopLeftRadius: 4,
          fontSize: 18, lineHeight: 1.45, color: "var(--hr-fg-1)",
        }}>
          у нас инжиниринг + продакт. у вас — каталог и аудитория.
          <br/>попробуем выкатить ботов под разные ниши?
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
            <LIMark size={14} color="rgba(241,235,224,0.55)" accent={LI_ORANGE} weight={600}/>
            <span className="font-mono" style={{ fontSize: 10, letterSpacing: "0.14em", color: "var(--hr-fg-4)" }}>· 14:23</span>
          </div>
        </div>

        {/* hireon */}
        <div style={{
          alignSelf: "flex-end", maxWidth: 560,
          background: "var(--hr-teal)",
          color: "var(--hr-teal-ink)",
          padding: "16px 20px", borderRadius: 18, borderTopRightRadius: 4,
          fontSize: 18, lineHeight: 1.45, fontWeight: 500,
        }}>
          уже скучаю по разработке. погнали.
          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8, marginTop: 10 }}>
            <span className="font-mono" style={{ fontSize: 10, letterSpacing: "0.14em", opacity: 0.7 }}>14:24 ·</span>
            <span className="hr-logo" style={{ fontSize: 14, color: "var(--hr-teal-ink)", letterSpacing: "-0.04em", opacity: 0.7 }}>
              <span>hire</span><span>.</span><span>on</span>
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
        <p style={{ margin: 0, fontSize: 17, color: "var(--hr-fg-2)", lineHeight: 1.4, maxWidth: 660 }}>
          теперь делаем ботов абсолютно разных ниш — вместе. дружеская коллаба.
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <HireOnMark size={22} />
          <span style={{ width: 1, height: 22, background: "var(--hr-border-2)" }} />
          <LIMark size={22} color="var(--hr-fg-1)" weight={700} />
        </div>
      </div>
    </div>
  );
}

// ── L2: Handmade marker note (1080×1080, cream) ──────────────────────────
function V3LockinNote() {
  return (
    <div className="hr-grain-cream" style={{
      position: "relative", width: 1080, height: 1080,
      background: "var(--hr-cream)", color: "var(--hr-cream-ink)",
      fontFamily: "'Inter', system-ui, sans-serif",
      overflow: "hidden", isolation: "isolate",
    }}>
      {/* faint grid */}
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <defs>
          <pattern id="li-note-grid" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M32 0 H0 V32" fill="none" stroke="rgba(20,18,14,0.06)" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#li-note-grid)"/>
      </svg>

      <div style={{ position: "absolute", inset: 28, border: "1px solid rgba(20,18,14,0.20)", borderRadius: 18, zIndex: 2 }} />

      {/* top */}
      <div style={{
        position: "absolute", top: 56, left: 60, right: 60, zIndex: 3,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span className="font-mono" style={{ fontSize: 12, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(20,18,14,0.55)" }}>
          ─── записка на холодильнике
        </span>
        <span className="font-mono" style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(20,18,14,0.45)" }}>
          без даты
        </span>
      </div>

      {/* hand-drawn "marker" content */}
      <div style={{
        position: "absolute", inset: "150px 70px 130px 70px", zIndex: 3,
        display: "flex", flexDirection: "column", justifyContent: "center", gap: 36,
      }}>
        {/* hireon line */}
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <HireOnMark size={120} color="var(--hr-cream-ink)" dotColor="var(--hr-teal-deep)" />
        </div>

        {/* PLUS sign — big, hand-drawn feeling */}
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 28 }}>
          <svg width="86" height="86" viewBox="0 0 86 86">
            <path d="M43 12 V74 M12 43 H74" stroke="var(--hr-cream-ink)" strokeWidth="9" strokeLinecap="round"/>
          </svg>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 22, letterSpacing: "0.18em", textTransform: "uppercase",
            color: "rgba(20,18,14,0.55)",
            transform: "rotate(-3deg)",
            transformOrigin: "left center",
          }}>
            делаем ботов
          </span>
        </div>

        {/* lock-in line */}
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <LIMark size={88} color="var(--hr-cream-ink)" accent={LI_ORANGE_DEEP} weight={800} />
        </div>

        {/* arrow + caption */}
        <div style={{
          marginTop: 16,
          display: "flex", alignItems: "center", gap: 22,
        }}>
          <svg width="70" height="42" viewBox="0 0 70 42">
            <path d="M4 30 Q 16 14, 38 14 T 64 22 M 64 22 L 54 16 M 64 22 L 58 30"
              stroke="var(--hr-teal-deep)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{
            fontFamily: "'Onest', sans-serif",
            fontSize: 32, fontWeight: 600, letterSpacing: "-0.02em",
            color: "var(--hr-cream-ink)",
            transform: "rotate(-1.5deg)",
          }}>
            под кафе, салоны, магазины — всё подряд.
          </span>
        </div>
      </div>

      {/* footer */}
      <div style={{
        position: "absolute", bottom: 60, left: 60, right: 60, zIndex: 3,
        paddingTop: 20, borderTop: "1px solid rgba(20,18,14,0.22)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span className="font-mono" style={{ fontSize: 13, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(20,18,14,0.55)" }}>
          P.S. без галстуков, без презентаций.
        </span>
        <span className="font-mono" style={{
          display: "inline-flex", alignItems: "center", gap: 10,
          padding: "10px 16px",
          background: "var(--hr-cream-ink)", color: "var(--hr-cream)",
          fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase",
        }}>
          hireon.agency · lock-in.agency
        </span>
      </div>
    </div>
  );
}

// ── L3: Sticker / pin-badge (1080×1080) ───────────────────────────────────
function V3LockinSticker() {
  return (
    <div className="hr-grain-cream" style={{
      position: "relative", width: 1080, height: 1080,
      background: "var(--hr-cream)",
      fontFamily: "'Inter', system-ui, sans-serif",
      overflow: "hidden", isolation: "isolate",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <PlusPat color="rgba(20,18,14,0.07)" step={36} />

      {/* the sticker — wavy/rounded rect */}
      <div style={{
        position: "relative", zIndex: 3,
        width: 760, padding: "70px 60px 60px",
        background: "var(--hr-bg-base)",
        color: "var(--hr-fg-1)",
        borderRadius: 36,
        boxShadow: "0 30px 80px rgba(20,18,14,0.18), 0 0 0 8px var(--hr-cream), 0 0 0 9px rgba(20,18,14,0.20)",
        transform: "rotate(-2deg)",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 26,
      }}>
        {/* small hole/pin */}
        <div style={{
          position: "absolute", top: 28, left: "50%", transform: "translateX(-50%)",
          width: 22, height: 22, borderRadius: 99,
          background: "var(--hr-cream)",
          boxShadow: "inset 0 2px 4px rgba(20,18,14,0.30)",
        }} />

        <span className="font-mono" style={{
          marginTop: 16, fontSize: 13, letterSpacing: "0.3em", textTransform: "uppercase",
          color: "var(--hr-fg-4)",
        }}>
          ── два дружелюбных бренда ──
        </span>

        <HireOnMark size={104} />

        <div style={{
          display: "flex", alignItems: "center", gap: 16,
          color: "var(--hr-fg-3)",
        }}>
          <span style={{ width: 60, height: 1, background: "currentColor", opacity: 0.4 }}/>
          <span style={{
            fontFamily: "'Onest', sans-serif",
            fontSize: 40, fontWeight: 400, letterSpacing: "-0.04em",
            color: "var(--hr-fg-3)",
          }}>
            ×
          </span>
          <span style={{ width: 60, height: 1, background: "currentColor", opacity: 0.4 }}/>
        </div>

        <LIMark size={66} color="var(--hr-fg-1)" weight={800} />

        <div style={{
          marginTop: 14,
          padding: "12px 22px",
          background: "var(--hr-teal)",
          color: "var(--hr-teal-ink)",
          borderRadius: 999,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 12, letterSpacing: "0.22em", textTransform: "uppercase",
          fontWeight: 500,
        }}>
          собрались делать ботов
        </div>

        <span className="font-mono" style={{
          fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase",
          color: "var(--hr-fg-4)",
        }}>
          edition · 2026
        </span>
      </div>
    </div>
  );
}

// ── L4: Refined split (1080×1080) — cleaner, no "OFFICIAL" tag ────────────
function V3LockinSplit() {
  return (
    <div style={{
      position: "relative", width: 1080, height: 1080,
      fontFamily: "'Inter', system-ui, sans-serif",
      overflow: "hidden", isolation: "isolate",
      display: "grid", gridTemplateColumns: "1fr 1fr",
    }}>
      {/* LEFT — hireon */}
      <div className="hr-grain" style={{
        position: "relative",
        background: "var(--hr-bg-base)",
        color: "var(--hr-fg-1)",
        display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
        padding: 64, gap: 20, overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(circle at 50% 50%, rgba(34,211,238,0.22), transparent 60%)",
          zIndex: 0,
        }}/>
        <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
          <span className="font-mono" style={{
            fontSize: 11, letterSpacing: "0.24em", textTransform: "uppercase",
            color: "var(--hr-teal)",
          }}>
            маркетплейс агентов
          </span>
          <HireOnMark size={140} />
          <span className="font-mono" style={{
            fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase",
            color: "var(--hr-fg-3)",
          }}>
            hireon.agency
          </span>
        </div>
      </div>

      {/* RIGHT — lock-in */}
      <div style={{
        position: "relative",
        background: LI_INK,
        color: "#f1ebe0",
        display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
        padding: 64, gap: 20, overflow: "hidden",
        borderLeft: "1px solid rgba(255,87,34,0.20)",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(circle at 50% 50%, rgba(255,87,34,0.22), transparent 60%)",
          zIndex: 0,
        }}/>
        <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
          <span className="font-mono" style={{
            fontSize: 11, letterSpacing: "0.24em", textTransform: "uppercase",
            color: LI_ORANGE,
          }}>
            продакт-инжиниринг
          </span>
          <LIMark size={70} weight={800}/>
          <span className="font-mono" style={{
            fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase",
            color: "rgba(241,235,224,0.55)",
          }}>
            lock-in.agency
          </span>
        </div>
      </div>

      {/* CENTER caption — no "COLLABORATION" */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 4,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 18,
      }}>
        <div style={{
          padding: "16px 22px",
          background: "var(--hr-bg-base)",
          border: "1px solid var(--hr-border-2)",
          borderRadius: 18,
          display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
          minWidth: 200,
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}>
          <span style={{
            fontFamily: "'Onest', sans-serif",
            fontSize: 56, fontWeight: 300, letterSpacing: "-0.05em",
            color: "var(--hr-fg-1)", lineHeight: 1,
          }}>
            ×
          </span>
          <span className="font-mono" style={{
            fontSize: 10, letterSpacing: "0.26em", textTransform: "uppercase",
            color: "var(--hr-fg-3)",
          }}>
            делаем ботов вместе
          </span>
        </div>
      </div>
    </div>
  );
}

// ── L5: Agent card with "by lock-in" badge (800×800) ─────────────────────
function V3LockinAgentCard() {
  // big mockup of an agent catalog card — showing how lock-in's branding lives in the card
  return (
    <div style={{
      position: "relative", width: 800, height: 800,
      background: "var(--hr-bg-base)",
      fontFamily: "'Inter', system-ui, sans-serif",
      padding: 60, boxSizing: "border-box",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: 28,
    }}>
      <PlusPat color="rgba(241,235,224,0.04)" step={48} />

      <span className="font-mono" style={{
        position: "relative", zIndex: 2,
        fontSize: 12, letterSpacing: "0.24em", textTransform: "uppercase",
        color: "var(--hr-fg-4)",
      }}>
        ─── как агент от lock-in выглядит в каталоге ───
      </span>

      {/* The Agent Card */}
      <div style={{
        position: "relative", zIndex: 2,
        width: 540,
        background: "rgba(22, 20, 18, 0.85)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 2,
        padding: 0,
        overflow: "hidden",
        boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
      }}>
        {/* top stripe — category color */}
        <div style={{ height: 2, background: "var(--hr-cat-support)" }}/>

        {/* by-lock-in badge — pinned to top-right corner */}
        <div style={{
          position: "absolute", top: 18, right: 18,
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "5px 10px",
          background: "rgba(255,87,34,0.10)",
          border: `1px solid ${LI_ORANGE}`,
          borderRadius: 2,
          fontFamily: "'Geist', 'JetBrains Mono', monospace",
          fontSize: 10,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: LI_ORANGE,
          fontWeight: 600,
        }}>
          <span style={{ width: 5, height: 5, borderRadius: 99, background: LI_ORANGE }} />
          built by <span style={{ color: "#f1ebe0", letterSpacing: "0.06em" }}>[LOCK·IN]</span>
        </div>

        <div style={{ padding: "22px 24px" }}>
          {/* category row */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="font-mono" style={{
              fontSize: 10.5, letterSpacing: "0.08em", color: "var(--hr-cat-support)",
              textTransform: "lowercase", opacity: 0.9,
            }}>
              поддержка
            </span>
          </div>

          {/* title */}
          <h3 style={{
            marginTop: 14, fontSize: 22, fontWeight: 800, lineHeight: 1.2, letterSpacing: "-0.018em",
            color: "var(--hr-fg-1)",
          }}>
            Ответы на отзывы 2ГИС · для кафе
          </h3>

          {/* desc */}
          <p style={{
            marginTop: 10, fontSize: 13.5, lineHeight: 1.55,
            color: "rgba(241,235,224,0.75)",
          }}>
            читает отзывы на 2ГИС и Яндекс Картах, отвечает в тоне заведения. Эскалирует жалобы менеджеру.
          </p>

          {/* divider */}
          <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "20px 0" }}/>

          {/* price + cta */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={{
                fontSize: 22, fontWeight: 700, color: "var(--hr-fg-1)", letterSpacing: "-0.018em", lineHeight: 1,
                fontVariantNumeric: "tabular-nums",
              }}>
                2 400 ₽
              </div>
              <div className="font-mono" style={{ marginTop: 6, fontSize: 9.5, color: "rgba(241,235,224,0.45)", letterSpacing: "0.06em" }}>
                /месяц
              </div>
            </div>
            <span className="font-mono" style={{
              padding: "8px 12px",
              background: "var(--hr-cat-support)",
              color: "#0a0a09",
              fontSize: 10.5, letterSpacing: "0.06em", textTransform: "uppercase",
              fontWeight: 500, borderRadius: 2,
            }}>
              нанять →
            </span>
          </div>
        </div>
      </div>

      {/* spec block */}
      <div style={{
        position: "relative", zIndex: 2,
        marginTop: 8, padding: "16px 22px",
        background: "var(--hr-bg-elev)", border: "1px solid var(--hr-border-1)",
        borderRadius: 10,
        display: "flex", alignItems: "center", gap: 28,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase",
        color: "var(--hr-fg-3)",
      }}>
        <span><span style={{ color: LI_ORANGE }}>●</span> [LOCK·IN] · автор</span>
        <span style={{ width: 1, height: 14, background: "var(--hr-border-2)" }}/>
        <span><span style={{ color: "var(--hr-teal)" }}>●</span> hire.on · публикация</span>
      </div>
    </div>
  );
}

// ── L6: Wide handshake (1600×900) ─────────────────────────────────────────
function V3LockinWide() {
  return (
    <div className="hr-grain" style={{
      position: "relative", width: 1600, height: 900,
      background: "var(--hr-bg-base)",
      color: "var(--hr-fg-1)",
      fontFamily: "'Inter', system-ui, sans-serif",
      overflow: "hidden", isolation: "isolate",
    }}>
      {/* dual radials */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 0,
        background: `
          radial-gradient(circle at 24% 50%, rgba(34,211,238,0.22), transparent 40%),
          radial-gradient(circle at 76% 50%, rgba(255,87,34,0.22), transparent 40%)
        `,
      }}/>
      <PlusPat color="rgba(241,235,224,0.04)" step={48} />
      <div style={{ position: "absolute", inset: 32, border: "1px solid var(--hr-border-1)", borderRadius: 18, zIndex: 2 }} />

      {/* top */}
      <div style={{
        position: "absolute", top: 56, left: 72, right: 72, zIndex: 3,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span className="font-mono" style={{ fontSize: 12, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--hr-fg-3)" }}>
          ─── собрались делать ботов вместе
        </span>
        <span className="font-mono" style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--hr-fg-4)" }}>
          2026
        </span>
      </div>

      {/* trio: hireon × lock-in */}
      <div style={{
        position: "absolute", top: 220, left: 72, right: 72, zIndex: 3,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <span className="font-mono" style={{
            fontSize: 12, letterSpacing: "0.24em", textTransform: "uppercase",
            color: "var(--hr-teal)",
          }}>
            маркетплейс агентов
          </span>
          <HireOnMark size={172} />
          <span className="font-mono" style={{
            fontSize: 13, letterSpacing: "0.14em",
            color: "var(--hr-fg-3)",
          }}>
            hireon.agency
          </span>
        </div>

        <div style={{
          fontFamily: "'Onest', sans-serif",
          fontSize: 160, fontWeight: 300, color: "var(--hr-fg-4)",
          lineHeight: 1, letterSpacing: "-0.05em",
        }}>
          ×
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20, alignItems: "flex-end" }}>
          <span className="font-mono" style={{
            fontSize: 12, letterSpacing: "0.24em", textTransform: "uppercase",
            color: LI_ORANGE,
          }}>
            продакт-инжиниринг
          </span>
          <LIMark size={96} weight={800}/>
          <span className="font-mono" style={{
            fontSize: 13, letterSpacing: "0.14em",
            color: "var(--hr-fg-3)",
          }}>
            lock-in.agency
          </span>
        </div>
      </div>

      {/* bottom statement */}
      <div style={{
        position: "absolute", bottom: 70, left: 72, right: 72, zIndex: 3,
        paddingTop: 24, borderTop: "1px solid var(--hr-border-1)",
        display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 48,
      }}>
        <h2 className="font-heading" style={{
          margin: 0, fontSize: 38, fontWeight: 700, letterSpacing: "-0.025em",
          lineHeight: 1.15, color: "var(--hr-fg-1)", maxWidth: 1000,
        }}>
          делаем готовых ботов для совершенно разных ниш{" "}
          <span style={{ color: "var(--hr-fg-3)", fontWeight: 500 }}>— и не только.</span>
        </h2>
      </div>
    </div>
  );
}

Object.assign(window, {
  LIMark, HireOnMark,
  V3LockinChat, V3LockinNote, V3LockinSticker, V3LockinSplit, V3LockinAgentCard, V3LockinWide,
});
