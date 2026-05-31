import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agents } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getUser } from "@/lib/auth-server";
import { COMPUTE_CLASSES } from "@/lib/compute";
import { agentSchema } from "@/lib/validators";
import { logger } from "@/lib/logger";

type RouteParams = { params: Promise<{ id: string }> };

// Получить одного агента продавца
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Не авторизован", code: 401 }, { status: 401 });
    }

    const [agent] = await db
      .select()
      .from(agents)
      .where(and(eq(agents.id, id), eq(agents.sellerId, user.id)))
      .limit(1);

    if (!agent) {
      return NextResponse.json({ error: "Агент не найден", code: 404 }, { status: 404 });
    }

    return NextResponse.json({ data: agent });
  } catch (error) {
    logger.error({ err: error }, "seller agent GET error");
    return NextResponse.json({ error: "Ошибка сервера", code: 500 }, { status: 500 });
  }
}

// Обновить агента
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Не авторизован", code: 401 }, { status: 401 });
    }

    // Проверяем владение
    const [existing] = await db
      .select({ id: agents.id, sellerId: agents.sellerId, status: agents.status })
      .from(agents)
      .where(and(eq(agents.id, id), eq(agents.sellerId, user.id)))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Агент не найден", code: 404 }, { status: 404 });
    }

    // Запрещаем редактирование во время review — иначе seller подменяет
    // docker_image / env_template после того как админ открыл moderation UI,
    // и approve приходится на уже изменённую версию (bait-and-switch TOCTOU).
    if (existing.status === "review") {
      return NextResponse.json(
        { error: "Агент на модерации — редактирование заблокировано до решения админа", code: 409 },
        { status: 409 },
      );
    }

    const body = await request.json();
    const parsed = agentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Неверные данные", details: parsed.error.flatten(), code: 400 },
        { status: 400 }
      );
    }

    // Проверяем уникальность slug (исключая текущего)
    const [slugConflict] = await db
      .select({ id: agents.id })
      .from(agents)
      .where(eq(agents.slug, parsed.data.slug))
      .limit(1);

    if (slugConflict && slugConflict.id !== id) {
      return NextResponse.json(
        { error: "Агент с таким slug уже существует", code: 409 },
        { status: 409 }
      );
    }

    const d = parsed.data;
    if (d.needs_cron && !COMPUTE_CLASSES[d.compute_class]?.hasCron) {
      return NextResponse.json(
        { error: "Агентам с cron доступен только класс L", code: 400 },
        { status: 400 }
      );
    }

    // При редактировании published-агента — ставим на review
    const newStatus = existing.status === "published" ? "review" : existing.status;

    const [updated] = await db
      .update(agents)
      .set({
        slug: d.slug,
        name: d.name,
        description: d.description,
        longDescription: d.long_description || null,
        category: d.category,
        pricingModel: d.pricing_model,
        priceMonthly: d.price_monthly ?? null,
        priceOnetime: d.price_onetime ?? null,
        computeClass: d.compute_class,
        dockerImage: d.docker_image,
        features: d.features,
        keywords: d.keywords,
        setupSchema: d.setup_schema,
        envTemplate: d.env_template,
        needsCron: d.needs_cron ?? false,
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(agents.id, id))
      .returning();

    return NextResponse.json({ data: updated });
  } catch (error) {
    logger.error({ err: error }, "seller agent PUT error");
    return NextResponse.json({ error: "Ошибка сервера", code: 500 }, { status: 500 });
  }
}

// Удалить агента (только draft/rejected)
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Не авторизован", code: 401 }, { status: 401 });
    }

    const [existing] = await db
      .select({ id: agents.id, status: agents.status })
      .from(agents)
      .where(and(eq(agents.id, id), eq(agents.sellerId, user.id)))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Агент не найден", code: 404 }, { status: 404 });
    }

    if (existing.status === "published" || existing.status === "review") {
      return NextResponse.json(
        { error: "Нельзя удалить опубликованного или проверяемого агента", code: 400 },
        { status: 400 }
      );
    }

    await db.delete(agents).where(eq(agents.id, id));

    return NextResponse.json({ data: { ok: true } });
  } catch (error) {
    logger.error({ err: error }, "seller agent DELETE error");
    return NextResponse.json({ error: "Ошибка сервера", code: 500 }, { status: 500 });
  }
}
