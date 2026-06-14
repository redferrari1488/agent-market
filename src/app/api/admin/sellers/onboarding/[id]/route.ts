import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { auditLogs, profiles } from "@/lib/db/schema";
import { requireRole } from "@/lib/authz";
import { adminOnboardingReviewSchema } from "@/lib/validators";
import { apiServerError } from "@/lib/api-error";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireRole("admin", { forbiddenMessage: "Только для админов" });
    if (!auth.ok) return auth.response;
    const user = auth.user;

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
      .where(and(eq(profiles.id, id), isNull(profiles.deletedAt)))
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

      await db.insert(auditLogs).values({
        actorId: user.id,
        action: "admin.seller.onboarding.approve",
        targetType: "seller_profile",
        targetId: id,
        payload: {
          yookassaAccountIdSet: parsed.data.yookassaAccountId ?? null,
        },
      });

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

    await db.insert(auditLogs).values({
      actorId: user.id,
      action: "admin.seller.onboarding.reject",
      targetType: "seller_profile",
      targetId: id,
      payload: {
        reason: parsed.data.reason,
      },
    });

    return NextResponse.json({ data: { status: "rejected" } });
  } catch (error) {
    return apiServerError(error, "admin onboarding review error", "Ошибка сервера", 500);
  }
}
