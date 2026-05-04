import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { subscriptions, agents } from "@/lib/db/schema";
import { getUser } from "@/lib/auth-server";
import {
  DashboardCockpit,
  type DashAgent,
} from "@/components/dashboard/DashboardCockpit";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Мои агенты - hireon",
  description: "Управление подписками и настройками AI-агентов.",
};

const ALLOWED_STATUS: DashAgent["status"][] = [
  "active",
  "paused",
  "pending_setup",
  "cancelled",
  "expired",
];

function toIsoDate(d: Date | string | null): string {
  if (!d) return "";
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) redirect("/");

  const rows = await db
    .select({
      id: subscriptions.id,
      status: subscriptions.status,
      purchaseType: subscriptions.purchaseType,
      startedAt: subscriptions.startedAt,
      amount: subscriptions.amount,
      currency: subscriptions.currency,
      agentName: agents.name,
      agentSlug: agents.slug,
      agentDescription: agents.description,
      agentCategory: agents.category,
    })
    .from(subscriptions)
    .leftJoin(agents, eq(subscriptions.agentId, agents.id))
    .where(eq(subscriptions.userId, user.id))
    .orderBy(desc(subscriptions.startedAt));

  const list: DashAgent[] = rows
    .filter((r) => r.agentName)
    .map((r) => ({
      id: r.id,
      agentName: r.agentName as string,
      agentSlug: r.agentSlug || "",
      agentDescription: r.agentDescription || "",
      agentCategory: r.agentCategory || "support",
      status: (ALLOWED_STATUS.includes(r.status as DashAgent["status"])
        ? (r.status as DashAgent["status"])
        : "pending_setup") as DashAgent["status"],
      purchaseType:
        r.purchaseType === "one_time" ? "one_time" : "subscription",
      startedAt: toIsoDate(r.startedAt),
      amount: r.amount,
      currency: r.currency || "RUB",
    }));

  return <DashboardCockpit agents={list} />;
}
