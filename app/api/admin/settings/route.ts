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
    console.warn("Settings fetch fallback engaged:", error);
    return NextResponse.json({
      settings: {
        heroTitle: "Software Engineer & AI Developer",
        heroSubhead: "Building intelligent systems and full-stack solutions.",
        heroBio: "Computer Science undergraduate focused on AI/ML, secure software, and useful digital products.",
        contactEmail: "bijoysarkar7252@gmail.com",
        contactRecipientEmail: "bijoysarkar7252@gmail.com",
        location: "Agartala, Tripura, India",
        locationMapUrl: "https://maps.google.com/?q=Agartala,+Tripura,+India",
        status: "Open to opportunities",
        githubUrl: "https://github.com/BijoySarkar19",
      },
    });
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
    const previousMap: Record<string, string> = {};
    try {
      const existing = await prisma.siteSetting.findMany();
      for (const s of existing) {
        previousMap[s.key] = s.value;
      }
    } catch (err) {
      console.warn("Could not fetch existing settings from DB:", err);
    }

    const currentMap: Record<string, string> = {};
    const allowedKeys = [
      "heroTitle",
      "heroSubhead",
      "heroBio",
      "contactEmail",
      "contactRecipientEmail",
      "location",
      "locationMapUrl",
      "currentLocation",
      "currentLocationMapUrl",
      "displayAddressMode",
      "status",
      "githubUrl",
      "linkedinUrl",
      "twitterUrl",
      "instagramUrl",
      "facebookUrl",
      "youtubeUrl",
      "discordUrl",
      "googleSheetsWebhookUrl",
      "themeAccent",
      "themeMode",
      // Section toggles
      "heroEnabled",
      "aboutEnabled",
      "skillsEnabled",
      "projectsEnabled",
      "resumeEnabled",
      "gamesEnabled",
      "contactEnabled",
      // Section copy texts
      "aboutTitle",
      "aboutBio",
      "aboutLead",
      "skillsTitle",
      "skillsSubtitle",
      "projectsTitle",
      "projectsSubtitle",
      "ongoingTitle",
      "ongoingSubtitle",
      "resumeTitle",
      "resumeSubtitle",
      "gamesTitle",
      "gamesSubtitle",
      "contactTitle",
      "contactSubtitle",
      // Degrees & Education
      "degreesList",
    ];

    for (const key of allowedKeys) {
      if (key in body) {
        let val: string;
        if (key === "degreesList") {
          try {
            const parsed = typeof body[key] === "string" ? JSON.parse(body[key]) : body[key];
            val = JSON.stringify(parsed);
          } catch {
            val = "[]";
          }
        } else {
          val = cleanText(String(body[key] ?? "")).trim();
        }

        currentMap[key] = val;

        try {
          await prisma.siteSetting.upsert({
            where: { key },
            update: { value: val },
            create: { key, value: val },
          });
        } catch (upsertError) {
          console.warn(`Failed to upsert site setting "${key}":`, upsertError);
        }
      }
    }

    let auditLogId: string | undefined = undefined;
    try {
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
      auditLogId = auditEntry?.id;
    } catch (auditError) {
      console.warn("Audit log save failed:", auditError);
    }

    // Save to /tmp/settings-store.json for cross-container memory on serverless
    try {
      const { writeFileSync } = await import("node:fs");
      const storePath = "/tmp/settings-store.json";
      writeFileSync(storePath, JSON.stringify({ ...previousMap, ...currentMap }), "utf-8");
    } catch (storeErr) {
      console.warn("Could not save /tmp/settings-store.json:", storeErr);
    }

    return NextResponse.json({
      success: true,
      settings: { ...previousMap, ...currentMap },
      auditLogId,
    });
  } catch (error) {
    console.error("Failed to update site settings:", error);
    return NextResponse.json({ error: "Failed to save settings." }, { status: 500 });
  }
}
