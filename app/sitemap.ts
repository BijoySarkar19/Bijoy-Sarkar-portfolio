import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { getSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const projects = await prisma.project.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } });
  return [
    { url: base, lastModified: new Date(), changeFrequency: "monthly", priority: 1 },
    { url: `${base}/projects`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    ...projects.map((project) => ({ url: `${base}/projects/${project.slug}`, lastModified: project.updatedAt, changeFrequency: "monthly" as const, priority: 0.65 })),
  ];
}
