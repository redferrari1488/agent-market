import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agents, profiles } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getUser } from "@/lib/auth-server";
import { COMPUTE_CLASSES } from "@/lib/compute";
import { agentSchema } from "@/lib/validators";

// Получить всех агентов продавца
export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Не авторизован", code: 401 }, { status: 401 });
    }

    const [profile] = await db
      .select({ role: profiles.role })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);

    if (!profile || profile.role !== "seller") {
      return NextResponse.json({ error: "Только для продавцов", code: 403 }, { status: 403 });
    }

    const rows = await db
      .select()
      .from(agents)
      .where(eq(agents.sellerId, user.id))
      .orderBy(desc(agents.createdAt));

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("Seller agents GET error:", error);
    return NextResponse.json({ error: "Ошибка сервера", code: 500 }, { status: 500 });
  }
}

// Создать нового агента
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Не авторизован", code: 401 }, { status: 401 });
    }

    const [profile] = await db
      .select({ role: profiles.role })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);

    if (!profile || profile.role !== "seller") {
      return NextResponse.json({ error: "Только для продавцов", code: 403 }, { status: 403 });
    }

    const body = await request.json();
    const parsed = agentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Неверные данные", details: parsed.error.flatten(), code: 400 },
        { status: 400 }
      );
    }

    // Проверяем уникальность slug
    const [existing] = await db
      .select({ id: agents.id })
      .from(agents)
      .where(eq(agents.slug, parsed.data.slug))
      .limit(1);

    if (existing) {
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

    const [created] = await db
      .insert(agents)
      .values({
        sellerId: user.id,
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
        needsCron: d.needs_cron ?? false,
        status: "draft",
      })
      .returning();

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    console.error("Seller agents POST error:", error);
    return NextResponse.json({ error: "Ошибка сервера", code: 500 }, { status: 500 });
  }
}
