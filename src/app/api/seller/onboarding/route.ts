import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { getUser } from "@/lib/auth-server";
import { yookassaProvider } from "@/lib/payments/yookassa";
import { applyRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { sellerOnboardingSchema } from "@/lib/validators";

export async function POST(req: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Не авторизован", code: 401 }, { status: 401 });
    }

    const limited = applyRateLimit("sellerOnboarding", user.id, RATE_LIMITS.sellerOnboarding);
    if (limited) return limited;

    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);

    if (!profile || (profile.role !== "seller" && profile.role !== "admin")) {
      return NextResponse.json({ error: "Доступ запрещён", code: 403 }, { status: 403 });
    }

    const body = await req.json();
    const parsed = sellerOnboardingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Некорректные данные", details: parsed.error.flatten(), code: 400 },
        { status: 400 },
      );
    }

    if (parsed.data.provider === "nowpayments") {
      const wallets: Record<string, string> = {};
      if (parsed.data.data.usdt_trc20) wallets.usdt_trc20 = parsed.data.data.usdt_trc20;
      if (parsed.data.data.usdc_sol) wallets.usdc_sol = parsed.data.data.usdc_sol;
      if (parsed.data.data.btc) wallets.btc = parsed.data.data.btc;

      await db
        .update(profiles)
        .set({
          cryptoWallets: wallets,
          updatedAt: new Date(),
        })
        .where(eq(profiles.id, user.id));

      return NextResponse.json({ ok: true });
    }

    const data = parsed.data.data;

    // ВАЖНО: даже если продавец прислал готовый accountId, мы НЕ авто-апрувим.
    // accountId уходит в onboardingData как хинт для админа — а решение
    // принимает /api/admin/sellers/onboarding/[id]. Раньше тут была ветка
    // self-approve по присланному accountId, которая позволяла любому seller
    // вписать чужой YooKassa-account и перенаправить на него split-платежи.
    try {
      const accountId = await yookassaProvider.createSellerAccount(profile, data);

      await db
        .update(profiles)
        .set({
          yookassaAccountId: accountId,
          onboardingData: data,
          onboardingStatus: "approved",
          updatedAt: new Date(),
        })
        .where(eq(profiles.id, user.id));

      return NextResponse.json({ ok: true, status: "approved" });
    } catch (err) {
      // Программное создание subaccount не удалось (нет prod-доступа к Marketplace API,
      // или продавец прислал manual accountId — провайдер не вызывает API). Уходим
      // в pending_review с полным набором данных для админа.
      console.warn("Seller onboarding fell back to pending_review:", err);

      await db
        .update(profiles)
        .set({
          onboardingData: data,
          onboardingStatus: "pending_review",
          updatedAt: new Date(),
        })
        .where(eq(profiles.id, user.id));

      return NextResponse.json({
        ok: true,
        status: "pending_review",
        message: "Заявка отправлена на проверку. Обычно обрабатывается 1-3 рабочих дня.",
      });
    }
  } catch (error) {
    console.error("Seller onboarding POST error:", error);
    return NextResponse.json({ error: "Ошибка сервера", code: 500 }, { status: 500 });
  }
}
