/* global React */
/* hireon v3 — fixed stats + RU SMB posters */

// Shared helpers — local copy so v3 doesn't depend on v2 quirks

// hireon lockup
function V3Lockup({ size = 24, color = "var(--hr-fg-1)", subColor }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "baseline", gap: 14 }}>
      <span className="hr-logo" style={{ fontSize: size, color, lineHeight: 0.85, letterSpacing: "-0.055em" }}>
        <span>hire</span><span style={{ color: "var(--hr-teal)" }}>.</span><span>on</span>
      </span>
      <span className="font-mono" style={{
        fontSize: Math.round(size * 0.42),
        letterSpacing: "0.18em", textTransform: "uppercase",
        color: subColor || color,
        opacity: 0.55,
        paddingLeft: 14,
        borderLeft: `1px solid ${subColor || color}`,
        marginLeft: -2,
      }}>
        hireon.agency
      </span>
    </div>
  );
}

function PlusPat({ color = "rgba(20,18,14,0.07)", step = 32 }) {
  return (
    <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" }}>
      <defs>
        <pattern id={`v3pp-${step}-${color.replace(/[^a-z0-9]/gi,"")}`} x="0" y="0" width={step} height={step} patternUnits="userSpaceOnUse">
          <path d={`M${step/2} ${step/2-4} V${step/2+4} M${step/2-4} ${step/2} H${step/2+4}`} stroke={color} strokeWidth="1" fill="none" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#v3pp-${step}-${color.replace(/[^a-z0-9]/gi,"")})`} />
    </svg>
  );
}

// Market series (same data, no source labels in UI)
const SERIES_V3 = [
  { year: 2024, value: 5.4 },
  { year: 2025, value: 7.74 },
  { year: 2026, value: 11.1 },
  { year: 2027, value: 15.93 },
  { year: 2028, value: 22.85 },
  { year: 2029, value: 32.78 },
  { year: 2030, value: 47.1 },
];

// Reusable curve
function GrowthCurveV3({
  width = 1000, height = 420,
  stroke = "var(--hr-teal)",
  gridColor = "rgba(241,235,224,0.10)",
  labelColor = "rgba(241,235,224,0.55)",
  highlightLast = true,
}) {
  const pad = { l: 60, r: 30, t: 30, b: 50 };
  const W = width - pad.l - pad.r;
  const H = height - pad.t - pad.b;
  const maxY = 50;
  const xAt = (i) => pad.l + (W * i) / (SERIES_V3.length - 1);
  const yAt = (v) => pad.t + H - (v / maxY) * H;
  const pts = SERIES_V3.map((d, i) => [xAt(i), yAt(d.value)]);
  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ");
  const areaPath = `${linePath} L ${pts[pts.length-1][0]} ${pad.t + H} L ${pts[0][0]} ${pad.t + H} Z`;
  const gradId = `v3-fill-${stroke.replace(/[^a-z0-9]/gi,"")}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: "block" }}>
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 10, 20, 30, 40, 50].map((v) => (
        <g key={v}>
          <line x1={pad.l} x2={pad.l + W} y1={yAt(v)} y2={yAt(v)} stroke={gridColor} strokeWidth="1" />
          <text x={pad.l - 12} y={yAt(v) + 4} textAnchor="end"
            className="font-mono" fill={labelColor} fontSize="11" letterSpacing="0.06em">
            ${v}B
          </text>
        </g>
      ))}
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path d={linePath} fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p[0]} cy={p[1]} r="4" fill={stroke} />
          <text x={p[0]} y={pad.t + H + 24} textAnchor="middle"
            className="font-mono" fill={labelColor} fontSize="11" letterSpacing="0.08em">
            {SERIES_V3[i].year}
          </text>
        </g>
      ))}
      {highlightLast && (
        <>
          <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r="10"
            fill="none" stroke={stroke} strokeOpacity="0.45" strokeWidth="1.5" />
          <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r="18"
            fill="none" stroke={stroke} strokeOpacity="0.18" strokeWidth="1.5" />
        </>
      )}
    </svg>
  );
}

// ── P1: Hero $5.4B → $47B (1600×900, dark) — FIXED ─────────────────────────
function V3PostHero() {
  return (
    <div className="hr-grain" style={{
      position: "relative", width: 1600, height: 900,
      background: "var(--hr-bg-base)", color: "var(--hr-fg-1)",
      fontFamily: "'Inter', system-ui, sans-serif",
      overflow: "hidden", isolation: "isolate",
    }}>
      <PlusPat color="rgba(241,235,224,0.05)" step={40} />
      <div style={{ position: "absolute", inset: 32, border: "1px solid var(--hr-border-1)", borderRadius: 18, zIndex: 2 }} />

      <div style={{
        position: "absolute", top: 56, left: 72, right: 72, zIndex: 3,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <V3Lockup size={24} />
        <span className="font-mono" style={{ fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--hr-fg-3)" }}>
          ─── почему сейчас
        </span>
      </div>

      <div style={{
        position: "absolute", inset: "120px 72px 88px 72px",
        zIndex: 3, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56,
      }}>
        {/* LEFT */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <span className="font-mono" style={{ fontSize: 13, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--hr-fg-3)" }}>
              рынок AI-агентов · 2024 → 2030
            </span>

            <div style={{ marginTop: 38, display: "flex", alignItems: "baseline", gap: 8 }}>
              <span className="font-heading" style={{
                fontSize: 76, fontWeight: 500, color: "var(--hr-fg-3)",
                letterSpacing: "-0.04em", lineHeight: 1,
              }}>
                $5.4<span style={{ fontSize: 50 }}>B</span>
              </span>
            </div>

            <div className="font-mono" style={{
              margin: "14px 0", fontSize: 14, letterSpacing: "0.16em",
              color: "var(--hr-teal)", display: "flex", alignItems: "center", gap: 10,
            }}>
              <svg width="38" height="20" viewBox="0 0 38 20" fill="none">
                <path d="M0 16 L 16 8 L 30 12 L 38 2" stroke="var(--hr-teal)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="38" cy="2" r="3" fill="var(--hr-teal)"/>
              </svg>
              CAGR&nbsp;44.8%&nbsp;— за&nbsp;6&nbsp;лет
            </div>

            <div style={{ display: "flex", alignItems: "baseline" }}>
              <span className="font-heading" style={{
                fontSize: 148, fontWeight: 800, color: "var(--hr-fg-1)",
                letterSpacing: "-0.05em", lineHeight: 0.92,
              }}>
                $47<span style={{ color: "var(--hr-teal)", fontSize: 132 }}>B</span>
              </span>
            </div>
            <span className="font-mono" style={{
              fontSize: 13, letterSpacing: "0.1em",
              color: "var(--hr-fg-3)", marginTop: 16, display: "block",
            }}>
              к 2030 году
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{
              fontSize: 17, lineHeight: 1.5, color: "var(--hr-fg-2)",
              maxWidth: 560, margin: 0, fontWeight: 400,
            }}>
              Пока бизнес учится покупать первого AI-сотрудника,
              рынок уже умножается. Мы строим маркетплейс под эту волну.
            </p>
            <div style={{
              marginTop: 10, padding: "16px 22px",
              background: "var(--hr-teal)", color: "var(--hr-teal-ink)",
              borderRadius: 12, display: "inline-flex", alignSelf: "flex-start",
              alignItems: "center", gap: 10, fontFamily: "'JetBrains Mono', monospace",
              fontSize: 14, letterSpacing: "0.16em", textTransform: "uppercase",
              fontWeight: 500,
            }}>
              hireon.agency →
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div style={{
          background: "var(--hr-bg-elev)",
          border: "1px solid var(--hr-border-1)",
          borderRadius: 14,
          padding: "28px 30px 18px",
          display: "flex", flexDirection: "column",
        }}>
          <div className="font-mono" style={{
            fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase",
            color: "var(--hr-fg-4)", marginBottom: 16,
            display: "flex", justifyContent: "space-between",
          }}>
            <span>рост капитала в AI-агентах</span>
            <span>usd, миллиарды</span>
          </div>
          <GrowthCurveV3 width={680} height={420} />
          <div className="font-mono" style={{
            fontSize: 11, letterSpacing: "0.16em",
            color: "var(--hr-fg-4)", marginTop: 18,
            display: "flex", justifyContent: "space-between",
            paddingTop: 14, borderTop: "1px solid var(--hr-border-1)",
          }}>
            <span>● 6 лет · экспоненциальный рост</span>
            <span>× 8.7</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── P2: Vertical Stories (1080×1920) — FIXED B overflow ───────────────────
function V3PostStories() {
  return (
    <div className="hr-grain" style={{
      position: "relative", width: 1080, height: 1920,
      background: "var(--hr-bg-base)",
      color: "var(--hr-fg-1)",
      fontFamily: "'Inter', system-ui, sans-serif",
      overflow: "hidden", isolation: "isolate",
    }}>
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(34,211,238,0.20) 0%, rgba(34,211,238,0) 60%)",
        zIndex: 1,
      }} />
      <PlusPat color="rgba(241,235,224,0.05)" step={48} />

      <div style={{
        position: "absolute", top: 96, left: 64, right: 64, zIndex: 3,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <V3Lockup size={26} />
        <span className="font-mono" style={{
          fontSize: 13, letterSpacing: "0.2em", textTransform: "uppercase",
          color: "var(--hr-fg-4)",
        }}>
          ─── почему сейчас
        </span>
      </div>

      <div style={{ position: "absolute", top: 280, left: 80, right: 80, zIndex: 3 }}>
        <span className="font-mono" style={{
          fontSize: 14, letterSpacing: "0.22em", textTransform: "uppercase",
          color: "var(--hr-teal)",
        }}>
          мировой рынок AI-агентов
        </span>
        <div style={{ marginTop: 18 }}>
          <span style={{ fontSize: 24, color: "var(--hr-fg-2)", fontWeight: 500 }}>в 2024 он был</span>{" "}
          <span className="font-heading" style={{ fontSize: 56, fontWeight: 800, color: "var(--hr-fg-3)", letterSpacing: "-0.03em" }}>
            $5.4B
          </span>
        </div>
      </div>

      {/* HERO number — fixed: 360px so the B fits comfortably */}
      <div style={{
        position: "absolute", top: 580, left: 0, right: 0, zIndex: 3,
        textAlign: "center",
      }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 22, letterSpacing: "0.4em", textTransform: "uppercase",
          color: "var(--hr-teal)", marginBottom: 36,
        }}>
          → к 2030 →
        </div>
        <div className="font-heading" style={{
          fontSize: 360, fontWeight: 800, color: "var(--hr-fg-1)",
          letterSpacing: "-0.06em", lineHeight: 0.9,
        }}>
          $47<span style={{ color: "var(--hr-teal)" }}>B</span>
        </div>
        <div style={{ marginTop: 24, fontSize: 28, color: "var(--hr-fg-3)", fontWeight: 400 }}>
          × 8.7 за шесть лет
        </div>
      </div>

      <div style={{
        position: "absolute", top: 1260, left: 60, right: 60, zIndex: 3,
        background: "var(--hr-bg-elev)",
        border: "1px solid var(--hr-border-1)",
        borderRadius: 16, padding: "22px 24px",
      }}>
        <div className="font-mono" style={{
          fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase",
          color: "var(--hr-fg-4)", marginBottom: 12,
        }}>
          рост капитала · 2024 → 2030
        </div>
        <V3StoriesCurve />
      </div>

      <div style={{
        position: "absolute", bottom: 96, left: 64, right: 64, zIndex: 3,
        display: "flex", flexDirection: "column", gap: 14,
        paddingTop: 22, borderTop: "1px solid var(--hr-border-1)",
      }}>
        <p style={{
          margin: 0, fontSize: 22, lineHeight: 1.35,
          color: "var(--hr-fg-2)", fontWeight: 500,
        }}>
          мы строим маркетплейс готовых агентов под эту волну.
        </p>
        <div style={{
          marginTop: 4, display: "inline-flex", alignSelf: "flex-start",
          padding: "16px 24px", background: "var(--hr-teal)", color: "var(--hr-teal-ink)",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 16, letterSpacing: "0.18em", textTransform: "uppercase",
          fontWeight: 500, borderRadius: 12,
        }}>
          hireon.agency →
        </div>
      </div>
    </div>
  );
}
function V3StoriesCurve() {
  const pad = { l: 56, r: 24, t: 18, b: 36 };
  const W = 880, H = 280;
  const inW = W - pad.l - pad.r, inH = H - pad.t - pad.b;
  const maxY = 50;
  const xAt = (i) => pad.l + (inW * i) / (SERIES_V3.length - 1);
  const yAt = (v) => pad.t + inH - (v / maxY) * inH;
  const pts = SERIES_V3.map((d,i) => [xAt(i), yAt(d.value)]);
  const linePath = pts.map((p,i)=> `${i===0?"M":"L"} ${p[0]} ${p[1]}`).join(" ");
  const areaPath = `${linePath} L ${pts[pts.length-1][0]} ${pad.t+inH} L ${pts[0][0]} ${pad.t+inH} Z`;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
      <defs>
        <linearGradient id="v3sc-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--hr-teal)" stopOpacity="0.32"/>
          <stop offset="100%" stopColor="var(--hr-teal)" stopOpacity="0"/>
        </linearGradient>
      </defs>
      {[0,10,20,30,40,50].map(v=>(
        <g key={v}>
          <line x1={pad.l} x2={pad.l+inW} y1={yAt(v)} y2={yAt(v)} stroke="rgba(241,235,224,0.10)" strokeWidth="1"/>
          <text x={pad.l - 10} y={yAt(v)+4} className="font-mono" fontSize="11" fill="rgba(241,235,224,0.45)" textAnchor="end" letterSpacing="0.06em">${v}B</text>
        </g>
      ))}
      <path d={areaPath} fill="url(#v3sc-fill)"/>
      <path d={linePath} stroke="var(--hr-teal)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      {pts.map((p,i)=>(
        <g key={i}>
          <circle cx={p[0]} cy={p[1]} r="4" fill="var(--hr-teal)"/>
          <text x={p[0]} y={pad.t+inH+22} textAnchor="middle" fontSize="11" className="font-mono" fill="rgba(241,235,224,0.45)" letterSpacing="0.08em">{SERIES_V3[i].year}</text>
        </g>
      ))}
      <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r="10" fill="none" stroke="var(--hr-teal)" strokeOpacity="0.4" strokeWidth="1.5"/>
    </svg>
  );
}

// ── P3: Riso curve (1600×900, cream) — FIXED ──────────────────────────────
function V3PostRiso() {
  return (
    <div className="hr-grain-cream" style={{
      position: "relative", width: 1600, height: 900,
      background: "var(--hr-cream)",
      color: "var(--hr-cream-ink)",
      fontFamily: "'Inter', system-ui, sans-serif",
      overflow: "hidden", isolation: "isolate",
    }}>
      <PlusPat color="rgba(20,18,14,0.07)" step={36} />

      {[[60,60],[1600-60,60],[60,900-60],[1600-60,900-60]].map(([x,y],i)=>(
        <div key={i} style={{
          position: "absolute", left: x-7, top: y-7, width: 14, height: 14,
          borderRadius: 99, border: "1px solid rgba(20,18,14,0.40)", zIndex: 3,
        }}>
          <div style={{ position: "absolute", left: 6, top: 0, bottom: 0, borderLeft: "1px solid rgba(20,18,14,0.40)" }} />
          <div style={{ position: "absolute", top: 6, left: 0, right: 0, borderTop: "1px solid rgba(20,18,14,0.40)" }} />
        </div>
      ))}

      <div className="font-mono" style={{
        position: "absolute", top: 88, left: 110, right: 110, zIndex: 3,
        display: "flex", justifyContent: "space-between",
        fontSize: 12, letterSpacing: "0.22em", textTransform: "uppercase",
        color: "rgba(20,18,14,0.55)",
      }}>
        <span>рынок AI-агентов · 2024 → 2030</span>
        <span>scale 1 : 1</span>
      </div>

      <div style={{
        position: "absolute", top: 150, left: 110, right: 720, zIndex: 3,
      }}>
        <span className="font-mono" style={{
          fontSize: 13, letterSpacing: "0.24em", textTransform: "uppercase",
          color: "rgba(20,18,14,0.55)", marginBottom: 14, display: "block",
        }}>
          ↳ почему сейчас
        </span>
        <h1 className="font-heading" style={{
          fontSize: 76, lineHeight: 0.92, margin: 0, letterSpacing: "-0.045em",
          fontWeight: 800, color: "var(--hr-cream-ink)",
        }}>
          рынок<br/>агентов<br/>
          <span style={{ color: "var(--hr-teal-deep)" }}>× 8.7</span>{" "}
          <span style={{ color: "rgba(20,18,14,0.50)", fontWeight: 500 }}>за 6 лет</span>
        </h1>
      </div>

      <div style={{
        position: "absolute", top: 200, right: 110, width: 640, zIndex: 3,
      }}>
        <GrowthCurveV3
          width={640} height={460}
          stroke="var(--hr-teal-deep)"
          gridColor="rgba(20,18,14,0.18)"
          labelColor="rgba(20,18,14,0.55)"
        />
        <div style={{
          position: "absolute", top: 16, left: 80,
          padding: "8px 12px",
          border: "1px dashed rgba(20,18,14,0.40)",
          background: "var(--hr-cream-2)",
        }}>
          <div className="font-mono" style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(20,18,14,0.55)" }}>
            точка входа
          </div>
          <div className="font-heading" style={{ fontSize: 22, fontWeight: 700, marginTop: 2, letterSpacing: "-0.02em" }}>
            2024 · $5.4B
          </div>
        </div>
        <div style={{
          position: "absolute", bottom: 92, right: 8,
          padding: "8px 12px",
          background: "var(--hr-teal-deep)", color: "#fff",
        }}>
          <div className="font-mono" style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", opacity: 0.85 }}>
            прогноз
          </div>
          <div className="font-heading" style={{ fontSize: 22, fontWeight: 700, marginTop: 2, letterSpacing: "-0.02em" }}>
            2030 · $47B
          </div>
        </div>
      </div>

      <div style={{
        position: "absolute", bottom: 100, left: 110, right: 110, zIndex: 3,
        paddingTop: 22, borderTop: "2px solid var(--hr-cream-ink)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span className="font-mono" style={{ fontSize: 13, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(20,18,14,0.55)" }}>
          CAGR&nbsp;44.8%
        </span>
        <V3Lockup size={26} color="var(--hr-cream-ink)" subColor="rgba(20,18,14,0.55)" />
        <span className="font-mono" style={{
          display: "inline-flex", alignItems: "center", gap: 10,
          padding: "12px 18px",
          background: "var(--hr-cream-ink)", color: "var(--hr-cream)",
          fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase",
          fontWeight: 500,
        }}>
          [ hireon.agency ]
        </span>
      </div>
    </div>
  );
}

// ── P4: 4-stat editorial (1080×1080 cream) — FIXED ────────────────────────
function V3Post4Stat() {
  return (
    <div className="hr-grain-cream" style={{
      position: "relative", width: 1080, height: 1080,
      background: "var(--hr-cream)",
      color: "var(--hr-cream-ink)",
      fontFamily: "'Inter', system-ui, sans-serif",
      overflow: "hidden", isolation: "isolate",
    }}>
      <div style={{ position: "absolute", inset: 32, border: "1px solid rgba(20,18,14,0.18)", borderRadius: 16, zIndex: 2 }} />

      <div style={{
        position: "absolute", top: 72, left: 80, right: 80, zIndex: 3,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        paddingBottom: 18, borderBottom: "1px solid rgba(20,18,14,0.22)",
      }}>
        <span className="font-mono" style={{ fontSize: 12, letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(20,18,14,0.55)" }}>
          выпуск № 001
        </span>
        <span className="font-mono" style={{ fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(20,18,14,0.55)" }}>
          май 2026
        </span>
      </div>

      <div style={{
        position: "absolute", top: 130, left: 80, right: 80, zIndex: 3,
        paddingBottom: 22, borderBottom: "3px double rgba(20,18,14,0.85)",
      }}>
        <h1 className="font-heading" style={{
          fontSize: 80, lineHeight: 0.92, margin: 0,
          letterSpacing: "-0.05em", fontWeight: 800,
        }}>
          отрасль<br/>
          <span style={{ color: "var(--hr-teal-deep)" }}>агентов</span>{" "}
          <span style={{ color: "rgba(20,18,14,0.45)", fontWeight: 500, fontSize: 56 }}>·</span>{" "}
          4&nbsp;цифры
        </h1>
        <p style={{
          margin: "16px 0 0", fontSize: 16, lineHeight: 1.45,
          color: "rgba(20,18,14,0.65)", maxWidth: 760,
        }}>
          Куда движется автоматизация в 2026. Тихая статистика, на которой держится разговор о будущем работы.
        </p>
      </div>

      <div style={{
        position: "absolute", top: 410, left: 80, right: 80, bottom: 220, zIndex: 3,
        display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 0,
      }}>
        {/* TL — $5.4B → $47B */}
        <div style={{ padding: "28px 32px 28px 0", borderRight: "1px solid rgba(20,18,14,0.22)", borderBottom: "1px solid rgba(20,18,14,0.22)" }}>
          <span className="font-mono" style={{ fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(20,18,14,0.55)" }}>
            ① объём рынка
          </span>
          <div className="font-heading" style={{
            marginTop: 18, fontSize: 74, lineHeight: 0.92, letterSpacing: "-0.04em", fontWeight: 800,
          }}>
            $5.4<span style={{ fontSize: 40, color: "rgba(20,18,14,0.55)" }}>B</span>{" "}
            <span style={{ color: "rgba(20,18,14,0.45)", fontSize: 48 }}>→</span>{" "}
            <span style={{ color: "var(--hr-teal-deep)" }}>$47<span style={{ fontSize: 40 }}>B</span></span>
          </div>
          <p style={{ marginTop: 12, fontSize: 13.5, lineHeight: 1.45, color: "rgba(20,18,14,0.65)" }}>
            мировой рынок AI-агентов, 2024 → 2030
          </p>
        </div>

        {/* TR — CAGR 44.8% */}
        <div style={{ padding: "28px 0 28px 32px", borderBottom: "1px solid rgba(20,18,14,0.22)" }}>
          <span className="font-mono" style={{ fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(20,18,14,0.55)" }}>
            ② скорость роста
          </span>
          <div className="font-heading" style={{
            marginTop: 18, fontSize: 100, lineHeight: 0.92, letterSpacing: "-0.05em", fontWeight: 800,
          }}>
            44.8<span style={{ fontSize: 56, color: "var(--hr-teal-deep)" }}>%</span>
          </div>
          <p style={{ marginTop: 12, fontSize: 13.5, lineHeight: 1.45, color: "rgba(20,18,14,0.65)" }}>
            CAGR — ежегодный совокупный темп. рынок умножается ~9 раз за 6 лет
          </p>
        </div>

        {/* BL — 5% → 40% */}
        <div style={{ padding: "28px 32px 0 0", borderRight: "1px solid rgba(20,18,14,0.22)" }}>
          <span className="font-mono" style={{ fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(20,18,14,0.55)" }}>
            ③ корп-приложения
          </span>
          <div className="font-heading" style={{
            marginTop: 18, fontSize: 78, lineHeight: 0.92, letterSpacing: "-0.04em", fontWeight: 800,
          }}>
            <span style={{ color: "rgba(20,18,14,0.55)" }}>5%</span>
            <span style={{ color: "rgba(20,18,14,0.45)", fontSize: 50, margin: "0 12px" }}>→</span>
            <span style={{ color: "var(--hr-teal-deep)" }}>40%</span>
          </div>
          <p style={{ marginTop: 12, fontSize: 13.5, lineHeight: 1.45, color: "rgba(20,18,14,0.65)" }}>
            доля корп-софта с агентным AI, 2025 → 2026
          </p>
        </div>

        {/* BR — 61% */}
        <div style={{ padding: "28px 0 0 32px" }}>
          <span className="font-mono" style={{ fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(20,18,14,0.55)" }}>
            ④ венчур
          </span>
          <div className="font-heading" style={{
            marginTop: 18, fontSize: 100, lineHeight: 0.92, letterSpacing: "-0.05em", fontWeight: 800,
          }}>
            61<span style={{ fontSize: 56, color: "var(--hr-teal-deep)" }}>%</span>
          </div>
          <p style={{ marginTop: 12, fontSize: 13.5, lineHeight: 1.45, color: "rgba(20,18,14,0.65)" }}>
            мирового венчура ушло в AI в 2025 году
          </p>
        </div>
      </div>

      <div style={{
        position: "absolute", bottom: 72, left: 80, right: 80, zIndex: 3,
        paddingTop: 22, borderTop: "1px solid rgba(20,18,14,0.22)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <p style={{ margin: 0, fontSize: 16, fontWeight: 500, color: "var(--hr-cream-ink)", maxWidth: 620, lineHeight: 1.35 }}>
          мы строим маркетплейс готовых агентов под эту волну —{" "}
          <span style={{ color: "var(--hr-teal-deep)", fontWeight: 700 }}>hireon.agency</span>
        </p>
        <V3Lockup size={26} color="var(--hr-cream-ink)" subColor="rgba(20,18,14,0.55)" />
      </div>
    </div>
  );
}

Object.assign(window, {
  V3Lockup, PlusPat, GrowthCurveV3, SERIES_V3, V3StoriesCurve,
  V3PostHero, V3PostStories, V3PostRiso, V3Post4Stat,
});
