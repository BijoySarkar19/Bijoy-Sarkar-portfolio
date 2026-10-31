import { prisma } from "@/lib/prisma";
import { AdminNavigation } from "@/components/admin/AdminNavigation";
import { SkillsManager } from "@/components/admin/SkillsManager";

import { FALLBACK_SKILL_GROUPS } from "@/lib/fallback-data";

export const dynamic = "force-dynamic";

export default async function AdminSkillsPage() {
  let parsed: Array<{
    id: string;
    title: string;
    note: string;
    icon: string;
    skills: string[];
    sortOrder: number;
  }> = [];

  try {
    const records = await prisma.skillGroup.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    parsed = records.map((g) => ({
      id: g.id,
      title: g.title,
      note: g.note,
      icon: g.icon,
      skills: typeof g.skills === "string" ? JSON.parse(g.skills || "[]") : g.skills,
      sortOrder: g.sortOrder,
    }));
  } catch (err) {
    console.warn("Prisma error caught on AdminSkillsPage:", err);
  }

  if (parsed.length === 0) {
    const defaultIconMap: Record<string, string> = {
      Programming: "Code2",
      "AI / Machine Learning": "BrainCircuit",
      "Web Engineering": "Terminal",
      "Mobile Development": "Smartphone",
      "Data & Storage": "Database",
      "Security & Delivery": "Fingerprint",
      Languages: "Languages",
    };
    parsed = FALLBACK_SKILL_GROUPS.map((g, idx) => ({
      id: `fallback-sg-${idx + 1}`,
      title: g.title,
      note: g.note,
      icon: defaultIconMap[g.title] || "Terminal",
      skills: g.skills,
      sortOrder: idx + 1,
    }));
  }

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
