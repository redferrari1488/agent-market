import { AgentIcon, hasAgentIcon } from "./AgentIcon";

// Per-agent hero illustrations. Каждый mockup — статичный SSR, без интерактива,
// показывает что агент делает (а не просто иконка-метафора).

type Props = {
  slug: string;
  name: string;
  color: string;
};

export function HeroIllustration({ slug, name, color }: Props) {
  return (
    <Frame color={color}>
      <Content slug={slug} name={name} color={color} />
    </Frame>
  );
}

// ── Frame: общий контейнер ────────────────────────────────────────────────

function Frame({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div
      className="hr-hero-frame"
      style={{
        position: "relative",
        borderRadius: 18,
        padding: 24,
        background: `linear-gradient(135deg, color-mix(in oklch, ${color} 14%, transparent), color-mix(in oklch, ${color} 2%, transparent))`,
        border: `1px solid color-mix(in oklch, ${color} 22%, transparent)`,
        aspectRatio: "1",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 50% 0%, color-mix(in oklch, ${color} 12%, transparent), transparent 60%)`,
          pointerEvents: "none",
        }}
      />
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", height: "100%" }}>
        {children}
      </div>
    </div>
  );
}

function FrameLabel({ left, right, color }: { left: string; right?: string; color: string }) {
  return (
    <div
      className="font-mono"
      style={{
        fontSize: 10,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: "var(--hr-fg-4)",
        marginBottom: 16,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <span>{left}</span>
      {right && (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color }}>
          <span style={{ width: 6, height: 6, borderRadius: 99, background: color }} />
          {right}
        </span>
      )}
    </div>
  );
}

function Footnote({ children, color: _color }: { children: React.ReactNode; color: string }) {
  // Раньше тут был borderTop (1px dashed → 1px solid) — убран совсем:
  // visual separator не нужен, тон достаточно отличается от основного контента
  // через цвет/размер шрифта (font-mono 10px var(--hr-fg-3)).
  return (
    <div
      style={{
        marginTop: "auto",
        paddingTop: 16,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
      }}
    >
      <span
        className="font-mono"
        style={{
          fontSize: 10,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--hr-fg-3)",
          textAlign: "center",
        }}
      >
        {children}
      </span>
    </div>
  );
}

// ── Content router ────────────────────────────────────────────────────────

function Content({ slug, name, color }: { slug: string; name: string; color: string }) {
  switch (slug) {
    case "telegram-support-bot":
      return <SupportBotMockup color={color} />;
    case "review-responder-2gis":
      return <ReviewResponderMockup color={color} />;
    case "content-writer":
      return <ContentWriterMockup color={color} />;
    case "competitor-monitor":
      return <CompetitorMonitorMockup color={color} />;
    case "news-digest-bot":
      return <NewsDigestMockup color={color} />;
    case "website-monitor":
      return <WebsiteMonitorMockup color={color} />;
    case "lead-qualifier-amocrm":
      return <LeadQualifierMockup color={color} />;
    case "call-analytics-roistat":
      return <CallAnalyticsMockup color={color} />;
    default:
      return <FallbackMockup slug={slug} name={name} color={color} />;
  }
}

// ── 1. Telegram Support Bot — TG-чат ───────────────────────────────────────

function SupportBotMockup({ color }: { color: string }) {
  return (
    <>
      <FrameLabel left="Telegram · поддержка" right="онлайн" color={color} />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <Bubble side="left">
          Во сколько вы открываетесь в воскресенье?
          <BubbleMeta>клиент · 22:14</BubbleMeta>
        </Bubble>
        <Bubble side="right" color={color}>
          По воскресеньям с 10:00 до 22:00. Заказ можно оформить с доставкой — привезём к открытию.
          <BubbleMeta light>агент · 22:14</BubbleMeta>
        </Bubble>
      </div>
      <Footnote color={color}>● ответ за 4 секунды · работает круглосуточно</Footnote>
    </>
  );
}

// ── 2. Review Responder 2GIS ──────────────────────────────────────────────

function ReviewResponderMockup({ color }: { color: string }) {
  return (
    <>
      <FrameLabel left="2GIS · новый отзыв" right="отвечает" color={color} />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <Bubble side="left">
          Заказали на дом — привезли холодное. Что за обслуживание?
          <BubbleMeta>клиент · 23:47 · ★☆☆☆☆</BubbleMeta>
        </Bubble>
        <Bubble side="right" color={color}>
          Извините за остывший заказ — это правда не то, чего хочется. Напишите номер заказа, переделаем за наш счёт.
          <BubbleMeta light>агент · 23:48</BubbleMeta>
        </Bubble>
      </div>
      <Footnote color={color}>● ответил за 53 секунды · в тоне бренда</Footnote>
    </>
  );
}

// ── 3. Content Writer — черновик поста ────────────────────────────────────

function ContentWriterMockup({ color }: { color: string }) {
  return (
    <>
      <FrameLabel left="Telegram-канал · черновик" right="готов" color={color} />
      <div
        style={{
          background: "var(--hr-bg-elev)",
          border: "1px solid var(--hr-border-1)",
          borderRadius: 12,
          padding: "16px 18px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-onest), 'Onest', sans-serif",
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "var(--hr-fg-1)",
            lineHeight: 1.25,
          }}
        >
          5 идей вечернего меню для кофейни этой осенью
        </div>
        <div style={{ fontSize: 12.5, lineHeight: 1.55, color: "var(--hr-fg-3)" }}>
          Осенью посетители часто заходят согреться — это шанс продать больше, чем кофе. Несколько простых идей, которые работают почти у всех:
        </div>
        <div style={{ fontSize: 12.5, lineHeight: 1.55, color: "var(--hr-fg-3)" }}>
          1. Сезонный сироп в латте — тыква, карамель, корица<span style={{ display: "inline-block", width: 2, height: 14, marginLeft: 3, background: color, verticalAlign: "middle" }} />
        </div>
      </div>
      <Footnote color={color}>● написан в 09:02 · ждёт одобрения</Footnote>
    </>
  );
}

// ── 4. Competitor Monitor — 3 мини-карточки сайтов ───────────────────────

function CompetitorMonitorMockup({ color }: { color: string }) {
  const items = [
    { domain: "coffee-rival.ru", delta: "−15%", change: "новая цена на капсулы" },
    { domain: "cafe-next.ru", delta: "новое", change: "акция к Хэллоуину" },
    { domain: "beans-shop.ru", delta: "+1", change: "добавили доставку по СПб" },
  ];
  return (
    <>
      <FrameLabel left="Утро · сводка по 8 сайтам" right="готово" color={color} />
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((it) => (
          <div
            key={it.domain}
            style={{
              background: "var(--hr-bg-elev)",
              border: "1px solid var(--hr-border-1)",
              borderRadius: 10,
              padding: "10px 12px",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span
              className="font-mono"
              style={{
                fontSize: 11,
                color: "var(--hr-fg-2)",
                whiteSpace: "nowrap",
              }}
            >
              {it.domain}
            </span>
            <span
              className="font-mono"
              style={{
                fontSize: 10,
                color,
                padding: "2px 7px",
                background: `color-mix(in oklch, ${color} 14%, transparent)`,
                border: `1px solid color-mix(in oklch, ${color} 28%, transparent)`,
                borderRadius: 4,
                whiteSpace: "nowrap",
              }}
            >
              {it.delta}
            </span>
            <span
              style={{
                fontSize: 11.5,
                color: "var(--hr-fg-3)",
                marginLeft: "auto",
                textAlign: "right",
                lineHeight: 1.3,
              }}
            >
              {it.change}
            </span>
          </div>
        ))}
      </div>
      <Footnote color={color}>● 12 апдейтов за вчера · отчёт в Telegram</Footnote>
    </>
  );
}

// ── 5. News Digest Bot — утренняя сводка ─────────────────────────────────

function NewsDigestMockup({ color }: { color: string }) {
  const items = [
    { title: "Госдума обсуждает регулирование AI-сервисов", src: "Forbes · 08:42" },
    { title: "OpenAI выпустила обновление модели для бизнеса", src: "РБК · 07:30" },
    { title: "Спрос на AI-разработчиков вырос в 4 раза", src: "Habr · вчера" },
  ];
  return (
    <>
      <FrameLabel left="09:00 · дайджест отрасли" right="3 темы" color={color} />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {items.map((it, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
            }}
          >
            <span
              className="font-mono"
              style={{
                fontSize: 11,
                color,
                lineHeight: 1.6,
                flexShrink: 0,
                minWidth: 18,
              }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <div
                style={{
                  fontSize: 13,
                  lineHeight: 1.35,
                  color: "var(--hr-fg-1)",
                  fontWeight: 500,
                }}
              >
                {it.title}
              </div>
              <div
                className="font-mono"
                style={{
                  fontSize: 10,
                  color: "var(--hr-fg-4)",
                  letterSpacing: "0.08em",
                }}
              >
                {it.src}
              </div>
            </div>
          </div>
        ))}
      </div>
      <Footnote color={color}>● 8 источников · 47 статей сжато до 3</Footnote>
    </>
  );
}

// ── 6. Website Monitor — status tile с uptime % ──────────────────────────

function WebsiteMonitorMockup({ color }: { color: string }) {
  const sites = [
    { domain: "shop.example.ru", status: "ok" },
    { domain: "blog.example.ru", status: "ok" },
    { domain: "api.example.ru", status: "ok" },
  ];
  return (
    <>
      <FrameLabel left="Мониторинг · 4 страницы" right="всё работает" color={color} />
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div
          style={{
            background: "var(--hr-bg-elev)",
            border: "1px solid var(--hr-border-1)",
            borderRadius: 12,
            padding: "14px 16px",
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-onest), 'Onest', sans-serif",
              fontSize: 32,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color,
              lineHeight: 1,
            }}
          >
            99.98%
          </span>
          <span
            className="font-mono"
            style={{
              fontSize: 10,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--hr-fg-4)",
            }}
          >
            uptime · 30 дней
          </span>
        </div>
        {sites.map((s) => (
          <div
            key={s.domain}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 99,
                background: color,
                flexShrink: 0,
              }}
            />
            <span
              className="font-mono"
              style={{
                fontSize: 12,
                color: "var(--hr-fg-2)",
              }}
            >
              {s.domain}
            </span>
            <span
              className="font-mono"
              style={{
                fontSize: 10,
                color: "var(--hr-fg-4)",
                marginLeft: "auto",
                letterSpacing: "0.06em",
              }}
            >
              200 OK · 142ms
            </span>
          </div>
        ))}
      </div>
      <Footnote color={color}>● последняя проверка · минуту назад</Footnote>
    </>
  );
}

// ── 7. Lead Qualifier amoCRM — карточка лида ─────────────────────────────

function LeadQualifierMockup({ color }: { color: string }) {
  const tags = ["тёплый", "ремонт квартир", "бюджет 800К"];
  return (
    <>
      <FrameLabel left="amoCRM · новый лид" right="квалифицирован" color={color} />
      <div
        style={{
          background: "var(--hr-bg-elev)",
          border: "1px solid var(--hr-border-1)",
          borderRadius: 12,
          padding: "16px 18px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 99,
              background: `color-mix(in oklch, ${color} 18%, transparent)`,
              border: `1px solid color-mix(in oklch, ${color} 32%, transparent)`,
              color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-onest), sans-serif",
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            ИП
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--hr-fg-1)" }}>Иван П.</div>
            <div className="font-mono" style={{ fontSize: 10, color: "var(--hr-fg-4)", letterSpacing: "0.06em" }}>
              из Telegram · 14:22
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {tags.map((t) => (
            <span
              key={t}
              className="font-mono"
              style={{
                fontSize: 10,
                padding: "3px 9px",
                background: `color-mix(in oklch, ${color} 12%, transparent)`,
                color,
                border: `1px solid color-mix(in oklch, ${color} 26%, transparent)`,
                borderRadius: 4,
                whiteSpace: "nowrap",
              }}
            >
              {t}
            </span>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            paddingTop: 10,
            borderTop: "1px solid var(--hr-border-1)",
            fontSize: 12,
            color: "var(--hr-fg-2)",
          }}
        >
          <span className="font-mono" style={{ fontSize: 10, color: "var(--hr-fg-4)", letterSpacing: "0.1em" }}>
            ЭТАП →
          </span>
          <span style={{ color: "var(--hr-fg-1)", fontWeight: 500 }}>Готов к встрече</span>
        </div>
      </div>
      <Footnote color={color}>● квалифицирован за 2 минуты · 4 вопроса</Footnote>
    </>
  );
}

// ── 8. Call Analytics Roistat ─────────────────────────────────────────────

function CallAnalyticsMockup({ color }: { color: string }) {
  const tags = ["заявка", "ремонт", "бюджет 2 млн"];
  return (
    <>
      <FrameLabel left="входящий · 03:42" right="разобран" color={color} />
      <div
        style={{
          background: "var(--hr-bg-elev)",
          border: "1px solid var(--hr-border-1)",
          borderRadius: 12,
          padding: "16px 18px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div style={{ fontSize: 13, color: "var(--hr-fg-1)", fontWeight: 500 }}>
            +7 (495) 123-45-67
          </div>
          <div className="font-mono" style={{ fontSize: 10, color: "var(--hr-fg-4)", letterSpacing: "0.06em" }}>
            сегодня · 11:08
          </div>
        </div>
        {/* Waveform mockup */}
        <div style={{ display: "flex", alignItems: "center", gap: 2, height: 28 }}>
          {Array.from({ length: 28 }).map((_, i) => {
            const h = 6 + ((i * 17) % 18);
            const past = i < 11;
            return (
              <span
                key={i}
                style={{
                  flex: 1,
                  height: h,
                  background: past ? color : `color-mix(in oklch, ${color} 22%, transparent)`,
                  borderRadius: 2,
                }}
              />
            );
          })}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {tags.map((t) => (
            <span
              key={t}
              className="font-mono"
              style={{
                fontSize: 10,
                padding: "3px 9px",
                background: `color-mix(in oklch, ${color} 12%, transparent)`,
                color,
                border: `1px solid color-mix(in oklch, ${color} 26%, transparent)`,
                borderRadius: 4,
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>
      <Footnote color={color}>● отправлено в Roistat · вечерняя сводка</Footnote>
    </>
  );
}

// ── Fallback — для новых slug'ов без mockup'а ─────────────────────────────

function FallbackMockup({ slug, name, color }: { slug: string; name: string; color: string }) {
  const iconAvailable = hasAgentIcon(slug);
  return (
    <div
      style={{
        margin: "auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color,
      }}
    >
      {iconAvailable ? (
        <AgentIcon slug={slug} size={180} />
      ) : (
        <div
          style={{
            fontFamily: "var(--font-onest), 'Onest', sans-serif",
            fontSize: 160,
            fontWeight: 700,
            letterSpacing: "-0.04em",
            lineHeight: 1,
            color,
            opacity: 0.85,
          }}
        >
          {name.charAt(0)}
        </div>
      )}
    </div>
  );
}

// ── Shared bubble/meta primitives ─────────────────────────────────────────

function Bubble({
  side,
  color,
  children,
}: {
  side: "left" | "right";
  color?: string;
  children: React.ReactNode;
}) {
  const isRight = side === "right";
  return (
    <div
      style={{
        alignSelf: isRight ? "flex-end" : "flex-start",
        maxWidth: "88%",
        background: isRight && color ? color : "var(--hr-bg-elev-3)",
        color: isRight && color ? "var(--hr-teal-ink)" : "var(--hr-fg-2)",
        padding: "10px 14px",
        borderRadius: 14,
        borderTopLeftRadius: isRight ? 14 : 4,
        borderTopRightRadius: isRight ? 4 : 14,
        fontSize: 12.5,
        lineHeight: 1.4,
        fontWeight: isRight ? 500 : 400,
      }}
    >
      {children}
    </div>
  );
}

function BubbleMeta({ children, light }: { children: React.ReactNode; light?: boolean }) {
  return (
    <div
      className="font-mono"
      style={{
        marginTop: 5,
        fontSize: 9.5,
        letterSpacing: "0.1em",
        color: light ? "rgba(10,10,9,0.7)" : "var(--hr-fg-4)",
      }}
    >
      {children}
    </div>
  );
}
