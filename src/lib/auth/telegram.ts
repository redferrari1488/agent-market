import crypto from "crypto";

/**
 * Данные, которые Telegram Login Widget передаёт нам после успешного логина.
 * Документация: https://core.telegram.org/widgets/login#receiving-authorization-data
 */
export type TelegramAuthData = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
};

/**
 * Проверяет подпись Telegram Login Widget.
 *
 * Алгоритм (из официальной доки):
 * 1. Сформировать data-check-string: отсортированные по ключу пары `${key}=${value}` через \n,
 *    исключая поле hash.
 * 2. Посчитать secret_key = SHA256(bot_token).
 * 3. hash_expected = HMAC-SHA256(data_check_string, secret_key).
 * 4. Сравнить с присланным hash.
 * 5. Проверить свежесть auth_date (не старше 24 часов — защита от replay-атак).
 */
export function verifyTelegramAuth(
  data: TelegramAuthData,
  botToken: string
): { ok: true } | { ok: false; reason: string } {
  const { hash, ...fields } = data;

  if (!hash) {
    return { ok: false, reason: "hash отсутствует" };
  }

  // 1. data-check-string
  const dataCheckString = Object.entries(fields)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join("\n");

  // 2–3. secret_key и ожидаемый hash
  const secretKey = crypto.createHash("sha256").update(botToken).digest();
  const expectedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  // 4. Сравниваем через timingSafeEqual (защита от timing-атак)
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(expectedHash, "hex");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { ok: false, reason: "неверная подпись" };
  }

  // 5. Свежесть (<= 24 часов)
  const ageSeconds = Math.floor(Date.now() / 1000) - data.auth_date;
  if (ageSeconds < 0 || ageSeconds > 24 * 60 * 60) {
    return { ok: false, reason: "auth_date устарел" };
  }

  return { ok: true };
}

/**
 * Строит email для auth.users из telegram_id.
 * У Supabase Auth email обязателен, а у Telegram-юзера его может не быть,
 * поэтому генерируем синтетический.
 */
export function telegramEmail(telegramId: number): string {
  return `tg_${telegramId}@telegram.local`;
}

/**
 * Собирает отображаемое имя из данных Telegram.
 */
export function telegramDisplayName(data: TelegramAuthData): string {
  return [data.first_name, data.last_name].filter(Boolean).join(" ").trim();
}
