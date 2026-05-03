// Lightweight admin notifier — no SDK, no new package. Each transport runs
// best-effort: a missing env var simply skips that channel without breaking
// the request.
//
// Order of preference for a given event:
//   1. Telegram bot → admin chat (already have TELEGRAM_BOT_TOKEN)
//   2. Resend HTTP API → admin email (set RESEND_API_KEY + ADMIN_NOTIFICATION_EMAIL)
//
// Both run if both are configured.

type SimplePayload = { subject: string; text: string };

const FALLBACK_ADMIN_EMAIL = "rodimovartem999@yandex.ru";

export async function notifyAdmin({ subject, text }: SimplePayload): Promise<void> {
  await Promise.allSettled([sendTelegram(subject, text), sendEmail(subject, text)]);
}

async function sendTelegram(subject: string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!token || !chatId) return;
  try {
    const message = `*${escapeMd(subject)}*\n\n${escapeMd(text)}`;
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "MarkdownV2",
        disable_web_page_preview: true,
      }),
    });
  } catch (err) {
    console.warn("[admin-notify] telegram failed:", err);
  }
}

async function sendEmail(subject: string, text: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  const to = process.env.ADMIN_NOTIFICATION_EMAIL || FALLBACK_ADMIN_EMAIL;
  const from = process.env.RESEND_FROM_EMAIL || "hireon <onboarding@resend.dev>";
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, text }),
    });
  } catch (err) {
    console.warn("[admin-notify] resend failed:", err);
  }
}

function escapeMd(s: string): string {
  return s.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, (c) => `\\${c}`);
}
