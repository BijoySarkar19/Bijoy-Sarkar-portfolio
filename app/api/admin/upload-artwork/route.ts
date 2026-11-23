import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join, extname } from "path";

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
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No image file provided." }, { status: 400 });
    }

    const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);
    const ALLOWED_MIME_TYPES = new Set([
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/avif",
    ]);

    const ext = extname(file.name).toLowerCase();
    const mime = file.type.toLowerCase();

    // Strict validation: BOTH extension and MIME type must be safe raster images (SVG disallowed to prevent stored XSS)
    if (!ALLOWED_EXTENSIONS.has(ext) || !ALLOWED_MIME_TYPES.has(mime)) {
      return NextResponse.json(
        { error: "Only safe raster image files (JPEG, PNG, WEBP, GIF, AVIF) are permitted." },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Image file exceeds maximum 10MB limit." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const safeName = `custom-ongoing-${Date.now()}${ext}`;

    const uploadsDir = join(process.cwd(), "public", "uploads");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const targetPath = join(uploadsDir, safeName);
    await writeFile(targetPath, buffer);

    // Also mirror to /tmp/uploads for serverless instances
    try {
      const tmpUploadsDir = "/tmp/uploads";
      if (!existsSync(tmpUploadsDir)) {
        await mkdir(tmpUploadsDir, { recursive: true });
      }
      await writeFile(join(tmpUploadsDir, safeName), buffer);
    } catch {
      // Non-blocking in serverless
    }

    const publicUrl = `/uploads/${safeName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: file.name,
      size: file.size,
    });
  } catch (error) {
    console.error("Artwork upload failed:", error);
    return NextResponse.json({ error: "Failed to upload image." }, { status: 500 });
  }
}
