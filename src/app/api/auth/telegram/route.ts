import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import {
  verifyTelegramAuth,
  telegramEmail,
  telegramDisplayName,
  type TelegramAuthData,
} from "@/lib/auth/telegram";

/**
 * POST /api/auth/telegram
 *
 * Верифицирует payload Telegram Login Widget, создаёт/находит юзера и
 * открывает BetterAuth-сессию через sign-in email+password.
 *
 * У Telegram-юзеров нет реального пароля, поэтому используем
 * детерминированный пароль HMAC(BETTER_AUTH_SECRET, "tg:<telegram_id>") —
 * один и тот же для того же Telegram-аккаунта, не хранится в чистом виде
 * нигде кроме HMAC-производной.
 */

function telegramPassword(telegramId: number): string {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) throw new Error("BETTER_AUTH_SECRET is not set");
  return crypto.createHmac("sha256", secret).update(`tg:${telegramId}`).digest("hex");
}

// Пропускаем Set-Cookie и (на всякий случай) другие заголовки из ответа
// BetterAuth в NextResponse, чтобы браузер получил cookie сессии.
function copyCookies(src: Response, dst: NextResponse) {
  const setCookie =
    typeof src.headers.getSetCookie === "function"
      ? src.headers.getSetCookie()
      : src.headers.get("set-cookie")
        ? [src.headers.get("set-cookie") as string]
        : [];
  for (const c of setCookie) dst.headers.append("set-cookie", c);
}

export async function POST(req: NextRequest) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return NextResponse.json(
      { error: "TELEGRAM_BOT_TOKEN не настроен", code: 500 },
      { status: 500 }
    );
  }

  let payload: TelegramAuthData;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json", code: 400 }, { status: 400 });
  }

  const check = verifyTelegramAuth(payload, botToken);
  if (!check.ok) {
    return NextResponse.json(
      { error: `Telegram auth failed: ${check.reason}`, code: 401 },
      { status: 401 }
    );
  }

  const telegramId = payload.id;
  const email = telegramEmail(telegramId);
  const displayName = telegramDisplayName(payload);
  const password = telegramPassword(telegramId);

  const [existingProfile] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.telegramId, telegramId))
    .limit(1);

  let userId: string;

  if (existingProfile) {
    userId = existingProfile.id;
  } else {
    const signUpRes = await auth.api.signUpEmail({
      body: { email, password, name: displayName },
    });

    if (!signUpRes?.user?.id) {
      return NextResponse.json(
        { error: "Не удалось создать пользователя", code: 500 },
        { status: 500 }
      );
    }

    userId = signUpRes.user.id;

    await db
      .update(profiles)
      .set({
        telegramId,
        telegramUsername: payload.username ?? null,
        avatarUrl: payload.photo_url ?? null,
      })
      .where(eq(profiles.id, userId));
  }

  // Пытаемся войти. У юзеров, созданных до перехода на детерминированный
  // пароль, пароль случайный — в этом случае чиним аккаунт (перезаписываем
  // хэш пароля через internalAdapter.updatePassword) и логинимся повторно.
  let signInRes = await auth.api
    .signInEmail({
      body: { email, password },
      asResponse: true,
      headers: req.headers,
    })
    .catch((e: unknown) => {
      const msg = e instanceof Error ? e.message : String(e);
      return new Response(JSON.stringify({ error: msg }), { status: 401 });
    });

  if (!signInRes.ok) {
    const ctx = await auth.$context;
    const hashed = await ctx.password.hash(password);
    await ctx.internalAdapter.updatePassword(userId, hashed);

    signInRes = await auth.api
      .signInEmail({
        body: { email, password },
        asResponse: true,
        headers: req.headers,
      })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : String(e);
        return new Response(JSON.stringify({ error: msg }), { status: 401 });
      });

    if (!signInRes.ok) {
      const errBody = await signInRes.text().catch(() => "");
      return NextResponse.json(
        { error: "Не удалось создать сессию", detail: errBody, code: 500 },
        { status: 500 }
      );
    }
  }

  const res = NextResponse.json({ data: { userId, email } });
  copyCookies(signInRes, res);
  return res;
}
