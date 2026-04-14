import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agents, profiles } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getUser } from "@/lib/auth-server";
import { agentSchema } from "@/lib/validators";

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
    console.error("Seller agent GET error:", error);
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
        setupSchema: d.setup_schema,
        envTemplate: d.env_template,
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(agents.id, id))
      .returning();

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("Seller agent PUT error:", error);
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
    console.error("Seller agent DELETE error:", error);
    return NextResponse.json({ error: "Ошибка сервера", code: 500 }, { status: 500 });
  }
}
