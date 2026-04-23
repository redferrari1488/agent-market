import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  account as accountsTable,
  agents,
  auditLogs,
  profiles,
  session as sessionsTable,
  subscriptions,
  user as usersTable,
  verification as verificationsTable,
} from "@/lib/db/schema";
import { getSession } from "@/lib/auth-server";
import { auth } from "@/lib/auth";
import { deleteAccountSchema } from "@/lib/validators";
import { getProvider, type ProviderName } from "@/lib/payments";
import { removeContainerArtifacts } from "@/lib/docker";
import {
  DELETE_ACCOUNT_CONFIRMATION_PHRASE,
  DELETE_ACCOUNT_FRESH_SESSION_MS,
  isSyntheticTelegramEmail,
} from "@/lib/account-deletion";

function buildDeletedEmail(userId: string): string {
  return `deleted+${userId}.${Date.now()}@deleted.hireon.local`;
}

function buildDeletedName(): string {
  return "Deleted user";
}

function copySetCookieHeaders(src: Response, dst: NextResponse) {
  const setCookie =
    typeof src.headers.getSetCookie === "function"
      ? src.headers.getSetCookie()
      : src.headers.get("set-cookie")
        ? [src.headers.get("set-cookie") as string]
        : [];

  for (const value of setCookie) {
    dst.headers.append("set-cookie", value);
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession({ disableCookieCache: true });
    if (!session?.user?.id || !session.session?.createdAt) {
      return NextResponse.json({ error: "Не авторизован", code: 401 }, { status: 401 });
    }

    const body = await req.json();
    const parsed = deleteAccountSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Некорректные данные", code: 400 }, { status: 400 });
    }

    const userId = session.user.id;
    const [profile] = await db
      .select({
        id: profiles.id,
        email: profiles.email,
        role: profiles.role,
        deletedAt: profiles.deletedAt,
      })
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);

    if (!profile) {
      return NextResponse.json({ error: "Профиль не найден", code: 404 }, { status: 404 });
    }

    if (profile.deletedAt) {
      return NextResponse.json({ error: "Аккаунт уже удалён", code: 409 }, { status: 409 });
    }

    if (profile.role === "admin") {
      return NextResponse.json(
        { error: "Самоудаление админа отключено", code: 403 },
        { status: 403 },
      );
    }

    const sellerAgents = await db
      .select({ id: agents.id })
      .from(agents)
      .where(eq(agents.sellerId, userId))
      .limit(1);

    if (sellerAgents.length > 0) {
      return NextResponse.json(
        { error: "Сначала удалите или передайте свои агенты", code: 409 },
        { status: 409 },
      );
    }

    const expectedEmail = (profile.email ?? session.user.email ?? "").trim().toLowerCase();
    const usesEmailConfirmation =
      expectedEmail.length > 0 && !isSyntheticTelegramEmail(expectedEmail);

    if (usesEmailConfirmation) {
      if (parsed.data.email?.trim().toLowerCase() !== expectedEmail) {
        return NextResponse.json(
          { error: "Подтвердите текущий email", code: 400 },
          { status: 400 },
        );
      }
    } else if (
      parsed.data.confirmation?.trim().toUpperCase() !== DELETE_ACCOUNT_CONFIRMATION_PHRASE
    ) {
      return NextResponse.json(
        {
          error: `Введите фразу ${DELETE_ACCOUNT_CONFIRMATION_PHRASE} для подтверждения удаления`,
          code: 400,
        },
        { status: 400 },
      );
    }

    const linkedAccounts = await db
      .select({
        id: accountsTable.id,
        providerId: accountsTable.providerId,
      })
      .from(accountsTable)
      .where(eq(accountsTable.userId, userId));

    const sessionCreatedAt = new Date(session.session.createdAt).getTime();
    if (
      !Number.isFinite(sessionCreatedAt) ||
      Date.now() - sessionCreatedAt > DELETE_ACCOUNT_FRESH_SESSION_MS
    ) {
      return NextResponse.json(
        {
          error:
            "Для удаления повторно войдите в аккаунт в течение последних 10 минут",
          code: 403,
        },
        { status: 403 },
      );
    }

    const ownedSubscriptions = await db
      .select({
        id: subscriptions.id,
        paymentProvider: subscriptions.paymentProvider,
        providerSubscriptionId: subscriptions.providerSubscriptionId,
      })
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId));

    for (const sub of ownedSubscriptions) {
      if (sub.paymentProvider && sub.providerSubscriptionId) {
        const provider = getProvider(sub.paymentProvider as ProviderName);
        if (!provider) {
          return NextResponse.json(
            {
              error: `Провайдер ${sub.paymentProvider} недоступен для отмены подписки`,
              code: 503,
            },
            { status: 503 },
          );
        }

        try {
          await provider.cancelSubscription(sub.providerSubscriptionId);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          return NextResponse.json(
            { error: `Не удалось отменить подписку: ${message}`, code: 500 },
            { status: 500 },
          );
        }
      }

      try {
        await removeContainerArtifacts(sub.id);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json(
          { error: `Не удалось очистить контейнер агента: ${message}`, code: 500 },
          { status: 500 },
        );
      }
    }

    const now = new Date();
    const deletedEmail = buildDeletedEmail(userId);
    const linkedProviders = linkedAccounts.map((row) => row.providerId);

    await db.transaction(async (tx) => {
      await tx.insert(auditLogs).values({
        actorId: userId,
        action: "account.deleted",
        targetType: "profile",
        targetId: userId,
        payload: {
          email: expectedEmail,
          linkedProviders,
          subscriptionIds: ownedSubscriptions.map((sub) => sub.id),
        },
      });

      await tx
        .update(subscriptions)
        .set({
          status: "cancelled",
          containerId: null,
          providerSubscriptionId: null,
          config: {},
          expiresAt: now,
          updatedAt: now,
        })
        .where(eq(subscriptions.userId, userId));

      await tx
        .update(profiles)
        .set({
          email: deletedEmail,
          name: buildDeletedName(),
          avatarUrl: null,
          role: "buyer",
          telegramId: null,
          telegramUsername: null,
          yookassaAccountId: null,
          cryptomusWalletAddress: null,
          onboardingData: null,
          onboardingStatus: null,
          bio: null,
          deletedAt: now,
          updatedAt: now,
        })
        .where(eq(profiles.id, userId));

      await tx
        .update(usersTable)
        .set({
          email: deletedEmail,
          emailVerified: false,
          name: buildDeletedName(),
          image: null,
          updatedAt: now,
        })
        .where(eq(usersTable.id, userId));

      await tx.delete(accountsTable).where(eq(accountsTable.userId, userId));
      await tx.delete(sessionsTable).where(eq(sessionsTable.userId, userId));
      await tx.delete(verificationsTable).where(eq(verificationsTable.identifier, expectedEmail));
    });

    const response = NextResponse.json({ data: { ok: true } });

    try {
      const signOutResponse = await auth.api.signOut({
        headers: req.headers,
        asResponse: true,
      });
      copySetCookieHeaders(signOutResponse, response);
    } catch (signOutError) {
      console.error("Account deletion sign-out warning:", signOutError);
    }

    return response;
  } catch (error) {
    console.error("Account deletion error:", error);
    return NextResponse.json({ error: "Ошибка сервера", code: 500 }, { status: 500 });
  }
}
