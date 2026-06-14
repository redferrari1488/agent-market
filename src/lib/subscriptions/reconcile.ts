// Чистая логика reconciler'а «биллинг ⇄ рантайм» (T4 аудита 2026-06-10, закрывает
// H1 и хвост H2). Инвариант: нет работающего контейнера без active-подписки.
// SQL-фазы в cron/yookassa-recurring зеркалят эти предикаты; здесь — чтобы
// покрыть логику юнит-тестами без БД.

export type ReconcileSub = {
  status: string;
  expiresAt: Date | null;
  containerId: string | null;
};

// Grace до пометки expired. ЮКасса-подписки продлеваются recurring-cron'ом в
// окне ±24ч, так что под expiry реально попадают крипто-подписки (NowPayments,
// без авто-recurring — H2) и те, чьё продление окончательно провалилось. Grace
// даёт recurring-cron'у несколько суточных ретраев, прежде чем ронять доступ.
// TODO(product): подтвердить значение (Open Q3 аудита: 0/3/7 дней).
export const EXPIRY_GRACE_DAYS = 3;

// active-подписка, чей оплаченный срок истёк больше grace назад → expired.
export function shouldMarkExpired(
  sub: ReconcileSub,
  now: Date,
  graceDays: number = EXPIRY_GRACE_DAYS,
): boolean {
  if (sub.status !== "active") return false;
  if (!sub.expiresAt) return false;
  const graceMs = graceDays * 24 * 60 * 60 * 1000;
  return sub.expiresAt.getTime() < now.getTime() - graceMs;
}

// Статусы, при которых контейнер не должен работать. cancelled тоже глушим
// (но НЕ сносим volume — это отдельное продуктовое решение, Open Q2 аудита).
export const STOPPABLE_STATUSES = ["paused", "expired", "cancelled"] as const;
const STOPPABLE_SET = new Set<string>(STOPPABLE_STATUSES);

// Контейнер должен быть остановлен: подписка не active, но контейнер ещё привязан.
// H1: без этого агент работает бесплатно и жжёт платформенный OpenRouter-ключ.
export function shouldStopContainer(sub: ReconcileSub): boolean {
  return STOPPABLE_SET.has(sub.status) && sub.containerId != null;
}
