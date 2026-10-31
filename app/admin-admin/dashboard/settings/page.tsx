import { prisma } from "@/lib/prisma";
import { AdminNavigation } from "@/components/admin/AdminNavigation";
import { SettingsManager } from "@/components/admin/SettingsManager";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settingsMap: Record<string, string> = {
    heroTitle: "Software Engineer & AI Developer",
    heroSubhead: "Building intelligent systems and full-stack solutions.",
    heroBio: "Computer Science undergraduate focused on AI/ML, secure software, and useful digital products.",
    contactEmail: "bijoysarkar7252@gmail.com",
    contactRecipientEmail: "bijoysarkar7252@gmail.com",
    location: "Agartala, Tripura, India",
    locationMapUrl: "https://maps.google.com/?q=Agartala,+Tripura,+India",
    status: "Open to opportunities",
    githubUrl: "https://github.com/BijoySarkar19",
    degreesList: JSON.stringify([
      {
        id: "btech-degree",
        degree: "B.Tech · Computer Science & Engineering",
        institution: "ICFAI University Tripura",
        link: "https://www.iutripura.edu.in/",
        period: "2023 - 2027",
        showOnHome: true,
      },
    ]),
  };

  try {
    const settingsRecords = await prisma.siteSetting.findMany();
    for (const s of settingsRecords) {
      settingsMap[s.key] = s.value;
    }
  } catch (err) {
    console.warn("Prisma error caught on AdminSettingsPage:", err);
  }

  return (
    <main>
      <div className="admin-topline">
        <div>
          <p className="section-kicker">Configuration</p>
          <h1>Site Settings</h1>
        </div>
      </div>
      <AdminNavigation active="settings" />
      <SettingsManager initialSettings={settingsMap} />
    </main>
  );
}
