import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getUser } from "@/lib/auth-server";
import { encrypt } from "@/lib/encryption";
import { subscriptionConfigSchema } from "@/lib/validators";
import { deployContainer } from "@/lib/docker";
import { applyRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { validateSubscriptionConfig } from "@/lib/agent-config-validation";
import { apiServerError } from "@/lib/api-error";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Auth ПЕРЕД парсингом body — анон не должен тратить CPU на JSON.parse
    // и Zod-validation тяжёлого payload'а до отказа в 401.
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Не авторизован", code: 401 }, { status: 401 });
    }

    // Rate-limit ДО deploy: deployContainer тяжёлый (pull image / start container),
    // юзер мог хаммерить кнопку «Сохранить» при медленном отклике.
    const limited = applyRateLimit("subscriptionConfig", user.id, RATE_LIMITS.subscriptionConfig);
    if (limited) return limited;

    const body = await request.json();
    const parsed = subscriptionConfigSchema.safeParse(body.config);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Неверные данные", code: 400 },
        { status: 400 },
      );
    }

    const [sub] = await db
      .select({
        id: subscriptions.id,
        userId: subscriptions.userId,
        status: subscriptions.status,
        providerPaymentId: subscriptions.providerPaymentId,
      })
      .from(subscriptions)
      .where(and(eq(subscriptions.id, id), eq(subscriptions.userId, user.id)))
      .limit(1);

    if (!sub) {
      return NextResponse.json({ error: "Подписка не найдена", code: 404 }, { status: 404 });
    }

    // Payment-gate, согласован с /start. Без подтверждённой оплаты и валидного
    // статуса /config не должен пересоздавать контейнер — иначе cancelled /
    // expired / paused подписка получает вечный бесплатный сервис.
    if (process.env.NODE_ENV === "production" && !sub.providerPaymentId) {
      return NextResponse.json(
        { error: "Оплата ещё не подтверждена. Попробуйте через минуту.", code: 409 },
        { status: 409 },
      );
    }
    if (sub.status !== "pending_setup" && sub.status !== "active") {
      return NextResponse.json(
        { error: "Сохранение конфигурации недоступно в этом состоянии подписки", code: 409 },
        { status: 409 },
      );
    }

    // Серверная валидация config против setup_schema агента до деплоя
    // контейнера — защищает от ситуаций, где фронт пропустил неполный конфиг.
    const validation = await validateSubscriptionConfig(id, parsed.data);
    if (!validation.ok) {
      return NextResponse.json(
        { error: validation.message, missing: validation.missing, invalid: validation.invalid, code: 400 },
        { status: 400 },
      );
    }

    const encryptedConfig: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed.data)) {
      encryptedConfig[key] = encrypt(value);
    }

    await db
      .update(subscriptions)
      .set({ config: encryptedConfig })
      .where(eq(subscriptions.id, id));

    try {
      await deployContainer(id);
    } catch (err) {
      return apiServerError(
        err,
        "config: deploy failed",
        "Конфиг сохранён, но не удалось запустить контейнер. Откройте подписку и нажмите «Перезапустить».",
        500,
        { subscriptionId: id },
      );
    }

    return NextResponse.json({ data: { ok: true } });
  } catch (error) {
    return apiServerError(error, "config route error", "Ошибка сервера", 500);
  }
}
