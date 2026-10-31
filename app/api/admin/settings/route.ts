import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { cleanText } from "@/lib/validation";

export const runtime = "nodejs";

function isAdmin(role?: string) {
  return role === "ADMIN";
}

export async function GET() {
  try {
    const settings = await prisma.siteSetting.findMany();
    const settingsMap: Record<string, string> = {};
    for (const s of settings) {
      settingsMap[s.key] = s.value;
    }
    return NextResponse.json({ settings: settingsMap });
  } catch (error) {
    console.error("Failed to load settings:", error);
    return NextResponse.json({ error: "Failed to load settings." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
    }

    // Fetch existing settings for audit & undo snapshot
    const existing = await prisma.siteSetting.findMany();
    const previousMap: Record<string, string> = {};
    for (const s of existing) {
      previousMap[s.key] = s.value;
    }

    const currentMap: Record<string, string> = {};
    const allowedKeys = [
      "heroTitle",
      "heroSubhead",
      "heroBio",
      "contactEmail",
      "location",
      "status",
      "githubUrl",
      "googleSheetsWebhookUrl",
      "themeAccent",
      "soundEnabled",
      "gamesEnabled",
    ];

    for (const key of allowedKeys) {
      if (key in body) {
        const val = cleanText(String(body[key] ?? ""));
        currentMap[key] = val;
        await prisma.siteSetting.upsert({
          where: { key },
          update: { value: val },
          create: { key, value: val },
        });
      }
    }

    const auditEntry = await logAuditEvent({
      entity: "SETTINGS",
      entityId: "site-settings",
      action: "UPDATE",
      changes: {
        summary: `Updated site settings (${Object.keys(currentMap).join(", ")})`,
        previous: previousMap,
        current: currentMap,
      },
      adminId: session?.user?.id || "unknown",
      adminName: session?.user?.name || "Admin",
    });

    return NextResponse.json({
      success: true,
      settings: { ...previousMap, ...currentMap },
      auditLogId: auditEntry?.id,
    });
  } catch (error) {
    console.error("Failed to update site settings:", error);
    return NextResponse.json({ error: "Failed to save settings." }, { status: 500 });
  }
}
