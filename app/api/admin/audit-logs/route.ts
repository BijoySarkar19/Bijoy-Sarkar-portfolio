import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatIndianTime } from "@/lib/audit";

export const runtime = "nodejs";

function isAdmin(role?: string) { return role === "ADMIN"; }

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format");
  const limit = Math.min(Number(searchParams.get("limit") || 100), 500);

  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { timestamp: "desc" },
      take: limit,
    });

    const dataset = logs.map((log) => ({
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

    if (format === "csv") {
      const headers = ["ID", "Entity", "Entity ID", "Action", "Admin", "Indian Standard Time (IST)", "Changes"];
      const rows = dataset.map((item) => [
        `"${item.id}"`,
        `"${item.entity}"`,
        `"${item.entityId}"`,
        `"${item.action}"`,
        `"${item.adminName}"`,
        `"${item.indianTime}"`,
        `"${JSON.stringify(item.changes).replace(/"/g, '""')}"`,
      ]);
      const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="portfolio_audit_log_ist.csv"`,
        },
      });
    }

    return NextResponse.json({ logs: dataset, count: dataset.length });
  } catch (error) {
    console.error("Failed to retrieve audit logs:", error);
    return NextResponse.json({ error: "Audit logs temporarily unavailable." }, { status: 500 });
  }
}
