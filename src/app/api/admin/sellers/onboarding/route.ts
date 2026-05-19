import { NextResponse } from "next/server";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { getUser } from "@/lib/auth-server";
import { apiServerError } from "@/lib/api-error";

// Маска PII-полей в listing-ответе. ИНН/ФИО/адрес — sensitive по 152-ФЗ,
// в массовом view достаточно превью. Полные данные доступны только в
// detail-эндпоинте /api/admin/sellers/onboarding/[id], где админ нажимает
// «Открыть» — это попадает в audit_logs.
function maskPii(value: unknown, mode: "tail4" | "initials"): string | null {
  if (typeof value !== "string" || value.length === 0) return null;
  if (mode === "tail4") {
    return value.length <= 4 ? "***" : `***${value.slice(-4)}`;
  }
  // initials: "Иванов Иван Иванович" → "Иванов И.И."
  const parts = value.trim().split(/\s+/);
  if (parts.length === 0) return null;
  const last = parts[0];
  const initials = parts.slice(1).map((w) => `${w[0]}.`).join("");
  return initials ? `${last} ${initials}` : last;
}

function maskedOnboardingPreview(raw: unknown): Record<string, string | null> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const r = raw as Record<string, unknown>;
  return {
    inn: maskPii(r.inn, "tail4"),
    legalName: maskPii(r.legalName, "initials"),
    phone: maskPii(r.phone, "tail4"),
  };
}

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
      .where(and(
        eq(profiles.onboardingStatus, "pending_review"),
        isNull(profiles.deletedAt),
      ))
      .orderBy(desc(profiles.updatedAt));

    return NextResponse.json({
      data: rows.map((row) => ({
        id: row.id,
        email: row.email,
        name: row.name,
        onboardingPreview: maskedOnboardingPreview(row.onboardingData),
        updatedAt: row.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    return apiServerError(error, "admin onboarding list error", "Ошибка сервера", 500);
  }
}
