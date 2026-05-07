"use client";

import { useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
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

// Витрина — синхронизирована с published-агентами в каталоге.
// Без рейтингов и фейковых @-хендлов: до набора массы соцпруф не показываем.
const VITRINA_LEFT = [
  {
    cat: "Поддержка",
    name: "Telegram Support Bot",
    desc: "Отвечает клиентам 24/7. Понимает контекст FAQ, не шаблонный.",
    price: "4 900₽/мес",
  },
  {
    cat: "Контент",
    name: "Контент-копирайтер",
    desc: "Пишет посты в Telegram по расписанию в вашем тоне и стиле.",
    price: "9 900₽/мес",
  },
  {
    cat: "Мониторинг",
    name: "Мониторинг сайтов",
    desc: "Следит за uptime и изменениями страниц. Уведомления в Telegram.",
    price: "5 900₽/мес",
  },
];

const VITRINA_RIGHT = [
  {
    cat: "Новости",
    name: "Дайджест новостей",
    desc: "Утренняя сводка по отрасли. RSS-ленты + краткий пересказ.",
    price: "3 900₽/мес",
  },
  {
    cat: "Аналитика",
    name: "Competitor Monitor",
    desc: "Следит за сайтами конкурентов. Ежедневный саммари в Telegram.",
    price: "8 900₽/мес",
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
        <h1 className={`${styles.heroH1} ${styles.fadeUp}`} style={{ animationDelay: "0.05s" }}>
          Поставьте своего
          <br />
          агента на полку
          <br />
          <em>hireon.</em>
        </h1>
        <p className={`${styles.heroSub} ${styles.fadeUp}`} style={{ animationDelay: "0.22s" }}>
          <strong>0% комиссии.</strong> Прямые продажи.&nbsp;
          <strong>Бесплатное размещение.</strong>
        </p>
        <div className={`${styles.heroActions} ${styles.fadeUp}`} style={{ animationDelay: "0.34s" }}>
          <a
            href="#seller-form"
            className="group inline-flex items-center gap-2 font-mono text-[12.5px] text-foreground transition-colors hover:text-primary"
          >
            <span className="text-primary">[</span>
            <span className="uppercase tracking-[0.12em]">подать заявку</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            <span className="text-primary">]</span>
          </a>
        </div>

        <div className={`${styles.vitrinaWrap} ${styles.fadeIn}`} style={{ animationDelay: "0.5s" }}>
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
        <div className={`${styles.factsStatement} ${styles.fadeUp}`}>
          <div className={styles.factsStatementLine}>
            <span className={styles.fsNum}>0%</span>
            <span className={styles.fsWord}>комиссии.</span>
          </div>
          <p className={styles.factsTagline}>
            Покупатель платит вам напрямую. Без посредников и удержаний.
          </p>
        </div>

        <div className={styles.factsList}>
          <div className={`${styles.factsListItem} ${styles.fadeUp}`} style={{ animationDelay: "0.1s" }}>
            <div className={styles.fliLabel}>размещение</div>
            <div className={styles.fliTitle}>Размещение бесплатно</div>
            <div className={styles.fliDesc}>
              Создать карточку и попасть в каталог — бесплатно. Платные
              инструменты — для тех, кто хочет больше охвата.
            </div>
          </div>
          <div className={`${styles.factsListItem} ${styles.fadeUp}`} style={{ animationDelay: "0.2s" }}>
            <div className={styles.fliLabel}>модерация</div>
            <div className={styles.fliTitle}>1–2 рабочих дня</div>
            <div className={styles.fliDesc}>
              Ручная проверка каждой заявки. Не автоматическая помойка —
              реальный отбор.
            </div>
          </div>
          <div className={`${styles.factsListItem} ${styles.fadeUp}`} style={{ animationDelay: "0.3s" }}>
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
        <div className={`${styles.formHeader} ${styles.fadeUp}`} id="seller-form">
          <h2>
            Занять полку
            <br />
            <em>в каталоге.</em>
          </h2>
          <p>// бесплатно — ответим в Telegram в течение нескольких часов</p>
        </div>

        <div className={`${styles.formLayout} ${styles.fadeUp}`} style={{ animationDelay: "0.18s" }}>
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
                <div className={styles.pbcPrice}>4 900₽/мес</div>
              </div>
              <div className={styles.previewBgCard}>
                <div className={styles.pbcTag}>Контент</div>
                <div className={styles.pbcTitle}>Контент-копирайтер</div>
                <div className={styles.pbcPrice}>9 900₽/мес</div>
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
  desc,
  price,
}: {
  cat: string;
  name: string;
  desc: string;
  price: string;
}) {
  return (
    <div className={styles.agentCard}>
      <div className={styles.agentCardCat}>{cat}</div>
      <div className={styles.agentCardName}>{name}</div>
      <div className={styles.agentCardDesc}>{desc}</div>
      <div className={styles.agentCardFooter}>
        <div className={styles.agentCardPrice}>{price}</div>
      </div>
    </div>
  );
}

function FieldError({ msgs }: { msgs: string[] }) {
  return <p className={styles.fieldError}>{msgs.join(", ")}</p>;
}
