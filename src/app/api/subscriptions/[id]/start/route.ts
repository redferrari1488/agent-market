import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

// Заглушка Day 4. На Day 5 здесь будет deployContainer() из lib/docker.ts.
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Не авторизован", code: 401 }, { status: 401 });
  }

  const { error } = await supabase
    .from("subscriptions")
    .update({ status: "active", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: "Ошибка запуска", code: 500 }, { status: 500 });
  }

  return NextResponse.json({ data: { ok: true } });
}
