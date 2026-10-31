import { prisma } from "@/lib/prisma";
import { AdminNavigation } from "@/components/admin/AdminNavigation";
import { SettingsManager } from "@/components/admin/SettingsManager";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settingsRecords = await prisma.siteSetting.findMany();
  const settingsMap: Record<string, string> = {};
  for (const s of settingsRecords) {
    settingsMap[s.key] = s.value;
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
