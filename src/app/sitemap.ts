import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { agents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const PRODUCTION_APP_URL = "https://hireon.agency";

function getSitemapBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (raw) {
    try {
      return new URL(raw).origin;
    } catch {
      // Ignore malformed env values and fall back to a safe default below.
    }
  }

  return process.env.NODE_ENV === "production"
    ? PRODUCTION_APP_URL
    : "http://localhost:3000";
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSitemapBaseUrl();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/agents`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/terms`, changeFrequency: "yearly", priority: 0.3 },
  ];

  try {
    const published = await db
      .select({ slug: agents.slug, updatedAt: agents.updatedAt })
      .from(agents)
      .where(eq(agents.status, "published"));

    const agentRoutes: MetadataRoute.Sitemap = published.map((a) => ({
      url: `${base}/agents/${a.slug}`,
      lastModified: a.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    return [...staticRoutes, ...agentRoutes];
  } catch {
    return staticRoutes;
  }
}
