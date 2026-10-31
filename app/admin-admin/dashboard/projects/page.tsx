import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminNavigation } from "@/components/admin/AdminNavigation";
import { ProjectListManager } from "@/components/admin/ProjectListManager";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminProjectsPage() {
  const rawProjects = await prisma.project.findMany({
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
  });

  const projects = rawProjects.map((p) => ({
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

  return (
    <main>
      <div className="admin-topline">
        <div>
          <p className="section-kicker">Content management</p>
          <h1>Projects</h1>
        </div>
        <Link className="button" href="/admin-admin/dashboard/projects/new">
          Add project <Plus size={14} />
        </Link>
      </div>

      <AdminNavigation active="projects" />

      <ProjectListManager initialProjects={projects} />
    </main>
  );
}
