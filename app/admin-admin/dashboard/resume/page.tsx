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

  let watermarkMap: Record<string, string> = {
    enabled: "true",
    text: "bijoy-sarkar-portfolio",
    opacity: "0.085",
    angle: "-22",
  };
  try {
    const wSettings = await prisma.siteSetting.findMany({
      where: {
        key: {
          in: [
            "cvWatermarkEnabled",
            "cvWatermarkText",
            "cvWatermarkOpacity",
            "cvWatermarkAngle",
            "cv_watermark_enabled",
            "cv_watermark_text",
            "cv_watermark_opacity",
            "cv_watermark_angle",
          ],
        },
      },
    });
    for (const s of wSettings) {
      if (s.key === "cvWatermarkEnabled" || s.key === "cv_watermark_enabled") watermarkMap.enabled = s.value;
      if (s.key === "cvWatermarkText" || s.key === "cv_watermark_text") watermarkMap.text = s.value;
      if (s.key === "cvWatermarkOpacity" || s.key === "cv_watermark_opacity") watermarkMap.opacity = s.value;
      if (s.key === "cvWatermarkAngle" || s.key === "cv_watermark_angle") watermarkMap.angle = s.value;
    }
  } catch {}

  return (
    <main>
      <div className="admin-topline">
        <div>
          <p className="section-kicker">Curriculum Vitae Workspace</p>
          <h1>CV &amp; Resume</h1>
        </div>
      </div>
      <AdminNavigation active="resume" />
      <ResumeManager initialResumes={parsed} initialWatermark={watermarkMap} />
    </main>
  );
}
