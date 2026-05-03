import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { sellerApplications } from "@/lib/db/schema";
import { getUser } from "@/lib/auth-server";
import { notifyAdmin } from "@/lib/admin-notify";

const applicationSchema = z.object({
  name: z.string().trim().min(2).max(120),
  contactEmail: z.string().trim().email().max(255),
  contactTelegram: z.string().trim().min(1).max(80).optional().nullable(),
  agentDescription: z.string().trim().min(20).max(2000),
  existingUrl: z.string().trim().url().max(500).optional().nullable(),
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

  void notifyAdmin({
    subject: `Новая заявка продавца — ${parsed.data.name}`,
    text: lines.join("\n"),
  });

  return NextResponse.json({ ok: true, id: row.id });
}
