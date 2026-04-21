import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/agents/"],
      disallow: ["/admin/", "/api/", "/seller/onboarding", "/dashboard/", "/auth/"],
    },
    sitemap: "https://hireon.agency/sitemap.xml",
  };
}
