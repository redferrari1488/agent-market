import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { getUser } from "@/lib/auth-server";

export type Role = "buyer" | "seller" | "admin";

type SessionUser = NonNullable<Awaited<ReturnType<typeof getUser>>>;

export type RequireRoleResult =
  | { ok: true; user: SessionUser; role: Role }
  | { ok: false; response: NextResponse };

// Чистая проверка соответствия роли — вынесена ради юнит-тестов.
export function isRoleAllowed(
  role: string | null | undefined,
  allowed: readonly Role[],
): boolean {
  return role != null && (allowed as readonly string[]).includes(role);
}

// Единая проверка «авторизован + нужная роль» для API-роутов. Заменяет
// повторяющийся бойлерплейт getUser → select role → сравнение (M4/T8 аудита
// 2026-06-10). Возвращает либо готовый error-Response (его нужно вернуть из
// роута), либо user + role. forbiddenMessage позволяет сохранить точные тексты
// 403 конкретных роутов.
export async function requireRole(
  allowed: Role | readonly Role[],
  options?: { forbiddenMessage?: string },
): Promise<RequireRoleResult> {
  const roles = (Array.isArray(allowed) ? allowed : [allowed]) as readonly Role[];

  const user = await getUser();
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Не авторизован", code: 401 }, { status: 401 }),
    };
  }

  const [profile] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (!isRoleAllowed(profile?.role, roles)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: options?.forbiddenMessage ?? "Доступ запрещён", code: 403 },
        { status: 403 },
      ),
    };
  }

  return { ok: true, user, role: profile!.role as Role };
}
