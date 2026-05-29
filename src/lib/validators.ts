import { z } from "zod";

// Профиль
export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  avatar_url: z.string().url().max(2048).optional(),
});

// Агент — создание/редактирование
export const agentSchema = z
  .object({
    name: z.string().min(2).max(100),
    slug: z
      .string()
      .min(2)
      .max(100)
      .regex(/^[a-z0-9-]+$/, "Только строчные буквы, цифры и дефисы"),
    description: z.string().min(10).max(300),
    long_description: z.string().max(10000).optional(),
    category: z.enum([
      "support",
      "content",
      "analytics",
      "sales",
      "monitoring",
    ]),
    pricing_model: z.enum(["subscription", "one_time", "both"]),
    price_monthly: z.number().int().min(10000).max(10000000).nullable().optional(), // в копейках RUB (100₽ — 100k₽)
    price_onetime: z.number().int().min(10000).max(100000000).nullable().optional(), // в копейках RUB (100₽ — 1M₽)
    // Формат docker image: [registry/]name[:tag|@digest]. Запрещаем shell-метасимволы,
    // переводы строк, опасные подстановки — image передаётся в docker.pull/createContainer.
    docker_image: z
      .string()
      .min(1)
      .max(256)
      .regex(
        /^[a-zA-Z0-9][a-zA-Z0-9._\-/]{0,200}(:[\w][\w.\-]{0,127})?(@sha256:[a-f0-9]{64})?$/,
        "Невалидный формат docker image",
      ),
    features: z.array(z.string().max(200)).max(20).default([]),
    keywords: z
      .array(z.string().trim().toLowerCase().min(1).max(40))
      .max(30)
      .default([]),
    setup_schema: z
      .array(
        z.object({
          key: z.string().min(1).max(64),
          label: z.string().min(1).max(200),
          type: z.enum(["text", "textarea", "password", "select", "json_array"]),
          options: z.array(z.string().max(200)).max(50).optional(),
          required: z.boolean().default(true),
        })
      )
      .max(64)
      .default([]),
    compute_class: z.enum(["S", "M", "L"]).default("S"),
    needs_cron: z.boolean().optional(),
    // env_template — статичные переменные продавца. Жёсткие лимиты на ключи/значения,
    // иначе через JSONB blob атакующий sellerа раздувает agents row до OOM на /agents/[slug].
    env_template: z
      .record(z.string().min(1).max(64), z.string().max(2048))
      .refine((obj) => Object.keys(obj).length <= 64, {
        message: "Слишком много переменных в env_template (максимум 64)",
      })
      .default({}),
  })
  .refine(
    (d) =>
      d.pricing_model === "subscription"
        ? !!d.price_monthly
        : d.pricing_model === "one_time"
          ? !!d.price_onetime
          : !!d.price_monthly && !!d.price_onetime,
    {
      message:
        "Для выбранной модели нужно указать цену (price_monthly и/или price_onetime)",
    }
  );

// Конфиг подписки (динамический — на основе setup_schema).
// Лимиты на ключ/значение — защита от заливания тяжёлых блобов в БД.
// 64 ключей x 8KB = до ~512KB сырого конфига на одну подписку.
export const subscriptionConfigSchema = z
  .record(z.string().max(128), z.string().max(8192))
  .refine((obj) => Object.keys(obj).length <= 64, {
    message: "Слишком много полей конфига (максимум 64)",
  });

// Отзыв
export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  text: z.string().max(2000).optional(),
});

// Модерация агента
export const moderateAgentSchema = z.object({
  action: z.enum(["approve", "reject"]),
  comment: z.string().max(1000).optional(),
});

export const yookassaOnboardingDataSchema = z
  .object({
    entityType: z.enum(["ip", "ooo", "self_employed"]),
    inn: z.string().regex(/^\d{10,12}$/),
    legalName: z.string().min(2).max(255),
    legalAddress: z.string().min(5).max(500),
    email: z.string().email(),
    phone: z.string().min(5).max(50),
    accountId: z.string().max(255).optional(),
  })
  .superRefine((data, ctx) => {
    const requiredLength = data.entityType === "ooo" ? 10 : 12;
    if (data.inn.length !== requiredLength) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["inn"],
        message:
          data.entityType === "ooo"
            ? "Для ООО ИНН должен содержать 10 цифр"
            : "Для ИП и самозанятых ИНН должен содержать 12 цифр",
      });
    }
  });

// Регулярки адресов криптокошельков:
//   USDT TRC-20 — base58, 34 символа, всегда начинается с T.
//   USDC Solana — base58 Solana (32-44 chars).
//   BTC — legacy/P2SH (1..., 3...) ИЛИ bech32 (bc1...).
const USDT_TRC20_RE = /^T[A-Za-z1-9]{33}$/;
const USDC_SOL_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const BTC_RE = /^(bc1[a-zA-HJ-NP-Z0-9]{25,87}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/;

export const nowpaymentsOnboardingDataSchema = z
  .object({
    usdt_trc20: z.string().regex(USDT_TRC20_RE).optional().or(z.literal("").transform(() => undefined)),
    usdc_sol: z.string().regex(USDC_SOL_RE).optional().or(z.literal("").transform(() => undefined)),
    btc: z.string().regex(BTC_RE).optional().or(z.literal("").transform(() => undefined)),
  })
  .superRefine((data, ctx) => {
    if (!data.usdt_trc20 && !data.usdc_sol && !data.btc) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["usdt_trc20"],
        message: "Укажи хотя бы один адрес кошелька",
      });
    }
  });

export const sellerOnboardingSchema = z.discriminatedUnion("provider", [
  z.object({
    provider: z.literal("yookassa"),
    data: yookassaOnboardingDataSchema,
  }),
  z.object({
    provider: z.literal("nowpayments"),
    data: nowpaymentsOnboardingDataSchema,
  }),
]);

export const adminOnboardingReviewSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("approve"),
    // YooKassa account id admin pastes after manually creating the seller in YooKassa dashboard.
    // For nowpayments-only sellers this stays undefined.
    yookassaAccountId: z.string().trim().min(1).max(64).optional(),
  }),
  z.object({
    action: z.literal("reject"),
    reason: z.string().trim().min(1).max(500),
  }),
]);

export const telegramAuthDataSchema = z.object({
  id: z.number().int().positive(),
  first_name: z.string().trim().min(1).max(100),
  last_name: z.string().trim().min(1).max(100).optional(),
  username: z.string().trim().min(1).max(100).optional(),
  photo_url: z.string().url().max(2048).optional(),
  auth_date: z.number().int().positive(),
  hash: z.string().trim().regex(/^[a-f0-9]{64}$/i),
});

export const deleteAccountSchema = z.object({
  email: z.string().trim().email().optional(),
  confirmation: z.string().trim().min(1).max(32).optional(),
});
