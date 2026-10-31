import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { exec } from "child_process";

export const runtime = "nodejs";

function triggerPreviewGeneration(relativePath: string) {
  try {
    const fullPath = join(process.cwd(), "public", relativePath.replace(/^\//, "").split("?")[0]);
    exec(`python scripts/generate-cv-pages.py "${fullPath}"`, (err, stdout, stderr) => {
      if (err) console.error("Error generating CV preview:", err, stderr);
      else console.log("CV preview regenerated:", stdout.trim());
    });
  } catch (err) {
    console.error("Failed to start CV preview generation:", err);
  }
}

function isAdmin(role?: string) { return role === "ADMIN"; }

export async function GET() {
  try {
    const resumes = await prisma.resumeFile.findMany({
      orderBy: [{ active: "desc" }, { createdAt: "desc" }],
    });
    return NextResponse.json({ resumes });
  } catch (error) {
    console.error("Resume list failed:", error);
    return NextResponse.json({ error: "Failed to fetch resumes." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    try {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      const customName = formData.get("filename") ? String(formData.get("filename")).trim() : "";

      if (!file) {
        return NextResponse.json({ error: "Please choose a PDF file to upload." }, { status: 400 });
      }

      // Security checks on file
      if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
        return NextResponse.json({ error: "Invalid file type. Only PDF documents are allowed." }, { status: 400 });
      }

      const MAX_SIZE = 10 * 1024 * 1024; // 10MB
      if (file.size > MAX_SIZE) {
        return NextResponse.json({ error: "File exceeds maximum size of 10MB." }, { status: 400 });
      }

      // Safe sanitized filename
      const rawName = customName || file.name;
      const safeBase = rawName.replace(/[^a-zA-Z0-9_\-\.]/g, "_").replace(/\.pdf$/i, "");
      const fileName = `${safeBase || "Bijoy_Sarkar_CV"}.pdf`;
      const publicPath = `/uploads/${fileName}`;

      // Save file inside public/uploads
      const uploadDir = join(process.cwd(), "public", "uploads");
      await mkdir(uploadDir, { recursive: true });
      const fullPath = join(uploadDir, fileName);

      const bytes = await file.arrayBuffer();
      await writeFile(fullPath, Buffer.from(bytes));

      const previousActive = await prisma.resumeFile.findFirst({ where: { active: true } });

      // Deactivate other resumes
      await prisma.resumeFile.updateMany({
        where: { active: true },
        data: { active: false },
      });

      const newResume = await prisma.resumeFile.create({
        data: {
          filename: fileName,
          path: publicPath,
          active: true,
        },
      });

      triggerPreviewGeneration(publicPath);

      const auditEntry = await logAuditEvent({
        entity: "RESUME",
        entityId: newResume.id,
        action: "UPLOAD",
        changes: {
          summary: `Uploaded and activated CV "${fileName}"`,
          previousActiveId: previousActive?.id || null,
          filename: fileName,
          path: publicPath,
          fileSizeBytes: file.size,
          current: newResume,
        },
        adminId: session?.user?.id || "unknown",
        adminName: session?.user?.name || "Admin",
      });

      return NextResponse.json({ resume: newResume, auditLogId: auditEntry?.id }, { status: 201 });
    } catch (error) {
      console.error("Resume upload failed:", error);
      return NextResponse.json({ error: "Failed to upload CV document." }, { status: 500 });
    }
  }

  // Handle JSON payload (e.g. referencing an existing file)
  try {
    const body = await request.json();
    const filename = String(body.filename ?? "").trim();
    const path = String(body.path ?? "").trim();

    if (!filename || !path.endsWith(".pdf") || !path.startsWith("/")) {
      return NextResponse.json({ error: "Invalid resume details. Path must start with / and end with .pdf." }, { status: 400 });
    }

    const previousActive = await prisma.resumeFile.findFirst({ where: { active: true } });

    // Set other resumes to inactive
    await prisma.resumeFile.updateMany({
      where: { active: true },
      data: { active: false },
    });

    const created = await prisma.resumeFile.create({
      data: {
        filename,
        path,
        active: true,
      },
    });

    const auditEntry = await logAuditEvent({
      entity: "RESUME",
      entityId: created.id,
      action: "CREATE",
      changes: {
        summary: `Registered CV "${filename}"`,
        previousActiveId: previousActive?.id || null,
        filename,
        path,
        current: created,
      },
      adminId: session?.user?.id || "unknown",
      adminName: session?.user?.name || "Admin",
    });

    return NextResponse.json({ resume: created, auditLogId: auditEntry?.id }, { status: 201 });
  } catch (error) {
    console.error("Failed to add resume entry:", error);
    return NextResponse.json({ error: "Failed to register CV." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, clearActive, action } = body;

    // Handle "Remove Current CV" option
    if (clearActive || action === "deactivate_all") {
      const activeResumes = await prisma.resumeFile.findMany({ where: { active: true } });
      const previousActive = activeResumes[0];

      await prisma.resumeFile.updateMany({
        where: { active: true },
        data: { active: false },
      });

      const auditEntry = await logAuditEvent({
        entity: "RESUME",
        entityId: previousActive?.id || "all",
        action: "DEACTIVATE",
        changes: {
          summary: `Deactivated active CV "${previousActive?.filename || "None"}" from public site`,
          previousActiveId: previousActive?.id || null,
          previous: previousActive || null,
        },
        adminId: session?.user?.id || "unknown",
        adminName: session?.user?.name || "Admin",
      });

      return NextResponse.json({
        success: true,
        message: "Current active CV removed from display.",
        auditLogId: auditEntry?.id,
      });
    }

    if (!id) return NextResponse.json({ error: "Resume ID is required." }, { status: 400 });

    const previousActive = await prisma.resumeFile.findFirst({ where: { active: true } });

    // Set all others to false
    await prisma.resumeFile.updateMany({
      where: { id: { not: id } },
      data: { active: false },
    });

    const updated = await prisma.resumeFile.update({
      where: { id },
      data: { active: true },
    });

    triggerPreviewGeneration(updated.path);

    const auditEntry = await logAuditEvent({
      entity: "RESUME",
      entityId: id,
      action: "ACTIVATE",
      changes: {
        summary: `Activated CV "${updated.filename}"`,
        previousActiveId: previousActive?.id || null,
        newActiveId: id,
        activeFilename: updated.filename,
        path: updated.path,
      },
      adminId: session?.user?.id || "unknown",
      adminName: session?.user?.name || "Admin",
    });

    return NextResponse.json({ resume: updated, auditLogId: auditEntry?.id });
  } catch (error) {
    console.error("Resume activation failed:", error);
    return NextResponse.json({ error: "Failed to update active CV." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Resume ID is required." }, { status: 400 });

    const existing = await prisma.resumeFile.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Resume not found." }, { status: 404 });

    await prisma.resumeFile.delete({ where: { id } });

    const auditEntry = await logAuditEvent({
      entity: "RESUME",
      entityId: id,
      action: "DELETE",
      changes: {
        summary: `Deleted CV "${existing.filename}"`,
        previous: existing,
        current: null,
      },
      adminId: session?.user?.id || "unknown",
      adminName: session?.user?.name || "Admin",
    });

    return NextResponse.json({ success: true, auditLogId: auditEntry?.id });
  } catch (error) {
    console.error("Resume deletion failed:", error);
    return NextResponse.json({ error: "Failed to delete CV entry." }, { status: 500 });
  }
}
