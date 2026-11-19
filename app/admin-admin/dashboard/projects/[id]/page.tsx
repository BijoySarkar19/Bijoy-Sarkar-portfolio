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

  let defaultOngoingImage = "/images/ongoing-project-cover.webp";
  let defaultImageCount = 3;

  try {
    const settings = await prisma.siteSetting.findMany({
      where: { key: { in: ["ongoingDefaultImage", "defaultProjectImageCount"] } },
    });
    for (const s of settings) {
      if (s.key === "ongoingDefaultImage" && s.value) defaultOngoingImage = s.value;
      if (s.key === "defaultProjectImageCount" && s.value) {
        const count = parseInt(s.value, 10);
        if (!isNaN(count) && count >= 1 && count <= 10) defaultImageCount = count;
      }
    }
  } catch (err) {
    console.warn("Could not load default settings for edit project:", err);
  }

  return (
    <main>
      <div className="admin-topline">
        <div>
          <p className="section-kicker">Content management</p>
          <h1>Edit project</h1>
        </div>
      </div>
      <AdminNavigation active="projects" />
      <section className="admin-card">
        <ProjectForm
          initial={{ ...project, githubUrl: project.githubUrl, liveUrl: project.liveUrl }}
          defaultOngoingImage={defaultOngoingImage}
          defaultImageCount={defaultImageCount}
        />
      </section>
    </main>
  );
}
