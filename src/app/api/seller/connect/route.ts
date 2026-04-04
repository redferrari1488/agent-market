import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import {
  createConnectAccount,
  createConnectAccountLink,
  getConnectAccountStatus,
} from "@/lib/stripe";

/**
 * POST /api/seller/connect — начать Stripe Connect онбординг
 * Создаёт Connect Account, сохраняет ID в профиле, возвращает ссылку на онбординг
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Необходимо авторизоваться", code: 401 },
        { status: 401 }
      );
    }

    // Получаем профиль
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, stripe_connect_account_id, email")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: "Профиль не найден", code: 404 },
        { status: 404 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    let accountId = profile.stripe_connect_account_id;

    // Если уже есть Connect Account — генерируем новую ссылку
    if (accountId) {
      const url = await createConnectAccountLink(
        accountId,
        `${appUrl}/seller?connect=refresh`,
        `${appUrl}/seller?connect=success`
      );

      return NextResponse.json({ data: { url } });
    }

    // Создаём новый Connect Account
    const account = await createConnectAccount(
      profile.email || user.email || ""
    );
    accountId = account.id;

    // Сохраняем ID и меняем роль на seller
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        stripe_connect_account_id: accountId,
        role: "seller",
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Failed to update profile:", updateError);
      return NextResponse.json(
        { error: "Ошибка обновления профиля", code: 500 },
        { status: 500 }
      );
    }

    // Генерируем ссылку на онбординг
    const url = await createConnectAccountLink(
      accountId,
      `${appUrl}/seller?connect=refresh`,
      `${appUrl}/seller?connect=success`
    );

    return NextResponse.json({ data: { url, accountId } });
  } catch (error) {
    console.error("Connect onboarding error:", error);
    return NextResponse.json(
      { error: "Ошибка создания Stripe Connect", code: 500 },
      { status: 500 }
    );
  }
}

/**
 * GET /api/seller/connect — получить статус Connect Account
 */
export async function GET() {
  try {
    const supabase = await createServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Необходимо авторизоваться", code: 401 },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_connect_account_id, role")
      .eq("id", user.id)
      .single();

    if (!profile?.stripe_connect_account_id) {
      return NextResponse.json({
        data: {
          connected: false,
          chargesEnabled: false,
          payoutsEnabled: false,
        },
      });
    }

    const status = await getConnectAccountStatus(
      profile.stripe_connect_account_id
    );

    return NextResponse.json({
      data: {
        connected: true,
        accountId: profile.stripe_connect_account_id,
        ...status,
      },
    });
  } catch (error) {
    console.error("Connect status error:", error);
    return NextResponse.json(
      { error: "Ошибка получения статуса", code: 500 },
      { status: 500 }
    );
  }
}
