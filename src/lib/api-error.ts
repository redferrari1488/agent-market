import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { alert } from "@/lib/alerter";

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
  if (status >= 500) {
    alert({
      key: `api-5xx:${context}`,
      severity: "critical",
      title: `5xx in ${context}`,
      details: { status, err, ...extra },
    });
  }
  return NextResponse.json({ error: publicMessage, code: status }, { status });
}
