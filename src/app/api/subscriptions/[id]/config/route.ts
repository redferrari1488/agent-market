import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { encrypt } from "@/lib/encryption";
import { subscriptionConfigSchema } from "@/lib/validators";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = subscriptionConfigSchema.safeParse(body.config);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Неверные данные", code: 400 },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Не авторизован", code: 401 }, { status: 401 });
    }

    // Проверяем владение подпиской
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("id, user_id, status")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!sub) {
      return NextResponse.json({ error: "Подписка не найдена", code: 404 }, { status: 404 });
    }

    // Шифруем каждое значение
    const encryptedConfig: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed.data)) {
      encryptedConfig[key] = encrypt(value);
    }

    // Сохраняем и меняем статус на paused (готов к запуску, Day 5 поднимет контейнер)
    const { error } = await supabase
      .from("subscriptions")
      .update({
        config: encryptedConfig,
        status: "paused",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error("Config save error:", error);
      return NextResponse.json(
        { error: "Ошибка сохранения", code: 500 },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: { ok: true } });
  } catch (error) {
    console.error("Config route error:", error);
    return NextResponse.json(
      { error: "Ошибка сервера", code: 500 },
      { status: 500 }
    );
  }
}
