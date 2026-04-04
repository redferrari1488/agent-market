import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { createCheckoutSession } from "@/lib/stripe";
import { checkoutSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Неверные данные", code: 400 },
        { status: 400 }
      );
    }

    const { agent_id } = parsed.data;

    const supabase = await createServerClient();

    // Проверяем авторизацию
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Необходимо авторизоваться", code: 401 },
        { status: 401 }
      );
    }

    // Получаем агента
    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .select("*, profiles!seller_id(stripe_connect_account_id)")
      .eq("id", agent_id)
      .eq("status", "published")
      .single();

    if (agentError || !agent) {
      return NextResponse.json(
        { error: "Агент не найден", code: 404 },
        { status: 404 }
      );
    }

    if (!agent.stripe_price_id) {
      return NextResponse.json(
        { error: "Агент не настроен для оплаты", code: 400 },
        { status: 400 }
      );
    }

    // Проверяем нет ли уже активной подписки
    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .eq("agent_id", agent_id)
      .in("status", ["pending_setup", "active"])
      .single();

    if (existingSub) {
      return NextResponse.json(
        { error: "У вас уже есть подписка на этого агента", code: 400 },
        { status: 400 }
      );
    }

    // Извлекаем Stripe Connect account продавца
    const sellerProfile = Array.isArray(agent.profiles)
      ? agent.profiles[0]
      : agent.profiles;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const session = await createCheckoutSession({
      priceId: agent.stripe_price_id,
      sellerId: agent.seller_id,
      sellerStripeAccountId:
        sellerProfile?.stripe_connect_account_id || null,
      userId: user.id,
      agentId: agent_id,
      successUrl: `${appUrl}/dashboard?checkout=success&agent=${agent_id}`,
      cancelUrl: `${appUrl}/agents/${agent.slug}?checkout=cancelled`,
    });

    return NextResponse.json({ data: { url: session.url } });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Ошибка создания сессии оплаты", code: 500 },
      { status: 500 }
    );
  }
}
