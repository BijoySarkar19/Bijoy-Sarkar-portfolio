import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cleanText, skillGroupSchema } from "@/lib/validation";
import { logAuditEvent } from "@/lib/audit";

export const runtime = "nodejs";

function isAdmin(role?: string) { return role === "ADMIN"; }

export async function GET() {
  try {
    const groups = await prisma.skillGroup.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    const parsed = groups.map((g) => ({
      ...g,
      skills: typeof g.skills === "string" ? JSON.parse(g.skills || "[]") : g.skills,
    }));
    return NextResponse.json({ skillGroups: parsed });
  } catch (error) {
    console.error("Failed to fetch skill groups:", error);
    return NextResponse.json({ error: "Skills temporarily unavailable." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON format." }, { status: 400 }); }

  const parsed = skillGroupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid fields.", fields: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  try {
    const created = await prisma.skillGroup.create({
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
      entityId: created.id,
      action: "CREATE",
      changes: {
        summary: `Created skill category "${created.title}"`,
        previous: null,
        current: created,
      },
      adminId: session?.user?.id || "unknown",
      adminName: session?.user?.name || "Admin",
    });

    return NextResponse.json({
      skillGroup: { ...created, skills: JSON.parse(created.skills || "[]") },
      auditLogId: auditEntry?.id,
    }, { status: 201 });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "A skill category with that title already exists." }, { status: 409 });
    }
    console.error("Failed to create skill group:", error);
    return NextResponse.json({ error: "Failed to save skill category." }, { status: 500 });
  }
}
