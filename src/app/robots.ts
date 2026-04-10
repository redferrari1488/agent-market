import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/agents", "/about", "/privacy", "/terms"],
        disallow: ["/api/", "/dashboard", "/seller", "/admin", "/auth"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
