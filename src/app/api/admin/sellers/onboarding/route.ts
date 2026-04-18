import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { getUser } from "@/lib/auth-server";

export async function GET() {
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

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Только для админов", code: 403 }, { status: 403 });
    }

    const rows = await db
      .select({
        id: profiles.id,
        email: profiles.email,
        name: profiles.name,
        onboardingData: profiles.onboardingData,
        updatedAt: profiles.updatedAt,
      })
      .from(profiles)
      .where(eq(profiles.onboardingStatus, "pending_review"))
      .orderBy(desc(profiles.updatedAt));

    return NextResponse.json({
      data: rows.map((row) => ({
        ...row,
        updatedAt: row.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Admin onboarding list error:", error);
    return NextResponse.json({ error: "Ошибка сервера", code: 500 }, { status: 500 });
  }
}
