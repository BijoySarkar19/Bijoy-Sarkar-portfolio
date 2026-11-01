import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

function isAdmin(role?: string) {
  return role === "ADMIN";
}

export async function POST(request: Request, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { action } = body as { action: "toggle_ongoing" | "toggle_featured_home" | "toggle_published" };

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    let updatedProject;
    let auditSummary = "";

    if (action === "toggle_ongoing") {
      const nextOngoing = !project.isOngoing;
      let nextFeatured = project.featuredOnHome;

      if (nextOngoing) {
        const countOngoingHome = await prisma.project.count({
          where: { isOngoing: true, featuredOnHome: true, id: { not: id } },
        });
        // Automatically feature on Home (Top 2) if space is available (< 2)
        nextFeatured = countOngoingHome < 2;
      } else {
        const countMainHome = await prisma.project.count({
          where: { isOngoing: false, featuredOnHome: true, id: { not: id } },
        });
        if (countMainHome >= 5) nextFeatured = false;
      }

      updatedProject = await prisma.project.update({
        where: { id },
        data: { isOngoing: nextOngoing, featuredOnHome: nextFeatured },
      });
      auditSummary = nextOngoing
        ? `Marked "${project.title}" as Currently Working Project${nextFeatured ? " (automatically featured on Home)" : ""}`
        : `Deployed "${project.title}" from Currently Working to Main Projects section`;
    } else if (action === "toggle_featured_home") {
      const nextFeatured = !project.featuredOnHome;

      if (nextFeatured) {
        if (!project.isOngoing) {
          const countMainHome = await prisma.project.count({
            where: { isOngoing: false, featuredOnHome: true, id: { not: id } },
          });
          if (countMainHome >= 5) {
            return NextResponse.json({
              error: "Top 5 limit reached. Maximum 5 projects can be shown on the main page. Please remove a project from Top 5 first before adding another.",
            }, { status: 400 });
          }
        } else {
          const countOngoingHome = await prisma.project.count({
            where: { isOngoing: true, featuredOnHome: true, id: { not: id } },
          });
          if (countOngoingHome >= 2) {
            return NextResponse.json({
              error: "Limit reached. Only 2 currently working projects can be shown on the main page. Please remove one from the main page first before selecting another.",
            }, { status: 400 });
          }
        }
      }

      updatedProject = await prisma.project.update({
        where: { id },
        data: { featuredOnHome: nextFeatured },
      });
      auditSummary = nextFeatured
        ? (project.isOngoing
            ? `Added "${project.title}" to Main Page Currently Working section (Top 2)`
            : `Added "${project.title}" to Home Page Top 5 showcase`)
        : (project.isOngoing
            ? `Removed "${project.title}" from Main Page Currently Working section (Browse index only)`
            : `Removed "${project.title}" from Home Page Top 5 showcase (available in Browse index)`);
    } else if (action === "toggle_published") {
      const nextPublished = !project.published;
      updatedProject = await prisma.project.update({
        where: { id },
        data: { published: nextPublished },
      });
      auditSummary = nextPublished
        ? `Published project "${project.title}"`
        : `Unpublished project "${project.title}" to draft mode`;
    } else {
      return NextResponse.json({ error: "Invalid action." }, { status: 400 });
    }

    const auditEntry = await logAuditEvent({
      entity: "PROJECT",
      entityId: id,
      action: "UPDATE",
      changes: {
        summary: auditSummary,
        previous: project,
        current: updatedProject,
      },
      adminId: session?.user?.id || "unknown",
      adminName: session?.user?.name || "Admin",
    });

    return NextResponse.json({
      success: true,
      message: auditSummary,
      project: updatedProject,
      auditLogId: auditEntry?.id,
    });
  } catch (error) {
    console.error("Project toggle action failed:", error);
    return NextResponse.json({ error: "Failed to update project status." }, { status: 500 });
  }
}
