import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
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
 * находит/создаёт Supabase-юзера и возвращает клиенту token_hash,
 * которым тот завершит логин через supabase.auth.verifyOtp.
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

  // 2. Admin-клиент Supabase (service role) — для admin.* операций
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // 3. Проверяем, есть ли уже профиль с таким telegram_id
  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id, email")
    .eq("telegram_id", telegramId)
    .maybeSingle();

  let userEmail: string;

  if (existingProfile) {
    userEmail = existingProfile.email ?? email;
  } else {
    // 4. Создаём нового auth.users (trigger создаст profiles)
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        name: displayName,
        avatar_url: payload.photo_url ?? null,
        telegram_id: String(telegramId),
        telegram_username: payload.username ?? "",
      },
    });

    if (createErr || !created?.user) {
      return NextResponse.json(
        { error: `createUser: ${createErr?.message ?? "unknown"}`, code: 500 },
        { status: 500 }
      );
    }
    userEmail = email;
  }

  // 5. Генерируем magic link → получаем hashed_token
  const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: userEmail,
  });

  if (linkErr || !link?.properties?.hashed_token) {
    return NextResponse.json(
      { error: `generateLink: ${linkErr?.message ?? "no hashed_token"}`, code: 500 },
      { status: 500 }
    );
  }

  return NextResponse.json({
    data: {
      token_hash: link.properties.hashed_token,
      email: userEmail,
    },
  });
}
