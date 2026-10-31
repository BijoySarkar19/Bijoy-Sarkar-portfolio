import { prisma } from "@/lib/prisma";
import { AdminNavigation } from "@/components/admin/AdminNavigation";
import { ExperienceManager } from "@/components/admin/ExperienceManager";

export const dynamic = "force-dynamic";

export default async function AdminExperiencePage() {
  const records = await prisma.workExperience.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  const parsed = records.map((exp) => ({
    id: exp.id,
    period: exp.period,
    role: exp.role,
    organization: exp.organization,
    summary: exp.summary,
    tags: typeof exp.tags === "string" ? JSON.parse(exp.tags || "[]") : exp.tags,
    sortOrder: exp.sortOrder,
  }));

  return (
    <main>
      <div className="admin-topline">
        <div>
          <p className="section-kicker">Experience Workspace</p>
          <h1>Work Experience</h1>
        </div>
      </div>
      <AdminNavigation active="experience" />
      <ExperienceManager initialExperiences={parsed} />
    </main>
  );
}
