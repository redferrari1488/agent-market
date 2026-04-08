import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getUser } from "@/lib/auth-server";

// Стать продавцом (buyer → seller)
export async function POST() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Не авторизован", code: 401 }, { status: 401 });
    }

    const [profile] = await db
      .select({ role: profiles.role })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);

    if (!profile) {
      return NextResponse.json({ error: "Профиль не найден", code: 404 }, { status: 404 });
    }

    if (profile.role === "seller" || profile.role === "admin") {
      return NextResponse.json({ data: { role: profile.role } });
    }

    await db
      .update(profiles)
      .set({ role: "seller", updatedAt: new Date() })
      .where(eq(profiles.id, user.id));

    return NextResponse.json({ data: { role: "seller" } });
  } catch (error) {
    console.error("Become seller error:", error);
    return NextResponse.json({ error: "Ошибка сервера", code: 500 }, { status: 500 });
  }
}
