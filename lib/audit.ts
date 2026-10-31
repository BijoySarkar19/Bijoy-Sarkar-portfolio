import { prisma } from "@/lib/prisma";
export { formatIndianTime, formatIndianDate } from "@/lib/ist-date";

/**
 * Record an audit log entry in the database.
 */
export async function logAuditEvent({
  entity,
  entityId,
  action,
  changes,
  adminId,
  adminName,
}: {
  entity: "PROJECT" | "WORK_EXPERIENCE" | "SKILL_GROUP" | "RESUME" | "SETTINGS" | "AUTH" | "SYSTEM";
  entityId: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "ACTIVATE" | "DEACTIVATE" | "UPLOAD" | "LOGIN" | "INITIAL_SEED";
  changes: Record<string, unknown> | string;
  adminId: string;
  adminName: string;
}) {
  try {
    const payload = typeof changes === "string" ? changes : JSON.stringify(changes);
    return await prisma.auditLog.create({
      data: {
        entity,
        entityId,
        action,
        changes: payload,
        adminId,
        adminName,
      },
    });
  } catch (error) {
    console.error("Audit log failed to record:", error);
    return null;
  }
}
