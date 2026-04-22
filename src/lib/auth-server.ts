import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "./auth";
import { db } from "./db";
import { profiles } from "./db/schema";

type SessionOptions = {
  disableCookieCache?: boolean;
};

const DELETED_AT_SCHEMA_CACHE_TTL_MS = 60_000;

let deletedAtSchemaState:
  | {
      available: boolean;
      checkedAt: number;
    }
  | null = null;

function isMissingDeletedAtColumnError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const pgError = error as {
    code?: string;
    column?: string;
    message?: string;
  };

  return (
    pgError.code === "42703" &&
    (pgError.column === "deleted_at" || pgError.message?.includes("deleted_at") === true)
  );
}

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

  const canSkipDeletedAtCheck =
    deletedAtSchemaState?.available === false &&
    Date.now() - deletedAtSchemaState.checkedAt < DELETED_AT_SCHEMA_CACHE_TTL_MS;

  if (canSkipDeletedAtCheck) {
    return user;
  }

  try {
    const [profile] = await db
      .select({ deletedAt: profiles.deletedAt })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);

    deletedAtSchemaState = {
      available: true,
      checkedAt: Date.now(),
    };

    if (profile?.deletedAt) {
      return null;
    }
  } catch (error) {
    if (!isMissingDeletedAtColumnError(error)) {
      throw error;
    }

    const wasUnavailable = deletedAtSchemaState?.available === false;
    deletedAtSchemaState = {
      available: false,
      checkedAt: Date.now(),
    };

    if (!wasUnavailable) {
      console.error(
        "profiles.deleted_at is missing in the database; skipping soft-delete session guard until the migration is applied.",
        error,
      );
    }
  }

  return user;
}
