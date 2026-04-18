import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { getUser } from "@/lib/auth-server";
import { adminOnboardingReviewSchema } from "@/lib/validators";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const body = await request.json();
    const parsed = adminOnboardingReviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Неверные данные", code: 400 }, { status: 400 });
    }

    const [targetProfile] = await db
      .select({
        id: profiles.id,
        onboardingStatus: profiles.onboardingStatus,
        onboardingData: profiles.onboardingData,
        yookassaAccountId: profiles.yookassaAccountId,
      })
      .from(profiles)
      .where(eq(profiles.id, id))
      .limit(1);

    if (!targetProfile) {
      return NextResponse.json({ error: "Продавец не найден", code: 404 }, { status: 404 });
    }

    if (targetProfile.onboardingStatus !== "pending_review") {
      return NextResponse.json({ error: "Заявка уже обработана", code: 400 }, { status: 400 });
    }

    const reviewedAt = new Date();

    if (parsed.data.action === "approve") {
      if (!parsed.data.yookassaAccountId && !targetProfile.yookassaAccountId) {
        // Some pending_review rows may still be valid without YooKassa if the seller ends up using a crypto-only payout path.
      }

      await db
        .update(profiles)
        .set({
          onboardingStatus: "approved",
          yookassaAccountId:
            parsed.data.yookassaAccountId ?? targetProfile.yookassaAccountId,
          updatedAt: reviewedAt,
        })
        .where(eq(profiles.id, id));

      return NextResponse.json({ data: { status: "approved" } });
    }

    const existingOnboardingData =
      targetProfile.onboardingData &&
      typeof targetProfile.onboardingData === "object" &&
      !Array.isArray(targetProfile.onboardingData)
        ? (targetProfile.onboardingData as Record<string, unknown>)
        : {};

    await db
      .update(profiles)
      .set({
        onboardingStatus: "rejected",
        onboardingData: {
          ...existingOnboardingData,
          __rejection_reason: parsed.data.reason,
          __rejected_at: reviewedAt.toISOString(),
        },
        updatedAt: reviewedAt,
      })
      .where(eq(profiles.id, id));

    return NextResponse.json({ data: { status: "rejected" } });
  } catch (error) {
    console.error("Admin onboarding review error:", error);
    return NextResponse.json({ error: "Ошибка сервера", code: 500 }, { status: 500 });
  }
}
