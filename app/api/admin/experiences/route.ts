import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cleanText, workExperienceSchema } from "@/lib/validation";
import { logAuditEvent } from "@/lib/audit";

export const runtime = "nodejs";

function isAdmin(role?: string) { return role === "ADMIN"; }

export async function GET() {
  try {
    const list = await prisma.workExperience.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
    const parsed = list.map((item) => ({
      ...item,
      tags: typeof item.tags === "string" ? JSON.parse(item.tags || "[]") : item.tags,
    }));
    return NextResponse.json({ experiences: parsed });
  } catch (error) {
    console.error("Failed to fetch experiences:", error);
    return NextResponse.json({ error: "Experiences temporarily unavailable." }, { status: 500 });
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

  const parsed = workExperienceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid fields.", fields: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  try {
    const created = await prisma.workExperience.create({
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
      entityId: created.id,
      action: "CREATE",
      changes: {
        summary: `Created work experience "${created.role} at ${created.organization}"`,
        previous: null,
        current: created,
      },
      adminId: session?.user?.id || "unknown",
      adminName: session?.user?.name || "Admin",
    });

    return NextResponse.json({
      experience: { ...created, tags: JSON.parse(created.tags || "[]") },
      auditLogId: auditEntry?.id,
    }, { status: 201 });
  } catch (error) {
    console.error("Failed to create experience:", error);
    return NextResponse.json({ error: "Failed to save work experience." }, { status: 500 });
  }
}
