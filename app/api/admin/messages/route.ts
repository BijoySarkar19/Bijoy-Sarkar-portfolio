import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { syncWithGoogleSheetWebhook } from "@/lib/google-sheets";

export const runtime = "nodejs";

function isAdmin(role?: string) {
  return role === "ADMIN";
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  try {
    const messages = await prisma.contactMessage.findMany({
      orderBy: { createdAt: "desc" },
    });

    const unreadCount = messages.filter((m) => m.status === "UNREAD").length;

    return NextResponse.json({
      messages,
      unreadCount,
      totalCount: messages.length,
    });
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    return NextResponse.json({ error: "Failed to fetch messages." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, status, notes, action } = body;

    if (!id) {
      return NextResponse.json({ error: "Message ID is required." }, { status: 400 });
    }

    const existing = await prisma.contactMessage.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Message not found." }, { status: 404 });
    }

    if (action === "sync_google") {
      const syncResult = await syncWithGoogleSheetWebhook({
        id: existing.id,
        name: existing.name,
        email: existing.email,
        phone: existing.phone,
        message: existing.message,
        submittedAtIST: existing.submittedAtIST,
        ipAddress: existing.ipAddress,
      });

      if (syncResult.synced) {
        const updated = await prisma.contactMessage.update({
          where: { id },
          data: { googleSynced: true },
        });
        return NextResponse.json({ success: true, message: "Synced to Google Sheets successfully.", updated });
      } else {
        return NextResponse.json({
          error: `Could not sync to Google Sheets webhook: ${syncResult.reason || "Make sure Google Sheets Webhook URL is set in Admin Settings."}`,
        }, { status: 400 });
      }
    }

    const updated = await prisma.contactMessage.update({
      where: { id },
      data: {
        status: status || existing.status,
        notes: notes !== undefined ? notes : existing.notes,
      },
    });

    await logAuditEvent({
      entity: "SYSTEM",
      entityId: id,
      action: "UPDATE",
      changes: {
        summary: `Updated message from "${existing.name}" to status ${status}`,
        previous: existing,
        current: updated,
      },
      adminId: session?.user?.id || "unknown",
      adminName: session?.user?.name || "Admin",
    });

    return NextResponse.json({ message: "Message updated successfully.", updated });
  } catch (error) {
    console.error("Failed to update message:", error);
    return NextResponse.json({ error: "Failed to update message." }, { status: 500 });
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
    if (!id) return NextResponse.json({ error: "Message ID is required." }, { status: 400 });

    const existing = await prisma.contactMessage.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Message not found." }, { status: 404 });

    await prisma.contactMessage.delete({ where: { id } });

    await logAuditEvent({
      entity: "SYSTEM",
      entityId: id,
      action: "DELETE",
      changes: {
        summary: `Deleted message from "${existing.name}" (${existing.email})`,
        previous: existing,
      },
      adminId: session?.user?.id || "unknown",
      adminName: session?.user?.name || "Admin",
    });

    return NextResponse.json({ success: true, message: "Message deleted successfully." });
  } catch (error) {
    console.error("Failed to delete message:", error);
    return NextResponse.json({ error: "Failed to delete message." }, { status: 500 });
  }
}
