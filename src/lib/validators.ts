import { z } from "zod";

// Профиль
export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  avatar_url: z.string().url().optional(),
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
    docker_image: z.string().min(1),
    features: z.array(z.string()).max(20).default([]),
    setup_schema: z
      .array(
        z.object({
          key: z.string().min(1),
          label: z.string().min(1),
          type: z.enum(["text", "textarea", "password", "select"]),
          options: z.array(z.string()).optional(),
          required: z.boolean().default(true),
        })
      )
      .default([]),
    compute_class: z.enum(["S", "M", "L"]).default("S"),
    env_template: z.record(z.string(), z.string()).default({}),
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

// Конфиг подписки (динамический — на основе setup_schema)
export const subscriptionConfigSchema = z.record(z.string(), z.string());

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

// Checkout (будет подключён к YooKassa/Cryptomus на финальном этапе)
export const checkoutSchema = z.object({
  agent_id: z.string().uuid(),
  purchase_type: z.enum(["subscription", "one_time"]),
  payment_provider: z.enum(["yookassa", "cryptomus"]),
});
