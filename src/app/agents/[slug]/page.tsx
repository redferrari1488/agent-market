import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";

// Каталог-каточки часто редактируются админом в БД (features, цены,
// описания). force-dynamic чтобы изменения сразу были видны на проде
// без передеплоя.
export const dynamic = "force-dynamic";

import { agents, profiles } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getUser } from "@/lib/auth-server";
import { PurchaseButton } from "@/components/agents/PurchaseButton";
import { ExternalAgentCTA } from "@/components/agents/ExternalAgentCTA";
import { WaitlistCTA } from "@/components/agents/WaitlistCTA";
import { categoryColor, categoryLabel } from "@/lib/category-color";
import styles from "./spec-sheet.module.css";

const CATEGORY_SLUG: Record<string, string> = {
  support: "support",
  content: "content",
  analytics: "analytics",
  monitoring: "monitor",
  sales: "sales",
  hr: "hr",
};

const SETUP_TYPE_LABEL: Record<string, string> = {
  text: "текст",
  textarea: "текст",
  password: "секрет",
  select: "выбор",
};

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const [agent] = await db
    .select({ name: agents.name, description: agents.description })
    .from(agents)
    .where(and(eq(agents.slug, slug), eq(agents.status, "published")))
    .limit(1);

  if (!agent) return { title: "Агент не найден" };
  return {
    title: `${agent.name} - hireon`,
    description: agent.description,
  };
}

export default async function AgentPage({ params }: { params: Params }) {
  const { slug } = await params;

  const [agent] = await db
    .select({
      id: agents.id,
      slug: agents.slug,
      name: agents.name,
      description: agents.description,
      longDescription: agents.longDescription,
      category: agents.category,
      priceMonthly: agents.priceMonthly,
      computeClass: agents.computeClass,
      purchasesCount: agents.purchasesCount,
      features: agents.features,
      setupSchema: agents.setupSchema,
      sellerId: agents.sellerId,
      externalUrl: agents.externalUrl,
      brand: agents.brand,
      waitlistOnly: agents.waitlistOnly,
    })
    .from(agents)
    .where(and(eq(agents.slug, slug), eq(agents.status, "published")))
    .limit(1);

  if (!agent) notFound();

  const user = await getUser();

  let sellerName: string | null = null;
  if (agent.sellerId) {
    const [seller] = await db
      .select({ name: profiles.name })
      .from(profiles)
      .where(eq(profiles.id, agent.sellerId))
      .limit(1);
    sellerName = seller?.name ?? null;
  }

  const cc = categoryColor(agent.category);
  const catLabel = categoryLabel(agent.category).toLowerCase();
  const catSlug = CATEGORY_SLUG[agent.category ?? ""] || agent.category || "agent";

  const isExternal = !!agent.sellerId;
  const isLockIn = !isExternal && agent.brand === "lock_in";
  const isHireon = !isExternal && !isLockIn;

  const kindLabel = isExternal
    ? "внешний"
    : isLockIn
      ? "партнёрский · lock-in"
      : "hireon";

  const featuresList: string[] = Array.isArray(agent.features) ? (agent.features as string[]) : [];
  const setupFields =
    Array.isArray(agent.setupSchema) && (agent.setupSchema as unknown[]).length > 0
      ? (agent.setupSchema as { key: string; label: string; type: string; required?: boolean }[])
      : [];

  const displayPriceMonthly = agent.priceMonthly;
  const formattedPrice =
    displayPriceMonthly != null
      ? `${(displayPriceMonthly / 100)
          .toFixed(0)
          .replace(/\B(?=(\d{3})+(?!\d))/g, " ")} ₽`
      : null;

  const sku = `ag · ${agent.id.replace(/-/g, "").slice(0, 8)}`;

  const steps = isExternal
    ? ["Перейти на сайт продавца", "Завести аккаунт у партнёра", "Использовать в кабинете"]
    : ["Подключить агента", "Заполнить настройки", "Агент работает 24/7"];

  const longBody = (agent.longDescription || agent.description || "").replace(/\*\*/g, "");

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <div
        className={styles.root}
        style={{ ["--cat" as string]: cc }}
      >
        {/* TOP STRIP */}
        <div className={`${styles.top} ${styles.mono} ${styles.lower}`}>
          <div className={styles.topLeft}>
            <Link href="/agents?browse=1" className={styles.back} aria-label="каталог">
              ←
            </Link>
            <span className={styles.crumb}>каталог / {catSlug}</span>
          </div>
          <div className={styles.topRight}>
            <span className={styles.sku}>{sku}</span>
            {isLockIn && <span className={`${styles.tag} ${styles.tagLock}`}>lock-in</span>}
            {isExternal && <span className={styles.tag}>внешний</span>}
            {isHireon && <span className={`${styles.tag} ${styles.tagHireon}`}>hireon</span>}
          </div>
        </div>

        {/* BODY — main + sticky aside side-by-side from the very top */}
        <div className={styles.body}>
          <main className={styles.main}>
            {/* compact hero — внутри main */}
            <div className={`${styles.cat} ${styles.lower}`}>
              <span className={styles.catDot} style={{ background: cc }} />
              <span style={{ color: cc }}>{catLabel}</span>
            </div>
            <h1 className={styles.name}>{agent.name}</h1>
            <div className={`${styles.dim} ${styles.lower}`} aria-hidden="true">
              <span className={styles.dimArrow}>|◂</span>
              <span className={styles.dimLine} />
              <span className={styles.dimLabel}>agent · {catSlug} · v1</span>
              <span className={styles.dimLine} />
              <span className={styles.dimArrow}>▸|</span>
            </div>
            {agent.description && <p className={styles.tagline}>{agent.description}</p>}

            {longBody && (
              <section className={styles.sec}>
                <div className={`${styles.secHead} ${styles.lower}`}>
                  <span className={styles.secNo}>01</span>
                  <span>описание</span>
                </div>
                <p className={styles.secBody}>{longBody}</p>
              </section>
            )}

            {featuresList.length > 0 && (
              <section className={styles.sec}>
                <div className={`${styles.secHead} ${styles.lower}`}>
                  <span className={styles.secNo}>02</span>
                  <span>возможности</span>
                </div>
                <ul className={styles.caps}>
                  {featuresList.map((c, i) => (
                    <li key={i}>
                      <span className={styles.capsNo}>{String(i + 1).padStart(2, "0")}</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {setupFields.length > 0 && (
              <section className={styles.sec}>
                <div className={`${styles.secHead} ${styles.lower}`}>
                  <span className={styles.secNo}>03</span>
                  <span>для настройки потребуется</span>
                </div>
                <div className={styles.conf}>
                  {setupFields.map((c, i) => {
                    const typeLabel = SETUP_TYPE_LABEL[c.type] || c.type;
                    const optional = c.required === false ? " · опц." : "";
                    return (
                      <div key={i} className={styles.confRow}>
                        <span className={styles.confK}>{c.label || c.key}</span>
                        <span className={styles.confDots} aria-hidden="true" />
                        <span className={`${styles.confT} ${styles.lower}`}>
                          {typeLabel}
                          {optional}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* HOW TO START — внутри main, тонкая strip */}
            <section className={styles.how}>
              <div className={`${styles.secHead} ${styles.howHead} ${styles.lower}`}>
                <span className={styles.secNo}>04</span>
                <span>как начать</span>
              </div>
              <ol className={styles.steps}>
                {steps.map((s, i) => (
                  <li key={i}>
                    <span className={styles.stepNo}>0{i + 1}</span>
                    <span className={styles.stepText}>{s}</span>
                  </li>
                ))}
              </ol>
            </section>
          </main>

          {/* ASIDE — sticky, starts at top */}
          <aside className={styles.aside}>
            <div className={styles.buy}>
              {isExternal ? (
                <ExternalAgentCTA externalUrl={agent.externalUrl} sellerName={sellerName} />
              ) : agent.waitlistOnly ? (
                <WaitlistCTA agentId={agent.id} agentName={agent.name} accentColor={cc} />
              ) : (
                <PurchaseButton
                  agentId={agent.id}
                  pricingModel="subscription"
                  priceMonthly={displayPriceMonthly}
                  priceOnetime={null}
                  isLoggedIn={!!user}
                  accentColor={cc}
                />
              )}
              {!agent.waitlistOnly && (
                <p className={styles.buyNote}>
                  {isExternal
                    ? "Открывается сайт продавца. Оплата и настройка проходят там."
                    : "Хостинг и AI включены. Оплата картой или криптой, отмена в любое время."}
                </p>
              )}
            </div>

            <div className={`${styles.meta} ${styles.lower}`}>
              <div className={styles.metaRow}>
                <span className={styles.metaK}>категория</span>
                <span className={styles.metaV} style={{ color: cc }}>
                  {catLabel}
                </span>
              </div>
              {isExternal && sellerName && (
                <div className={styles.metaRow}>
                  <span className={styles.metaK}>продавец</span>
                  <span className={styles.metaV}>{sellerName}</span>
                </div>
              )}
              {!isExternal && !agent.waitlistOnly && formattedPrice && (
                <div className={styles.metaRow}>
                  <span className={styles.metaK}>цена</span>
                  <span className={styles.metaV}>{formattedPrice} /мес</span>
                </div>
              )}
              {agent.purchasesCount >= 3 && (
                <div className={styles.metaRow}>
                  <span className={styles.metaK}>подключений</span>
                  <span className={styles.metaV}>{agent.purchasesCount}</span>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
