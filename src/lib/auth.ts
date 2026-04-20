import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { captcha } from "better-auth/plugins";
import { db as database } from "./db";
import * as schema from "./db/schema";
import { profiles } from "./db/schema";

const socialProviders = {
  ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        },
      }
    : {}),
  ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
    ? {
        github: {
          clientId: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
        },
      }
    : {}),
};

const baseURL = process.env.NEXT_PUBLIC_APP_URL;
const turnstileEnabled = Boolean(
  process.env.TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET,
);
const trustedOrigins = [
  ...(baseURL ? [baseURL] : []),
  "https://hireon.agency",
  "https://www.hireon.agency",
];

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
  ...(turnstileEnabled
    ? {
        plugins: [
          captcha({
            provider: "cloudflare-turnstile",
            secretKey: process.env.TURNSTILE_SECRET!,
            endpoints: ["/sign-in/email", "/sign-up/email"],
          }),
        ],
      }
    : {}),
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
