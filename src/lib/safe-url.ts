// Защита от `javascript:` / `data:` / `vbscript:` / `file:` URI в href.
// Стороной написания external_url у нас сейчас только админ через psql, но
// если когда-нибудь появится UI для продавцов — JSX-href и так не выполняет
// scheme автоматически, но click по ссылке выполнит. Поэтому фильтруем
// строго до http(s).
export function safeExternalHref(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}
