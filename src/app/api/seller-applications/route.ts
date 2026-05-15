import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { sellerApplications } from "@/lib/db/schema";
import { getUser } from "@/lib/auth-server";
import { notifyAdmin } from "@/lib/admin-notify";
import { logger } from "@/lib/logger";

// Юзеры в реальной жизни пишут ссылку без схемы (t.me/foo, mybot.com).
// Автодобавляем https:// перед валидацией, чтобы не валить заявку на этом.
function normalizeUrl(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (trimmed === "") return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

const applicationSchema = z.object({
  name: z.string({ error: "Введите имя" })
    .trim()
    .min(2, "Минимум 2 символа")
    .max(120, "Максимум 120 символов"),
  contactEmail: z.string({ error: "Введите email" })
    .trim()
    .email("Введите корректный email")
    .max(255, "Максимум 255 символов"),
  contactTelegram: z.string()
    .trim()
    .min(1)
    .max(80, "Максимум 80 символов")
    .optional()
    .nullable(),
  agentDescription: z.string({ error: "Опишите агента" })
    .trim()
    .min(20, "Минимум 20 символов")
    .max(2000, "Максимум 2000 символов"),
  existingUrl: z.preprocess(
    normalizeUrl,
    z.string()
      .url("Введите корректную ссылку, например https://t.me/agent")
      .max(500, "Максимум 500 символов")
      .optional()
      .nullable(),
  ),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Некорректное тело запроса" }, { status: 400 });
  }

  const parsed = applicationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Проверьте поля формы", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const user = await getUser();

  const [row] = await db
    .insert(sellerApplications)
    .values({
      userId: user?.id ?? null,
      name: parsed.data.name,
      contactEmail: parsed.data.contactEmail,
      contactTelegram: parsed.data.contactTelegram || null,
      agentDescription: parsed.data.agentDescription,
      existingUrl: parsed.data.existingUrl || null,
    })
    .returning({ id: sellerApplications.id });

  // Best-effort admin notification — runs after DB write so a notify failure
  // never blocks the application from being saved.
  const lines = [
    `Имя: ${parsed.data.name}`,
    `Email: ${parsed.data.contactEmail}`,
    parsed.data.contactTelegram ? `Telegram: ${parsed.data.contactTelegram}` : null,
    parsed.data.existingUrl ? `Демо/ссылка: ${parsed.data.existingUrl}` : null,
    "",
    "Описание агента:",
    parsed.data.agentDescription,
    "",
    `Заявка #${row.id}`,
  ].filter(Boolean) as string[];

  // Await — иначе при возврате response контейнер может прервать
  // fire-and-forget promise до того как fetch на Telegram отправится.
  await notifyAdmin({
    subject: `Новая заявка продавца — ${parsed.data.name}`,
    text: lines.join("\n"),
  }).catch((err) => logger.warn({ err }, "seller-applications notifyAdmin failed"));

  return NextResponse.json({ ok: true, id: row.id });
}
