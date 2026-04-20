import { TelegramCallbackHandler, type TelegramAuthPayload } from "@/components/auth/TelegramCallbackHandler";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseTelegramPayload(params: Awaited<SearchParams>): TelegramAuthPayload | null {
  const id = Number(first(params.id));
  const authDate = Number(first(params.auth_date));
  const firstName = first(params.first_name)?.trim();
  const hash = first(params.hash)?.trim();

  if (!Number.isSafeInteger(id) || !Number.isFinite(authDate) || !firstName || !hash) {
    return null;
  }

  return {
    id,
    first_name: firstName,
    last_name: first(params.last_name)?.trim() || undefined,
    username: first(params.username)?.trim() || undefined,
    photo_url: first(params.photo_url)?.trim() || undefined,
    auth_date: authDate,
    hash,
  };
}

export default async function TelegramCallbackPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const payload = parseTelegramPayload(await searchParams);

  return <TelegramCallbackHandler payload={payload} />;
}
