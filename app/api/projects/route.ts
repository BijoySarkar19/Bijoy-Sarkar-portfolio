import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toPortfolioProject } from "@/lib/projects";
import { cleanText, projectInputSchema } from "@/lib/validation";
import { logAuditEvent } from "@/lib/audit";

export const runtime = "nodejs";

function isAdminRole(role: string | undefined) { return role === "ADMIN"; }

export async function GET() {
  try {
    const projects = await prisma.project.findMany({ where: { published: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] });
    return NextResponse.json({ projects: projects.map(toPortfolioProject) }, { headers: { "cache-control": "public, max-age=60, stale-while-revalidate=300" } });
  } catch (error) {
    console.error("Public project list failed:", error);
    return NextResponse.json({ error: "Projects are temporarily unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdminRole(session?.user?.role)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

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
    const project = await prisma.project.create({ data });
    const auditEntry = await logAuditEvent({
      entity: "PROJECT",
      entityId: project.id,
      action: "CREATE",
      changes: {
        summary: `Created project "${project.title}"`,
        previous: null,
        current: project,
      },
      adminId: session?.user?.id || "unknown",
      adminName: session?.user?.name || "Admin",
    });
    return NextResponse.json({ project: toPortfolioProject(project), auditLogId: auditEntry?.id }, { status: 201 });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") return NextResponse.json({ error: "A project with that slug already exists." }, { status: 409 });
    console.error("Project creation failed:", error);
    return NextResponse.json({ error: "The project could not be saved." }, { status: 500 });
  }
}
