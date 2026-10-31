import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminNavigation } from "@/components/admin/AdminNavigation";
import { ProjectListManager } from "@/components/admin/ProjectListManager";
import { prisma } from "@/lib/prisma";

import { FALLBACK_PROJECTS } from "@/lib/fallback-data";

export const dynamic = "force-dynamic";

export default async function AdminProjectsPage() {
  let projects: Array<{
    id: string;
    slug: string;
    title: string;
    published: boolean;
    isOngoing: boolean;
    featuredOnHome: boolean;
    sortOrder: number;
    githubUrl: string | null;
    liveUrl: string | null;
    updatedAt: string;
  }> = [];

  try {
    const rawProjects = await prisma.project.findMany({
      orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
    });

    projects = rawProjects.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      published: p.published,
      isOngoing: p.isOngoing,
      featuredOnHome: p.featuredOnHome,
      sortOrder: p.sortOrder,
      githubUrl: p.githubUrl,
      liveUrl: p.liveUrl,
      updatedAt: p.updatedAt.toISOString(),
    }));
  } catch (err) {
    console.warn("Prisma error caught on AdminProjectsPage:", err);
  }

  if (projects.length === 0) {
    projects = FALLBACK_PROJECTS.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      published: p.published,
      isOngoing: p.isOngoing,
      featuredOnHome: p.featuredOnHome,
      sortOrder: p.sortOrder,
      githubUrl: p.githubUrl,
      liveUrl: p.liveUrl,
      updatedAt: new Date().toISOString(),
    }));
  }

  return (
    <main>
      <div className="admin-topline">
        <div>
          <p className="section-kicker">Content management</p>
          <h1>Projects</h1>
        </div>
      </div>

      <AdminNavigation active="projects" />

      <ProjectListManager initialProjects={projects} />
    </main>
  );
}
