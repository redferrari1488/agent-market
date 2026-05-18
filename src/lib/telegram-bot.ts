// Лёгкий клиент Telegram Bot API для server-side нужд платформы.
// Используется в /api/subscriptions/[id]/output-info чтобы получать
// метаинформацию о каналах/чатах куда агент отправляет результаты.
//
// Bot API docs: https://core.telegram.org/bots/api
//
// Ограничение: Bot API не имеет метода для чтения истории канала (getChatHistory
// доступен только в MTProto/user accounts). Поэтому "последний пост" мы
// получить не можем — только метаданные канала через getChat. Для лента
// последнего поста нужно сохранять message_id при отправке самим агентом
// (post-launch улучшение).

const TG_API = "https://api.telegram.org";

export type TelegramChatType = "private" | "group" | "supergroup" | "channel";

export type TelegramChat = {
  id: number;
  type: TelegramChatType;
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  description?: string;
  invite_link?: string;
};

export type GetChatResult =
  | { ok: true; chat: TelegramChat; memberCount?: number }
  | { ok: false; error: string; statusCode?: number };

async function callBotApi<T>(
  botToken: string,
  method: string,
  params: Record<string, string | number>,
  signal?: AbortSignal,
): Promise<{ ok: true; result: T } | { ok: false; description: string; error_code?: number }> {
  const url = new URL(`${TG_API}/bot${botToken}/${method}`);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, String(v));
  }
  try {
    const res = await fetch(url, { signal, cache: "no-store" });
    const json = (await res.json()) as
      | { ok: true; result: T }
      | { ok: false; description: string; error_code?: number };
    return json;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, description: `network error: ${msg}` };
  }
}

export async function getChat(
  botToken: string,
  chatId: string | number,
): Promise<GetChatResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await callBotApi<TelegramChat>(
      botToken,
      "getChat",
      { chat_id: String(chatId) },
      controller.signal,
    );
    if (!res.ok) {
      return { ok: false, error: res.description, statusCode: res.error_code };
    }
    // member count — дополнительный запрос, не критичный. Если не получится,
    // вернём chat без поля.
    let memberCount: number | undefined;
    if (res.result.type !== "private") {
      const cnt = await callBotApi<number>(
        botToken,
        "getChatMemberCount",
        { chat_id: String(chatId) },
        controller.signal,
      );
      if (cnt.ok) memberCount = cnt.result;
    }
    return { ok: true, chat: res.result, memberCount };
  } finally {
    clearTimeout(timeout);
  }
}

// Превращает chat_id или @username в публичную или приватную t.me ссылку.
// Public channel/supergroup: t.me/<username>
// Private channel/supergroup: t.me/c/<-100xxxxxxxxxxx, отбрасываем префикс -100>
// Private chat: ссылки нет — возвращаем null.
export function chatUrl(chat: TelegramChat): string | null {
  if (chat.username) {
    return `https://t.me/${chat.username}`;
  }
  if (chat.type === "channel" || chat.type === "supergroup") {
    const id = String(chat.id);
    // Приватные каналы имеют id вида -1001234567890. Для ссылки t.me/c/
    // нужна часть после -100.
    const internalId = id.startsWith("-100") ? id.slice(4) : id.replace(/^-/, "");
    return `https://t.me/c/${internalId}`;
  }
  if (chat.invite_link) {
    return chat.invite_link;
  }
  return null;
}
