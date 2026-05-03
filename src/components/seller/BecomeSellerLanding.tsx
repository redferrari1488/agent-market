"use client";

import { useRef, useState } from "react";
import styles from "./BecomeSellerLanding.module.css";

type FieldErrors = Partial<
  Record<
    "name" | "contactEmail" | "contactTelegram" | "agentDescription" | "existingUrl",
    string[]
  >
>;

type LandingProps = {
  defaultEmail?: string | null;
  defaultName?: string | null;
  hasPendingApplication: boolean;
  applicationDate: Date | null;
};

const VITRINA_LEFT = [
  {
    cat: "Поддержка",
    name: "Telegram Support Bot",
    rating: "★ 4.9 · 128 отзывов",
    desc: "Отвечает клиентам 24/7. Понимает контекст FAQ, не шаблонный.",
    price: "1 900₽/мес",
    seller: "@alexdev",
  },
  {
    cat: "Контент",
    name: "Content Writer Pro",
    rating: "★ 4.8 · 64 отзыва",
    desc: "Пишет посты в Telegram по расписанию в вашем тоне и стиле.",
    price: "1 500₽/мес",
    seller: "@makerlab",
  },
  {
    cat: "Аналитика",
    name: "Competitor Monitor",
    rating: "★ 4.7 · 41 отзыв",
    desc: "Следит за сайтами конкурентов. Ежедневный саммари в Telegram.",
    price: "2 500₽/мес",
    seller: "@datawizard",
  },
];

const VITRINA_RIGHT = [
  {
    cat: "HR",
    name: "Resume Screener",
    rating: "★ 4.6 · 29 отзывов",
    desc: "Парсит резюме, ранжирует кандидатов по вашим критериям.",
    price: "3 200₽/мес",
    seller: "@hrtools",
  },
  {
    cat: "Продажи",
    name: "Lead Qualifier",
    rating: "★ 4.5 · 17 отзывов",
    desc: "Квалифицирует входящие лиды. Интеграция с CRM и Telegram.",
    price: "2 800₽/мес",
    seller: "@salesbot",
  },
];

export function BecomeSellerLanding({
  defaultEmail,
  defaultName,
  hasPendingApplication,
  applicationDate,
}: LandingProps) {
  const slotWrapRef = useRef<HTMLDivElement | null>(null);
  const slotCardRef = useRef<HTMLDivElement | null>(null);

  const [name, setName] = useState(defaultName ?? "");
  const [email, setEmail] = useState(defaultEmail ?? "");
  const [tg, setTg] = useState("");
  const [desc, setDesc] = useState("");
  const [url, setUrl] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [topError, setTopError] = useState<string | null>(null);

  function handleSlotMove(e: React.MouseEvent<HTMLDivElement>) {
    const card = slotCardRef.current;
    if (!card) return;
    if (typeof window !== "undefined" && !window.matchMedia("(hover: hover)").matches) return;
    const rect = card.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    card.style.transform = `rotateY(${dx * 14}deg) rotateX(${-dy * 10}deg) scale(1.04)`;
  }
  function handleSlotLeave() {
    const card = slotCardRef.current;
    if (!card) return;
    card.style.transform = "";
  }
  function handleSlotClick() {
    document.getElementById("seller-form")?.scrollIntoView({ behavior: "smooth" });
  }

  const trimmedDesc = desc.trim();
  const trimmedName = name.trim();
  const trimmedTg = tg.trim();
  const trimmedUrl = url.trim();
  const hasAny = trimmedName.length > 0 || trimmedDesc.length > 0;

  const firstLine = trimmedDesc.split("\n")[0]?.trim() ?? "";
  const guessedName =
    firstLine.length > 3 && firstLine.length < 50
      ? firstLine
      : trimmedName
        ? `${trimmedName} — Агент`
        : "Ваш Агент";

  const sellerLabel = trimmedTg
    ? `от ${trimmedTg.startsWith("@") ? trimmedTg : "@" + trimmedTg}`
    : trimmedName
      ? `от ${trimmedName}`
      : "от @продавца";

  const previewDesc = trimmedDesc
    ? trimmedDesc.length > 120
      ? trimmedDesc.slice(0, 117) + "…"
      : trimmedDesc
    : "Описание появится здесь...";

  const charCountLabel =
    desc.length < 20 ? `${desc.length} симв. — мин. 20` : `${desc.length} симв. ✓`;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setTopError(null);
    setErrors({});

    const payload = {
      name: trimmedName,
      contactEmail: email.trim(),
      contactTelegram: trimmedTg || null,
      agentDescription: trimmedDesc,
      existingUrl: trimmedUrl || null,
    };

    try {
      const res = await fetch("/api/seller-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 400 && data.details) setErrors(data.details);
        setTopError(data.error || "Не удалось отправить заявку. Попробуйте ещё раз.");
        return;
      }

      setSubmitted(true);
    } catch {
      setTopError("Сеть недоступна. Попробуйте ещё раз.");
    } finally {
      setSubmitting(false);
    }
  }

  const dateStr = applicationDate
    ? new Date(applicationDate).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className={styles.landing}>
      {/* HERO */}
      <section className={styles.hero}>
        <h1 className={styles.heroH1}>
          Поставьте своего
          <br />
          агента на полку
          <br />
          <em>hireon.</em>
        </h1>
        <p className={styles.heroSub}>
          <strong>0% комиссии.</strong> Прямые продажи.&nbsp;
          <strong>Бесплатное размещение.</strong>
        </p>
        <div className={styles.heroActions}>
          <a href="#seller-form" className={styles.btnPrimary}>
            Подать заявку
          </a>
        </div>

        <div className={styles.vitrinaWrap}>
          <div className={styles.vitrinaFadeLeft} />
          <div className={styles.vitrinaFadeRight} />
          <div className={styles.vitrinaScroll}>
            {VITRINA_LEFT.map((c) => (
              <DummyCard key={c.name} {...c} />
            ))}

            <div
              className={styles.slotWrap}
              ref={slotWrapRef}
              onMouseMove={handleSlotMove}
              onMouseLeave={handleSlotLeave}
              onClick={handleSlotClick}
            >
              <div className={styles.slotCard} ref={slotCardRef}>
                <div className={styles.slotTag}>свободно</div>
                <div className={styles.slotLabel}>
                  ЗДЕСЬ БУДЕТ
                  <br />
                  ВАШ АГЕНТ
                </div>
                <div className={styles.slotDash} />
                <div className={styles.slotHint}>
                  Займите место
                  <br />в каталоге Hireon
                </div>
                <div className={styles.slotPulse} />
              </div>
            </div>

            {VITRINA_RIGHT.map((c) => (
              <DummyCard key={c.name} {...c} />
            ))}
          </div>
        </div>
      </section>

      {/* FACTS */}
      <section className={styles.facts}>
        <div className={styles.factsStatement}>
          <div className={styles.factsStatementLine}>
            <span className={styles.fsNum}>0%</span>
            <span className={styles.fsWord}>комиссии.</span>
          </div>
          <p className={styles.factsTagline}>
            Покупатель платит вам напрямую. Без посредников и удержаний.
          </p>
        </div>

        <div className={styles.factsList}>
          <div className={styles.factsListItem}>
            <div className={styles.fliLabel}>размещение</div>
            <div className={styles.fliTitle}>Размещение бесплатно</div>
            <div className={styles.fliDesc}>
              Создать карточку и попасть в каталог — бесплатно. Платные
              инструменты — для тех, кто хочет больше охвата.
            </div>
          </div>
          <div className={styles.factsListItem}>
            <div className={styles.fliLabel}>модерация</div>
            <div className={styles.fliTitle}>1–2 рабочих дня</div>
            <div className={styles.fliDesc}>
              Ручная проверка каждой заявки. Не автоматическая помойка —
              реальный отбор.
            </div>
          </div>
          <div className={styles.factsListItem}>
            <div className={styles.fliLabel}>контакт</div>
            <div className={styles.fliTitle}>Прямо к вам</div>
            <div className={styles.fliDesc}>
              Покупатель жмёт «Перейти к продавцу» и попадает на ваш сайт,
              Telegram или форму.
            </div>
          </div>
        </div>
      </section>

      {/* FORM */}
      <section className={styles.formSection}>
        <div className={styles.formHeader} id="seller-form">
          <h2>
            Занять полку
            <br />
            <em>в каталоге.</em>
          </h2>
          <p>// бесплатно — ответим в Telegram в течение нескольких часов</p>
        </div>

        <div className={styles.formLayout}>
          <div>
            {hasPendingApplication ? (
              <div className={styles.notice}>
                <div className={styles.noticeCheck}>·</div>
                <p>
                  <strong>Заявка на рассмотрении.</strong>
                  <br />
                  {dateStr ? `Получена ${dateStr}. ` : null}
                  Свяжемся в течение 1–2 рабочих дней по контактам, указанным в
                  заявке. После одобрения здесь появится кабинет продавца.
                </p>
              </div>
            ) : submitted ? (
              <div className={styles.notice}>
                <div className={styles.noticeCheck}>✓</div>
                <p>
                  <strong>Заявка принята.</strong>
                  <br />
                  Напишем в Telegram или на Email в течение 1–2 рабочих дней.
                  Скоро ваш агент будет в каталоге.
                </p>
              </div>
            ) : (
              <form className={styles.formFields} onSubmit={onSubmit} noValidate>
                <div className={styles.field}>
                  <label htmlFor="bsl-name">
                    Ваше имя <span>*</span>
                  </label>
                  <input
                    id="bsl-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Иван Иванов"
                    autoComplete="off"
                    maxLength={120}
                    required
                  />
                  {errors.name && <FieldError msgs={errors.name} />}
                </div>

                <div className={styles.field}>
                  <label htmlFor="bsl-email">
                    Email <span>*</span>
                  </label>
                  <input
                    id="bsl-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ivan@example.com"
                    autoComplete="off"
                    maxLength={255}
                    required
                  />
                  {errors.contactEmail && <FieldError msgs={errors.contactEmail} />}
                </div>

                <div className={styles.field}>
                  <label htmlFor="bsl-tg">Telegram</label>
                  <input
                    id="bsl-tg"
                    type="text"
                    value={tg}
                    onChange={(e) => setTg(e.target.value)}
                    placeholder="@username"
                    autoComplete="off"
                    maxLength={80}
                  />
                  {errors.contactTelegram && <FieldError msgs={errors.contactTelegram} />}
                </div>

                <div className={styles.field}>
                  <label htmlFor="bsl-desc">
                    Расскажите про агента <span>*</span>
                  </label>
                  <textarea
                    id="bsl-desc"
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder="Что делает, для каких задач, на чём построен..."
                    minLength={20}
                    maxLength={2000}
                    required
                  />
                  <div
                    className={`${styles.charCount} ${desc.length >= 20 ? styles.charCountOk : ""}`}
                  >
                    {charCountLabel}
                  </div>
                  {errors.agentDescription && (
                    <FieldError msgs={errors.agentDescription} />
                  )}
                </div>

                <div className={styles.field}>
                  <label htmlFor="bsl-url">Ссылка на агента / демо</label>
                  <input
                    id="bsl-url"
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://t.me/youragent"
                    autoComplete="off"
                    maxLength={500}
                  />
                  {errors.existingUrl && <FieldError msgs={errors.existingUrl} />}
                </div>

                {topError && <div className={styles.topError}>{topError}</div>}

                <button type="submit" className={styles.submitBtn} disabled={submitting}>
                  {submitting ? "Отправляем..." : "Отправить заявку →"}
                </button>
                <div className={styles.formNote}>
                  Нажимая кнопку, вы соглашаетесь с{" "}
                  <a href="/terms">офертой</a>. Данные не передаются третьим
                  лицам.
                </div>
              </form>
            )}
          </div>

          <div className={styles.previewCol}>
            <div className={styles.previewLabel}>Превью карточки в каталоге</div>

            <div className={styles.previewBgCards}>
              <div className={styles.previewBgCard}>
                <div className={styles.pbcTag}>Поддержка</div>
                <div className={styles.pbcTitle}>Telegram Support Bot</div>
                <div className={styles.pbcPrice}>1 900₽/мес</div>
              </div>
              <div className={styles.previewBgCard}>
                <div className={styles.pbcTag}>Контент</div>
                <div className={styles.pbcTitle}>Content Writer Pro</div>
                <div className={styles.pbcPrice}>1 500₽/мес</div>
              </div>
            </div>

            <div className={styles.previewCard}>
              {!hasAny ? (
                <div className={styles.previewEmpty}>
                  <div className={styles.previewEmptyLabel}>
                    [ ЗДЕСЬ БУДЕТ
                    <br />
                    ВАШ АГЕНТ ]
                  </div>
                  <div className={styles.previewEmptyHint}>
                    // начните заполнять форму
                  </div>
                </div>
              ) : (
                <div className={styles.previewFilled}>
                  <div className={styles.pcCat}>Агент</div>
                  <div className={styles.pcName}>{guessedName}</div>
                  <div className={styles.pcSeller}>{sellerLabel}</div>
                  <div className={styles.pcDesc}>{previewDesc}</div>
                  <div className={styles.pcFooter}>
                    {trimmedUrl ? (
                      <div className={styles.pcDemoBadge}>демо доступно</div>
                    ) : (
                      <span />
                    )}
                    <div className={styles.pcTelegram}>{trimmedTg}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function DummyCard({
  cat,
  name,
  rating,
  desc,
  price,
  seller,
}: {
  cat: string;
  name: string;
  rating: string;
  desc: string;
  price: string;
  seller: string;
}) {
  return (
    <div className={styles.agentCard}>
      <div className={styles.agentCardCat}>{cat}</div>
      <div className={styles.agentCardName}>{name}</div>
      <div className={styles.agentCardRating}>{rating}</div>
      <div className={styles.agentCardDesc}>{desc}</div>
      <div className={styles.agentCardFooter}>
        <div className={styles.agentCardPrice}>{price}</div>
        <div className={styles.agentCardSeller}>{seller}</div>
      </div>
    </div>
  );
}

function FieldError({ msgs }: { msgs: string[] }) {
  return <p className={styles.fieldError}>{msgs.join(", ")}</p>;
}
