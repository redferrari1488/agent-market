import {
  pgTable,
  uuid,
  text,
  integer,
  real,
  timestamp,
  jsonb,
  bigint,
  boolean,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

export type CryptoWallets = {
  usdt_trc20?: string;
  usdc_sol?: string;
  btc?: string;
};

// ============================================
// BetterAuth таблицы
// ============================================
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").unique().notNull(),
  emailVerified: boolean("emailVerified").default(false),
  image: text("image"),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  token: text("token").unique().notNull(),
  expiresAt: timestamp("expiresAt", { withTimezone: true }).notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow(),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt", { withTimezone: true }),
  password: text("password"),
  scope: text("scope"),
  idToken: text("idToken"),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt", { withTimezone: true }).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow(),
});

// ============================================
// Profiles
// ============================================
export const profiles = pgTable(
  "profiles",
  {
    id: text("id").primaryKey(),
    email: text("email").unique(),
    name: text("name"),
    avatarUrl: text("avatar_url"),
    role: text("role").default("buyer").notNull(),
    telegramId: bigint("telegram_id", { mode: "number" }).unique(),
    telegramUsername: text("telegram_username"),
    yookassaAccountId: text("yookassa_account_id"),
    cryptoWallets: jsonb("crypto_wallets").$type<CryptoWallets | null>(),
    onboardingData: jsonb("onboarding_data"),
    onboardingStatus: text("onboarding_status"),
    bio: text("bio"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("idx_profiles_telegram_id").on(t.telegramId),
  ]
);

// ============================================
// Agents
// ============================================
export const agents = pgTable(
  "agents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sellerId: text("seller_id").references(() => profiles.id),
    slug: text("slug").unique().notNull(),
    name: text("name").notNull(),
    description: text("description"),
    longDescription: text("long_description"),
    category: text("category"),
    pricingModel: text("pricing_model").default("subscription").notNull(),
    priceMonthly: integer("price_monthly"),
    priceOnetime: integer("price_onetime"),
    priceMonthlyUsd: integer("price_monthly_usd"),
    priceOnetimeUsd: integer("price_onetime_usd"),
    yookassaProductId: text("yookassa_product_id"),
    cryptoPlanId: text("crypto_plan_id"),
    features: jsonb("features").default([]),
    keywords: text("keywords").array().notNull().default(sql`'{}'::text[]`),
    setupSchema: jsonb("setup_schema").default([]),
    dockerImage: text("docker_image"),
    envTemplate: jsonb("env_template").default({}),
    computeClass: text("compute_class").default("S").notNull(),
    needsCron: boolean("needs_cron").default(false).notNull(),
    status: text("status").default("draft").notNull(),
    waitlistOnly: boolean("waitlist_only").default(false).notNull(),
    externalUrl: text("external_url"),
    brand: text("brand"),
    ratingAvg: real("rating_avg").default(0).notNull(),
    ratingCount: integer("rating_count").default(0).notNull(),
    purchasesCount: integer("purchases_count").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("idx_agents_category").on(t.category),
    index("idx_agents_status").on(t.status),
    index("idx_agents_seller_id").on(t.sellerId),
    index("idx_agents_keywords").using("gin", t.keywords),
  ]
);

// ============================================
// Subscriptions
// ============================================
export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").references(() => profiles.id).notNull(),
    agentId: uuid("agent_id").references(() => agents.id).notNull(),
    purchaseType: text("purchase_type").default("subscription").notNull(),
    paymentProvider: text("payment_provider"),
    providerSubscriptionId: text("provider_subscription_id"),
    providerPaymentId: text("provider_payment_id"),
    amount: integer("amount"),
    sellerPrice: integer("seller_price"),
    currency: text("currency").default("RUB"),
    status: text("status").default("pending_setup").notNull(),
    containerId: text("container_id"),
    config: jsonb("config").default({}),
    startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("idx_subscriptions_user_id").on(t.userId),
    index("idx_subscriptions_agent_id").on(t.agentId),
    index("idx_subscriptions_provider_payment_id").on(t.providerPaymentId),
    index("idx_subscriptions_provider_subscription_id").on(t.providerSubscriptionId),
    // Под cron yookassa-recurring (фильтр active + window expires_at ± 24h).
    index("idx_subscriptions_expires_status").on(t.expiresAt, t.status),
  ]
);

// ============================================
// Reviews
// ============================================
export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").references(() => profiles.id).notNull(),
    agentId: uuid("agent_id").references(() => agents.id).notNull(),
    subscriptionId: uuid("subscription_id").references(() => subscriptions.id),
    rating: integer("rating").notNull(),
    text: text("text"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    unique("reviews_user_agent_unique").on(t.userId, t.agentId),
    index("idx_reviews_agent_id").on(t.agentId),
  ]
);

// ============================================
// Agent Logs
// ============================================
export const agentLogs = pgTable(
  "agent_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    subscriptionId: uuid("subscription_id").references(() => subscriptions.id).notNull(),
    message: text("message"),
    level: text("level").default("info").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("idx_agent_logs_subscription_id").on(t.subscriptionId),
    index("idx_agent_logs_created_at").on(t.createdAt),
  ]
);

// ============================================
// Payouts
// ============================================
export const payouts = pgTable(
  "payouts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sellerId: text("seller_id").references(() => profiles.id).notNull(),
    paymentProvider: text("payment_provider"),
    subscriptionId: uuid("subscription_id").references(() => subscriptions.id),
    amount: integer("amount").notNull(),
    currency: text("currency").default("RUB"),
    providerTransferId: text("provider_transfer_id"),
    retryCount: integer("retry_count").default(0).notNull(),
    lastError: text("last_error"),
    status: text("status").default("pending").notNull(),
    periodStart: timestamp("period_start", { withTimezone: true }),
    periodEnd: timestamp("period_end", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("idx_payouts_seller_id").on(t.sellerId),
    index("idx_payouts_subscription_id").on(t.subscriptionId),
  ]
);

// ============================================
// Access Requests (waitlist для сторонних агентов в pre-launch)
// ============================================
export const accessRequests = pgTable(
  "access_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agentId: uuid("agent_id").references(() => agents.id, { onDelete: "cascade" }).notNull(),
    buyerId: text("buyer_id").references(() => profiles.id, { onDelete: "set null" }),
    buyerEmail: text("buyer_email").notNull(),
    buyerTelegram: text("buyer_telegram"),
    message: text("message"),
    status: text("status").default("pending").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("idx_access_requests_agent_id").on(t.agentId),
    index("idx_access_requests_buyer_id").on(t.buyerId),
    index("idx_access_requests_status").on(t.status),
    index("idx_access_requests_created_at").on(t.createdAt),
  ]
);

// ============================================
// Seller Applications (manual moderation для приёма продавцов в Phase 0)
// ============================================
export const sellerApplications = pgTable(
  "seller_applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").references(() => profiles.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    contactEmail: text("contact_email").notNull(),
    contactTelegram: text("contact_telegram"),
    agentDescription: text("agent_description").notNull(),
    existingUrl: text("existing_url"),
    status: text("status").default("pending").notNull(),
    notes: text("notes"),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    decidedBy: text("decided_by").references(() => profiles.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("idx_seller_applications_status").on(t.status),
    index("idx_seller_applications_user_id").on(t.userId),
    index("idx_seller_applications_created_at").on(t.createdAt),
  ]
);

export const agentWaitlistSignups = pgTable(
  "agent_waitlist_signups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agentId: uuid("agent_id").references(() => agents.id, { onDelete: "cascade" }).notNull(),
    email: text("email").notNull(),
    userId: text("user_id").references(() => profiles.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("idx_agent_waitlist_agent_id").on(t.agentId)]
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorId: text("actor_id"),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id"),
    payload: jsonb("payload").default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("idx_audit_logs_actor_id").on(t.actorId),
    index("idx_audit_logs_target_id").on(t.targetId),
    index("idx_audit_logs_created_at").on(t.createdAt),
  ]
);

// ============================================
// Relations
// ============================================
export const profilesRelations = relations(profiles, ({ many }) => ({
  agents: many(agents),
  subscriptions: many(subscriptions),
  reviews: many(reviews),
  payouts: many(payouts),
}));

export const agentsRelations = relations(agents, ({ one, many }) => ({
  seller: one(profiles, { fields: [agents.sellerId], references: [profiles.id] }),
  subscriptions: many(subscriptions),
  reviews: many(reviews),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
  user: one(profiles, { fields: [subscriptions.userId], references: [profiles.id] }),
  agent: one(agents, { fields: [subscriptions.agentId], references: [agents.id] }),
  reviews: many(reviews),
  logs: many(agentLogs),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(profiles, { fields: [reviews.userId], references: [profiles.id] }),
  agent: one(agents, { fields: [reviews.agentId], references: [agents.id] }),
  subscription: one(subscriptions, { fields: [reviews.subscriptionId], references: [subscriptions.id] }),
}));

export const agentLogsRelations = relations(agentLogs, ({ one }) => ({
  subscription: one(subscriptions, { fields: [agentLogs.subscriptionId], references: [subscriptions.id] }),
}));

export const payoutsRelations = relations(payouts, ({ one }) => ({
  seller: one(profiles, { fields: [payouts.sellerId], references: [profiles.id] }),
}));

export const accessRequestsRelations = relations(accessRequests, ({ one }) => ({
  agent: one(agents, { fields: [accessRequests.agentId], references: [agents.id] }),
  buyer: one(profiles, { fields: [accessRequests.buyerId], references: [profiles.id] }),
}));
