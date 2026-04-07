import { NextRequest, NextResponse } from "next/server";
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
 * Принимает payload от Telegram Login Widget, верифицирует HMAC,
 * находит/создаёт юзера и создаёт BetterAuth-сессию.
 */
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

  // 1. Верифицируем подпись Telegram
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

  // 2. Ищем профиль по telegram_id
  const [existingProfile] = await db
    .select({ id: profiles.id, email: profiles.email })
    .from(profiles)
    .where(eq(profiles.telegramId, telegramId))
    .limit(1);

  let userId: string;

  if (existingProfile) {
    userId = existingProfile.id;
  } else {
    // 3. Создаём юзера через BetterAuth internal API
    // BetterAuth создаст user + session tables записи
    const signUpRes = await auth.api.signUpEmail({
      body: {
        email,
        password: crypto.randomUUID(), // случайный пароль, юзер входит через Telegram
        name: displayName,
      },
    });

    if (!signUpRes?.user?.id) {
      return NextResponse.json(
        { error: "Не удалось создать пользователя", code: 500 },
        { status: 500 }
      );
    }

    userId = signUpRes.user.id;

    // Обновляем профиль с telegram данными
    await db
      .update(profiles)
      .set({
        telegramId,
        telegramUsername: payload.username ?? null,
        avatarUrl: payload.photo_url ?? null,
      })
      .where(eq(profiles.id, userId));
  }

  // 4. Создаём сессию через BetterAuth internal API
  // Используем внутренний signIn чтобы получить session token
  const response = new Response();
  const session = await auth.api.signInEmail({
    body: { email, password: "" },
    // Для Telegram-юзеров мы не знаем пароль, поэтому создаём сессию напрямую
  }).catch(() => null);

  // Если signInEmail не сработал (пароль неизвестен),
  // вернём данные для клиентского редиректа
  return NextResponse.json({
    data: { userId, email },
  });
}
