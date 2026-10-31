import { notFound } from "next/navigation";
import { AdminNavigation } from "@/components/admin/AdminNavigation";
import { ProjectForm } from "@/components/admin/ProjectForm";
import { prisma } from "@/lib/prisma";
import { toPortfolioProject } from "@/lib/projects";

export const dynamic = "force-dynamic";
interface EditProjectProps { params: Promise<{ id: string }> }

export default async function EditProjectPage({ params }: EditProjectProps) {
  const { id } = await params;
  const record = await prisma.project.findUnique({ where: { id } });
  if (!record) notFound();
  const project = toPortfolioProject(record);
  return (
    <main>
      <div className="admin-topline"><div><p className="section-kicker">Content management</p><h1>Edit project</h1></div></div>
      <AdminNavigation active="projects" />
      <section className="admin-card"><ProjectForm initial={{ ...project, githubUrl: project.githubUrl, liveUrl: project.liveUrl }} /></section>
    </main>
  );
}
