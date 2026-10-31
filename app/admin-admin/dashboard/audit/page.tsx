import { prisma } from "@/lib/prisma";
import { AdminNavigation } from "@/components/admin/AdminNavigation";
import { AuditLogViewer } from "@/components/admin/AuditLogViewer";
import { formatIndianTime } from "@/lib/audit";

export const dynamic = "force-dynamic";

export default async function AdminAuditPage() {
  const records = await prisma.auditLog.findMany({
    orderBy: { timestamp: "desc" },
    take: 200,
  });

  const parsed = records.map((log) => ({
    id: log.id,
    entity: log.entity,
    entityId: log.entityId,
    action: log.action,
    changes: typeof log.changes === "string" ? JSON.parse(log.changes || "{}") : log.changes,
    adminId: log.adminId,
    adminName: log.adminName,
    rawTimestamp: log.timestamp.toISOString(),
    indianTime: formatIndianTime(log.timestamp),
  }));

  return (
    <main>
      <div className="admin-topline">
        <div>
          <p className="section-kicker">Compliance &amp; History</p>
          <h1>Activity Dataset (IST)</h1>
        </div>
      </div>
      <AdminNavigation active="audit" />
      <AuditLogViewer initialLogs={parsed} />
    </main>
  );
}
