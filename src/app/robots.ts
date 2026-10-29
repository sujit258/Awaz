import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://awaz.suvidhatools.in";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/issues",
          "/issues/*",
          "/methodology",
          "/about",
          "/privacy",
          "/terms",
          "/report",
        ],
        disallow: [
          "/track*",
          "/admin*",
          "/api/*",
          "/login",
          "/my-reports",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
