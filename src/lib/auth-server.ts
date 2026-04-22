import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "./auth";
import { db } from "./db";
import { profiles } from "./db/schema";

type SessionOptions = {
  disableCookieCache?: boolean;
};

export async function getSession(options?: SessionOptions) {
  const session = await auth.api.getSession({
    headers: await headers(),
    ...(options?.disableCookieCache
      ? {
          query: {
            disableCookieCache: true,
          },
        }
      : {}),
  });
  return session;
}

export async function getUser(options?: SessionOptions) {
  const session = await getSession(options);
  const user = session?.user ?? null;
  if (!user) {
    return null;
  }

  const [profile] = await db
    .select({ deletedAt: profiles.deletedAt })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (profile?.deletedAt) {
    return null;
  }

  return user;
}
