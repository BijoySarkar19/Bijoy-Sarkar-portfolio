import { prisma } from "@/lib/prisma";
import { AdminNavigation } from "@/components/admin/AdminNavigation";
import { ResumeManager } from "@/components/admin/ResumeManager";

export const dynamic = "force-dynamic";

export default async function AdminResumePage() {
  const records = await prisma.resumeFile.findMany({
    orderBy: [{ active: "desc" }, { createdAt: "desc" }],
  });

  const parsed = records.map((r) => ({
    id: r.id,
    filename: r.filename,
    path: r.path,
    active: r.active,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  return (
    <main>
      <div className="admin-topline">
        <div>
          <p className="section-kicker">Curriculum Vitae Workspace</p>
          <h1>CV &amp; Resume</h1>
        </div>
      </div>
      <AdminNavigation active="resume" />
      <ResumeManager initialResumes={parsed} />
    </main>
  );
}
