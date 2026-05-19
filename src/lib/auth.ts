import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db as database } from "./db";
import * as schema from "./db/schema";
import { profiles } from "./db/schema";
import { getTrustedOrigins } from "./trusted-origins";

// PKCE на всех OAuth провайдерах — закрывает GHSA-wxw3-q3m9-c3jr (better-auth
// принимал mismatched state при cookie-backed state storage без PKCE).
const socialProviders = {
  ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          requirePKCE: true,
        },
      }
    : {}),
  ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
    ? {
        github: {
          clientId: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
          requirePKCE: true,
        },
      }
    : {}),
};

const baseURL = process.env.NEXT_PUBLIC_APP_URL;
const trustedOrigins = getTrustedOrigins();

export const auth = betterAuth({
  database: drizzleAdapter(database, {
    provider: "pg",
    schema,
  }),
  baseURL,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
  },
  ...(Object.keys(socialProviders).length > 0 ? { socialProviders } : {}),
  advanced: {
    useSecureCookies: baseURL?.startsWith("https://") ?? false,
    defaultCookieAttributes: {
      sameSite: "lax",
      httpOnly: true,
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // Создаём profile при регистрации
          await database.insert(profiles).values({
            id: user.id,
            email: user.email,
            name: user.name,
            role: "buyer",
          }).onConflictDoNothing();
        },
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
