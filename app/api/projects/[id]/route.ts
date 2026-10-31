import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toPortfolioProject } from "@/lib/projects";
import { cleanText, projectInputSchema } from "@/lib/validation";
import { logAuditEvent } from "@/lib/audit";

export const runtime = "nodejs";
interface RouteContext { params: Promise<{ id: string }> }

function isAdminRole(role: string | undefined) { return role === "ADMIN"; }

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  try {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project?.published) return NextResponse.json({ error: "Project not found." }, { status: 404 });
    return NextResponse.json({ project: toPortfolioProject(project) }, { headers: { "cache-control": "public, max-age=60, stale-while-revalidate=300" } });
  } catch (error) {
    console.error("Project lookup failed:", error);
    return NextResponse.json({ error: "Project details are temporarily unavailable." }, { status: 503 });
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!isAdminRole(session?.user?.role)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await params;
  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "A valid JSON body is required." }, { status: 400 }); }
  const parsed = projectInputSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Please correct the project fields.", fields: parsed.error.flatten().fieldErrors }, { status: 422 });

  const data = {
    ...parsed.data,
    title: cleanText(parsed.data.title),
    description: cleanText(parsed.data.description),
    longDescription: cleanText(parsed.data.longDescription),
    techStack: JSON.stringify(parsed.data.techStack.map(cleanText)),
    features: JSON.stringify(parsed.data.features.map(cleanText)),
    githubUrl: parsed.data.githubUrl || null,
    liveUrl: parsed.data.liveUrl || null,
  };

  try {
    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Project not found." }, { status: 404 });

    const project = await prisma.project.update({ where: { id }, data });
    const auditEntry = await logAuditEvent({
      entity: "PROJECT",
      entityId: id,
      action: "UPDATE",
      changes: {
        summary: `Updated project "${project.title}"`,
        previous: existing,
        current: project,
      },
      adminId: session?.user?.id || "unknown",
      adminName: session?.user?.name || "Admin",
    });
    return NextResponse.json({ project: toPortfolioProject(project), auditLogId: auditEntry?.id });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error) {
      if (error.code === "P2002") return NextResponse.json({ error: "A project with that slug already exists." }, { status: 409 });
      if (error.code === "P2025") return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }
    console.error("Project update failed:", error);
    return NextResponse.json({ error: "The project could not be updated." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!isAdminRole(session?.user?.role)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await params;
  try {
    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Project not found." }, { status: 404 });

    await prisma.project.delete({ where: { id } });
    const auditEntry = await logAuditEvent({
      entity: "PROJECT",
      entityId: id,
      action: "DELETE",
      changes: {
        summary: `Deleted project "${existing.title}"`,
        previous: existing,
        current: null,
      },
      adminId: session?.user?.id || "unknown",
      adminName: session?.user?.name || "Admin",
    });
    return NextResponse.json({ success: true, auditLogId: auditEntry?.id });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2025") return NextResponse.json({ error: "Project not found." }, { status: 404 });
    console.error("Project deletion failed:", error);
    return NextResponse.json({ error: "The project could not be deleted." }, { status: 500 });
  }
}
