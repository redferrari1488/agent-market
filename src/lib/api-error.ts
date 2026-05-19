import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

// Унифицированный возврат 5xx из API-роутов. err.message часто содержит
// детали инфраструктуры (пути контейнеров, registry URL, merchant IDs,
// stack traces) — наружу отдаём только generic-сообщение, полный err летит
// в structured-логгер.
export function apiServerError(
  err: unknown,
  context: string,
  publicMessage: string,
  status: number = 500,
  extra?: Record<string, unknown>,
) {
  logger.error({ err, ...extra }, context);
  return NextResponse.json({ error: publicMessage, code: status }, { status });
}
