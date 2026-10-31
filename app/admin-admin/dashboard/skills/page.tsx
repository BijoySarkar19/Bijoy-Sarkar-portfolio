import { prisma } from "@/lib/prisma";
import { AdminNavigation } from "@/components/admin/AdminNavigation";
import { SkillsManager } from "@/components/admin/SkillsManager";

export const dynamic = "force-dynamic";

export default async function AdminSkillsPage() {
  const records = await prisma.skillGroup.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  const parsed = records.map((g) => ({
    id: g.id,
    title: g.title,
    note: g.note,
    icon: g.icon,
    skills: typeof g.skills === "string" ? JSON.parse(g.skills || "[]") : g.skills,
    sortOrder: g.sortOrder,
  }));

  return (
    <main>
      <div className="admin-topline">
        <div>
          <p className="section-kicker">Toolkit Workspace</p>
          <h1>Skills &amp; Languages</h1>
        </div>
      </div>
      <AdminNavigation active="skills" />
      <SkillsManager initialGroups={parsed} />
    </main>
  );
}
