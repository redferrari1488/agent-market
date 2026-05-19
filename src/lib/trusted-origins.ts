// Список разрешённых origin'ов для CSRF Origin-check в proxy.ts.
// Делим источник правды с BetterAuth (src/lib/auth.ts) — пользователь может
// сидеть на www-форме до того, как nginx 301 редиректнёт на bare, и легитимный
// POST не должен падать с 403.
export function getTrustedOrigins(): string[] {
  const baseURL = process.env.NEXT_PUBLIC_APP_URL;
  const set = new Set<string>();
  if (baseURL) set.add(baseURL);
  set.add("https://hireon.agency");
  set.add("https://www.hireon.agency");
  return Array.from(set);
}
