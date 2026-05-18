import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getUser } from "@/lib/auth-server";
import { decrypt } from "@/lib/encryption";
import { applyRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { chatUrl, getChat } from "@/lib/telegram-bot";
import { logger } from "@/lib/logger";

// GET /api/subscriptions/[id]/output-info
//
// Возвращает метаданные «куда поступают результаты работы агента»:
// названия каналов, ссылки, кол-во подписчиков. Дёргает Telegram Bot API
// getChat по тем env-vars которые ожидают chat_id (CHANNEL_ID, CHAT_ID,
// OWNER_CHAT_ID). Используется на дашборде подписки в Status Panel.
//
// Кэш в памяти процесса на 5 минут per subscription — Telegram Bot API имеет
// rate-limit ~30 запросов/секунду на бота, плюс сами по себе каналы редко
// меняют название. Кэш сбрасывается между рестартами app — это OK.

type OutputTarget = {
  kind: "output" | "notification";
  envKey: string;
  raw: string;
  title: string | null;
  url: string | null;
  type: string | null;
  memberCount: number | null;
  accessible: boolean;
  error: string | null;
};

type CachedResult = {
  expiresAt: number;
  payload: { targets: OutputTarget[] };
};

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, CachedResult>();

const TARGET_KINDS: Record<string, "output" | "notification"> = {
  CHANNEL_ID: "output",
  CHAT_ID: "notification",
  OWNER_CHAT_ID: "notification",
};


export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Не авторизован", code: 401 }, { status: 401 });
  }

  const limited = applyRateLimit(
    "subscriptionOutputInfo",
    user.id,
    RATE_LIMITS.subscriptionOutputInfo,
  );
  if (limited) return limited;

  const [sub] = await db
    .select({
      id: subscriptions.id,
      config: subscriptions.config,
    })
    .from(subscriptions)
    .where(and(eq(subscriptions.id, id), eq(subscriptions.userId, user.id)))
    .limit(1);

  if (!sub) {
    return NextResponse.json({ error: "Подписка не найдена", code: 404 }, { status: 404 });
  }

  // Кэш: проверяем после ownership-check, чтобы кэш не утекал между
  // юзерами (subId одинаковый, но запрос мог прийти от не-владельца).
  const cached = cache.get(sub.id);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json({ data: cached.payload, cached: true });
  }

  // Расшифровываем config. Schema поле jsonb — может быть как зашифрованный
  // string, так и object с зашифрованными values (новый формат). Поддерживаем оба.
  const userConfig = decryptConfig(sub.config);
  const botToken = userConfig.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    // Нет токена — нечего запрашивать. Возвращаем пустой targets, не ошибку:
    // не каждый агент использует Telegram (website-monitor, например).
    const payload = { targets: [] };
    cache.set(sub.id, { expiresAt: Date.now() + CACHE_TTL_MS, payload });
    return NextResponse.json({ data: payload, cached: false });
  }

  const targets: OutputTarget[] = [];
  for (const [envKey, kind] of Object.entries(TARGET_KINDS)) {
    const raw = userConfig[envKey];
    if (!raw) continue;

    const result = await getChat(botToken, raw).catch((err) => {
      logger.warn({ err, envKey }, "output-info getChat failed");
      return { ok: false as const, error: "network error" };
    });

    if (result.ok) {
      const personName =
        [result.chat.first_name, result.chat.last_name].filter(Boolean).join(" ") || null;
      const title = result.chat.title ?? personName;
      targets.push({
        kind,
        envKey,
        raw,
        title,
        url: chatUrl(result.chat),
        type: result.chat.type,
        memberCount: result.memberCount ?? null,
        accessible: true,
        error: null,
      });
    } else {
      targets.push({
        kind,
        envKey,
        raw,
        title: null,
        url: null,
        type: null,
        memberCount: null,
        accessible: false,
        error: result.error,
      });
    }
  }

  const payload = { targets };
  cache.set(sub.id, { expiresAt: Date.now() + CACHE_TTL_MS, payload });

  return NextResponse.json({ data: payload, cached: false });
}

// Расшифровка config-jsonb. Раньше config был зашифрованный string на верхнем
// уровне; сейчас — object где каждое значение зашифровано отдельно (см.
// src/lib/docker.ts:buildEnv). Поддерживаем оба формата + игнорируем
// internal `_meta_*` ключи.
function decryptConfig(raw: unknown): Record<string, string> {
  if (!raw) return {};

  if (typeof raw === "string") {
    try {
      return JSON.parse(decrypt(raw)) as Record<string, string>;
    } catch {
      return {};
    }
  }

  if (typeof raw === "object" && !Array.isArray(raw)) {
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
      if (key.startsWith("_meta_") || key === "recurring_failures") continue;
      if (typeof value !== "string") continue;
      try {
        out[key] = decrypt(value);
      } catch {
        // legacy plain-text — оставляем как есть, getChat сам отвалится если invalid
        out[key] = value;
      }
    }
    return out;
  }

  return {};
}
