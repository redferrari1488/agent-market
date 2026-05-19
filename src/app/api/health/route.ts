import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

// Public health endpoint для UptimeRobot и подобных внешних мониторов.
// Возвращает 200 когда все критичные зависимости отвечают, 503 если что-то
// сломалось — это сигнал uptime-боту "down". JSON не содержит чувствительных
// деталей: ни URL'ов, ни секретов, ни сообщений ошибок от провайдеров.

export const dynamic = "force-dynamic";

type CheckResult = "ok" | "fail" | "skipped";

async function checkPostgres(): Promise<CheckResult> {
  try {
    await Promise.race([
      db.execute(sql`select 1`),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), 2000),
      ),
    ]);
    return "ok";
  } catch {
    return "fail";
  }
}

async function checkOpenRouter(): Promise<CheckResult> {
  if (!process.env.OPENROUTER_API_KEY) {
    return "skipped";
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);
  try {
    const res = await fetch("https://openrouter.ai/api/v1/models", {
      signal: controller.signal,
      cache: "no-store",
    });
    return res.ok ? "ok" : "fail";
  } catch {
    return "fail";
  } finally {
    clearTimeout(timer);
  }
}

export async function GET() {
  const [postgres, openrouter] = await Promise.all([
    checkPostgres(),
    checkOpenRouter(),
  ]);

  // openrouter=skipped (env не задан) НЕ роняет health — это валидно для
  // dev-окружения. На проде ключ задан, тогда "fail" → 503.
  const critical: CheckResult[] = [postgres, openrouter].filter((c) => c !== "skipped");
  const healthy = critical.every((c) => c === "ok");

  const body = {
    status: healthy ? "ok" : "degraded",
    checks: { postgres, openrouter },
    ts: new Date().toISOString(),
  };

  return NextResponse.json(body, { status: healthy ? 200 : 503 });
}
