const TELEGRAM_EMAIL_RE = /^tg_\d+@telegram\.local$/i;

export const DELETE_ACCOUNT_FRESH_SESSION_MS = 10 * 60 * 1000;
export const DELETE_ACCOUNT_CONFIRMATION_PHRASE = "УДАЛИТЬ";

export function isSyntheticTelegramEmail(email: string | null | undefined): boolean {
  return TELEGRAM_EMAIL_RE.test((email ?? "").trim());
}

type DeleteAuthOptions = {
  hasCredentialPassword: boolean;
  email: string | null | undefined;
};

export function requiresPasswordDeleteReauth({
  hasCredentialPassword,
  email,
}: DeleteAuthOptions): boolean {
  return hasCredentialPassword && !isSyntheticTelegramEmail(email);
}
