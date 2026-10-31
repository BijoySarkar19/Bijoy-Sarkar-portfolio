import { prisma } from "@/lib/prisma";
import { AdminNavigation } from "@/components/admin/AdminNavigation";
import { ResumeManager } from "@/components/admin/ResumeManager";

export const dynamic = "force-dynamic";

export default async function AdminResumePage() {
  let parsed: Array<{
    id: string;
    filename: string;
    path: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
  }> = [];

  try {
    const records = await prisma.resumeFile.findMany({
      orderBy: [{ active: "desc" }, { createdAt: "desc" }],
    });

    parsed = records.map((r) => ({
      id: r.id,
      filename: r.filename,
      path: r.path,
      active: r.active,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
  } catch (err) {
    console.warn("Prisma error caught on AdminResumePage:", err);
  }

  if (parsed.length === 0) {
    parsed = [
      {
        id: "default-active-resume",
        filename: "Bijoy_Sarkar_CV.pdf",
        path: "/Bijoy_Sarkar_CV.pdf",
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }

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
