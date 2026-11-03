import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin-admin", "/api/"] },
      { userAgent: "Googlebot-Image", allow: ["/", "/favicon.ico", "/favicon-48x48.png", "/favicon*.png", "/avatar.png", "/bijoy-sarkar.jpg"] },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
