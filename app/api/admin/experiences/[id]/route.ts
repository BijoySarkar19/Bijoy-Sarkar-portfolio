import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cleanText, workExperienceSchema } from "@/lib/validation";
import { logAuditEvent } from "@/lib/audit";

export const runtime = "nodejs";

interface RouteContext { params: Promise<{ id: string }> }

function isAdmin(role?: string) { return role === "ADMIN"; }

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  try {
    const item = await prisma.workExperience.findUnique({ where: { id } });
    if (!item) return NextResponse.json({ error: "Work experience not found." }, { status: 404 });
    return NextResponse.json({
      experience: { ...item, tags: JSON.parse(item.tags || "[]") },
    });
  } catch (error) {
    console.error("Experience lookup failed:", error);
    return NextResponse.json({ error: "Failed to fetch work experience." }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }
  const { id } = await params;

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON format." }, { status: 400 }); }

  const parsed = workExperienceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid fields.", fields: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  try {
    const existing = await prisma.workExperience.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Work experience not found." }, { status: 404 });

    const updated = await prisma.workExperience.update({
      where: { id },
      data: {
        period: cleanText(parsed.data.period),
        role: cleanText(parsed.data.role),
        organization: cleanText(parsed.data.organization),
        summary: cleanText(parsed.data.summary),
        tags: JSON.stringify(parsed.data.tags.map(cleanText)),
        sortOrder: parsed.data.sortOrder,
      },
    });

    const auditEntry = await logAuditEvent({
      entity: "WORK_EXPERIENCE",
      entityId: id,
      action: "UPDATE",
      changes: {
        summary: `Updated work experience "${updated.role} at ${updated.organization}"`,
        previous: existing,
        current: updated,
      },
      adminId: session?.user?.id || "unknown",
      adminName: session?.user?.name || "Admin",
    });

    return NextResponse.json({
      experience: { ...updated, tags: JSON.parse(updated.tags || "[]") },
      auditLogId: auditEntry?.id,
    });
  } catch (error) {
    console.error("Experience update failed:", error);
    return NextResponse.json({ error: "Failed to update work experience." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }
  const { id } = await params;

  try {
    const existing = await prisma.workExperience.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Work experience not found." }, { status: 404 });

    await prisma.workExperience.delete({ where: { id } });

    const auditEntry = await logAuditEvent({
      entity: "WORK_EXPERIENCE",
      entityId: id,
      action: "DELETE",
      changes: {
        summary: `Deleted work experience "${existing.role} at ${existing.organization}"`,
        previous: existing,
        current: null,
      },
      adminId: session?.user?.id || "unknown",
      adminName: session?.user?.name || "Admin",
    });

    return NextResponse.json({ success: true, auditLogId: auditEntry?.id });
  } catch (error) {
    console.error("Experience deletion failed:", error);
    return NextResponse.json({ error: "Failed to delete work experience." }, { status: 500 });
  }
}
