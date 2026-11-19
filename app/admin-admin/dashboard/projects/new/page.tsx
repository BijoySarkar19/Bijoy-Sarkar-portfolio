import { AdminNavigation } from "@/components/admin/AdminNavigation";
import { ProjectForm } from "@/components/admin/ProjectForm";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function NewProjectPage() {
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
    console.warn("Could not load default settings for new project:", err);
  }

  return (
    <main>
      <div className="admin-topline">
        <div>
          <p className="section-kicker">Content management</p>
          <h1>New project</h1>
        </div>
      </div>
      <AdminNavigation active="new" />
      <section className="admin-card">
        <ProjectForm
          defaultOngoingImage={defaultOngoingImage}
          defaultImageCount={defaultImageCount}
        />
      </section>
    </main>
  );
}
