import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin-admin", "/api/"],
      },
      {
        userAgent: "Bingbot",
        allow: "/",
        disallow: ["/admin-admin", "/api/"],
      },
      {
        userAgent: "msnbot",
        allow: "/",
        disallow: ["/admin-admin", "/api/"],
      },
      {
        userAgent: "DuckDuckBot",
        allow: "/",
        disallow: ["/admin-admin", "/api/"],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/admin-admin", "/api/"],
      },
      {
        userAgent: "Googlebot-Image",
        allow: [
          "/",
          "/favicon.ico",
          "/favicon-48x48.png",
          "/favicon*.png",
          "/avatar.png",
          "/bijoy-sarkar.jpg",
          "/tab-icon.png",
          "/tab-icon.svg",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
