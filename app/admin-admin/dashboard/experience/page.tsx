import { prisma } from "@/lib/prisma";
import { AdminNavigation } from "@/components/admin/AdminNavigation";
import { ExperienceManager } from "@/components/admin/ExperienceManager";

import { FALLBACK_EXPERIENCES } from "@/lib/fallback-data";

export const dynamic = "force-dynamic";

export default async function AdminExperiencePage() {
  let parsed: Array<{
    id: string;
    period: string;
    role: string;
    organization: string;
    summary: string;
    tags: string[];
    sortOrder: number;
  }> = [];

  try {
    const records = await prisma.workExperience.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });

    parsed = records.map((exp) => ({
      id: exp.id,
      period: exp.period,
      role: exp.role,
      organization: exp.organization,
      summary: exp.summary,
      tags: typeof exp.tags === "string" ? JSON.parse(exp.tags || "[]") : exp.tags,
      sortOrder: exp.sortOrder,
    }));
  } catch (err) {
    console.warn("Prisma error caught on AdminExperiencePage:", err);
  }

  if (parsed.length === 0) {
    parsed = FALLBACK_EXPERIENCES.map((exp, idx) => ({
      id: `fallback-exp-${idx + 1}`,
      period: exp.period,
      role: exp.role,
      organization: exp.organization,
      summary: exp.summary,
      tags: exp.tags,
      sortOrder: idx + 1,
    }));
  }

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
