import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "./auth";
import { db } from "./db";
import { profiles } from "./db/schema";
import { logger } from "./logger";

type SessionOptions = {
  disableCookieCache?: boolean;
};

// 5 секунд — компромисс. Кэшируем «schema.deleted_at пока ещё не накатан»,
// чтобы во время инцидента не спамить 42703 на каждом запросе. Дольше —
// растёт окно, в которое удалённый юзер ходит через ещё валидную сессию.
const DELETED_AT_SCHEMA_CACHE_TTL_MS = 5_000;

let deletedAtSchemaState:
  | {
      available: boolean;
      checkedAt: number;
    }
  | null = null;

// Принудительная инвалидация. Вызывается из /api/account/delete — после
// soft-delete'а соседние ноды/воркеры узнают о новом состоянии сразу,
// а не через TTL. На одной ноде это просто сбрасывает «schema unavailable»
// fallback (если был); на проде schema давно накатана, поэтому фактически
// no-op в hot-path, но дёшево и страхует.
export function invalidateAuthCache() {
  deletedAtSchemaState = null;
}

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
      logger.error(
        { err: error },
        "profiles.deleted_at missing; skipping soft-delete session guard until migration is applied",
      );
    }
  }

  return user;
}
