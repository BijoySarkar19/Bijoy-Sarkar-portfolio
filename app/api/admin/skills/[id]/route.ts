import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cleanText, skillGroupSchema } from "@/lib/validation";
import { logAuditEvent } from "@/lib/audit";

export const runtime = "nodejs";

interface RouteContext { params: Promise<{ id: string }> }

function isAdmin(role?: string) { return role === "ADMIN"; }

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  try {
    const item = await prisma.skillGroup.findUnique({ where: { id } });
    if (!item) return NextResponse.json({ error: "Skill category not found." }, { status: 404 });
    return NextResponse.json({
      skillGroup: { ...item, skills: JSON.parse(item.skills || "[]") },
    });
  } catch (error) {
    console.error("Skill group lookup failed:", error);
    return NextResponse.json({ error: "Failed to fetch skill category." }, { status: 500 });
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

  const parsed = skillGroupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid fields.", fields: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  try {
    const existing = await prisma.skillGroup.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Skill category not found." }, { status: 404 });

    const updated = await prisma.skillGroup.update({
      where: { id },
      data: {
        title: cleanText(parsed.data.title),
        note: cleanText(parsed.data.note),
        icon: cleanText(parsed.data.icon),
        skills: JSON.stringify(parsed.data.skills.map(cleanText)),
        sortOrder: parsed.data.sortOrder,
      },
    });

    const auditEntry = await logAuditEvent({
      entity: "SKILL_GROUP",
      entityId: id,
      action: "UPDATE",
      changes: {
        summary: `Updated skill category "${updated.title}"`,
        previous: existing,
        current: updated,
      },
      adminId: session?.user?.id || "unknown",
      adminName: session?.user?.name || "Admin",
    });

    return NextResponse.json({
      skillGroup: { ...updated, skills: JSON.parse(updated.skills || "[]") },
      auditLogId: auditEntry?.id,
    });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "A category with that title already exists." }, { status: 409 });
    }
    console.error("Skill group update failed:", error);
    return NextResponse.json({ error: "Failed to update skill category." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }
  const { id } = await params;

  try {
    const existing = await prisma.skillGroup.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Skill category not found." }, { status: 404 });

    await prisma.skillGroup.delete({ where: { id } });

    const auditEntry = await logAuditEvent({
      entity: "SKILL_GROUP",
      entityId: id,
      action: "DELETE",
      changes: {
        summary: `Deleted skill category "${existing.title}"`,
        previous: existing,
        current: null,
      },
      adminId: session?.user?.id || "unknown",
      adminName: session?.user?.name || "Admin",
    });

    return NextResponse.json({ success: true, auditLogId: auditEntry?.id });
  } catch (error) {
    console.error("Skill group deletion failed:", error);
    return NextResponse.json({ error: "Failed to delete skill category." }, { status: 500 });
  }
}
