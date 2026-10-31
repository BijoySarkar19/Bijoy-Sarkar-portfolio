import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";

export const runtime = "nodejs";

function isAdmin(role?: string) {
  return role === "ADMIN";
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { auditLogId } = body;

    if (!auditLogId) {
      return NextResponse.json({ error: "Audit log ID is required to undo." }, { status: 400 });
    }

    const log = await prisma.auditLog.findUnique({
      where: { id: auditLogId },
    });

    if (!log) {
      return NextResponse.json({ error: "Audit record not found." }, { status: 404 });
    }

    let parsedChanges: {
      summary?: string;
      previous?: any;
      current?: any;
      previousActiveId?: string | null;
      newActiveId?: string | null;
      [key: string]: any;
    } = {};

    try {
      parsedChanges = typeof log.changes === "string" ? JSON.parse(log.changes) : log.changes;
    } catch {
      return NextResponse.json({ error: "Could not parse audit changes." }, { status: 400 });
    }

    const { entity, action, entityId } = log;
    let revertedSummary = "";

    // 1. WORK_EXPERIENCE
    if (entity === "WORK_EXPERIENCE") {
      if (action === "CREATE") {
        await prisma.workExperience.delete({ where: { id: entityId } }).catch(() => null);
        revertedSummary = `Reverted addition of work experience (deleted ID ${entityId})`;
      } else if (action === "DELETE" && parsedChanges.previous) {
        const prev = parsedChanges.previous;
        await prisma.workExperience.create({
          data: {
            id: prev.id || entityId,
            period: prev.period,
            role: prev.role,
            organization: prev.organization,
            summary: prev.summary,
            tags: typeof prev.tags === "string" ? prev.tags : JSON.stringify(prev.tags || []),
            sortOrder: prev.sortOrder ?? 0,
          },
        });
        revertedSummary = `Restored deleted work experience "${prev.role} at ${prev.organization}"`;
      } else if (action === "UPDATE" && parsedChanges.previous) {
        const prev = parsedChanges.previous;
        await prisma.workExperience.update({
          where: { id: entityId },
          data: {
            period: prev.period,
            role: prev.role,
            organization: prev.organization,
            summary: prev.summary,
            tags: typeof prev.tags === "string" ? prev.tags : JSON.stringify(prev.tags || []),
            sortOrder: prev.sortOrder ?? 0,
          },
        });
        revertedSummary = `Reverted updates to work experience "${prev.role}"`;
      } else {
        return NextResponse.json({ error: "Cannot undo: missing snapshot for this experience action." }, { status: 400 });
      }
    }

    // 2. SKILL_GROUP
    else if (entity === "SKILL_GROUP") {
      if (action === "CREATE") {
        await prisma.skillGroup.delete({ where: { id: entityId } }).catch(() => null);
        revertedSummary = `Reverted addition of skill category (deleted ID ${entityId})`;
      } else if (action === "DELETE" && parsedChanges.previous) {
        const prev = parsedChanges.previous;
        await prisma.skillGroup.create({
          data: {
            id: prev.id || entityId,
            title: prev.title,
            note: prev.note,
            icon: prev.icon,
            skills: typeof prev.skills === "string" ? prev.skills : JSON.stringify(prev.skills || []),
            sortOrder: prev.sortOrder ?? 0,
          },
        });
        revertedSummary = `Restored deleted skill group "${prev.title}"`;
      } else if (action === "UPDATE" && parsedChanges.previous) {
        const prev = parsedChanges.previous;
        await prisma.skillGroup.update({
          where: { id: entityId },
          data: {
            title: prev.title,
            note: prev.note,
            icon: prev.icon,
            skills: typeof prev.skills === "string" ? prev.skills : JSON.stringify(prev.skills || []),
            sortOrder: prev.sortOrder ?? 0,
          },
        });
        revertedSummary = `Reverted updates to skill category "${prev.title}"`;
      } else {
        return NextResponse.json({ error: "Cannot undo: missing snapshot for this skill action." }, { status: 400 });
      }
    }

    // 3. PROJECT
    else if (entity === "PROJECT") {
      if (action === "CREATE") {
        await prisma.project.delete({ where: { id: entityId } }).catch(() => null);
        revertedSummary = `Reverted addition of project (deleted ID ${entityId})`;
      } else if (action === "DELETE" && parsedChanges.previous) {
        const prev = parsedChanges.previous;
        await prisma.project.create({
          data: {
            id: prev.id || entityId,
            slug: prev.slug,
            title: prev.title,
            description: prev.description,
            longDescription: prev.longDescription,
            image1: prev.image1,
            image2: prev.image2,
            image3: prev.image3,
            techStack: typeof prev.techStack === "string" ? prev.techStack : JSON.stringify(prev.techStack || []),
            features: typeof prev.features === "string" ? prev.features : JSON.stringify(prev.features || []),
            githubUrl: prev.githubUrl,
            liveUrl: prev.liveUrl,
            published: prev.published ?? true,
            isOngoing: prev.isOngoing ?? false,
            featuredOnHome: prev.featuredOnHome ?? false,
            sortOrder: prev.sortOrder ?? 0,
          },
        });
        revertedSummary = `Restored deleted project "${prev.title}"`;
      } else if (action === "UPDATE" && parsedChanges.previous) {
        const prev = parsedChanges.previous;
        await prisma.project.update({
          where: { id: entityId },
          data: {
            slug: prev.slug,
            title: prev.title,
            description: prev.description,
            longDescription: prev.longDescription,
            image1: prev.image1,
            image2: prev.image2,
            image3: prev.image3,
            techStack: typeof prev.techStack === "string" ? prev.techStack : JSON.stringify(prev.techStack || []),
            features: typeof prev.features === "string" ? prev.features : JSON.stringify(prev.features || []),
            githubUrl: prev.githubUrl,
            liveUrl: prev.liveUrl,
            published: prev.published ?? true,
            isOngoing: prev.isOngoing ?? false,
            featuredOnHome: prev.featuredOnHome ?? false,
            sortOrder: prev.sortOrder ?? 0,
          },
        });
        revertedSummary = `Reverted updates to project "${prev.title}"`;
      } else {
        return NextResponse.json({ error: "Cannot undo: missing snapshot for this project action." }, { status: 400 });
      }
    }

    // 4. RESUME
    else if (entity === "RESUME") {
      if (action === "ACTIVATE" || action === "DEACTIVATE") {
        await prisma.resumeFile.updateMany({ data: { active: false } });
        if (parsedChanges.previousActiveId) {
          await prisma.resumeFile.update({
            where: { id: parsedChanges.previousActiveId },
            data: { active: true },
          }).catch(() => null);
        }
        revertedSummary = `Reverted resume active state`;
      } else if (action === "UPLOAD" || action === "CREATE") {
        await prisma.resumeFile.delete({ where: { id: entityId } }).catch(() => null);
        if (parsedChanges.previousActiveId) {
          await prisma.resumeFile.update({
            where: { id: parsedChanges.previousActiveId },
            data: { active: true },
          }).catch(() => null);
        }
        revertedSummary = `Reverted resume upload (removed file record)`;
      } else if (action === "DELETE" && parsedChanges.previous) {
        const prev = parsedChanges.previous;
        await prisma.resumeFile.create({
          data: {
            id: prev.id || entityId,
            filename: prev.filename,
            path: prev.path,
            active: prev.active ?? false,
          },
        });
        revertedSummary = `Restored deleted CV record "${prev.filename}"`;
      } else {
        return NextResponse.json({ error: "Cannot undo this resume action." }, { status: 400 });
      }
    }

    // 5. SETTINGS
    else if (entity === "SETTINGS" && parsedChanges.previous) {
      for (const [key, val] of Object.entries(parsedChanges.previous)) {
        await prisma.siteSetting.upsert({
          where: { key },
          update: { value: String(val) },
          create: { key, value: String(val) },
        });
      }
      revertedSummary = `Restored previous site settings values`;
    } else {
      return NextResponse.json({ error: `Undo not supported for entity type "${entity}".` }, { status: 400 });
    }

    // Log the undo action itself in the audit dataset
    await logAuditEvent({
      entity: entity as any,
      entityId,
      action: "UPDATE",
      changes: {
        summary: `UNDO: ${revertedSummary}`,
        undoneAuditId: auditLogId,
        undoneAction: action,
      },
      adminId: session?.user?.id || "unknown",
      adminName: session?.user?.name || "Admin",
    });

    return NextResponse.json({
      success: true,
      message: revertedSummary,
    });
  } catch (error) {
    console.error("Undo action failed:", error);
    return NextResponse.json({ error: "Failed to perform undo operation." }, { status: 500 });
  }
}
