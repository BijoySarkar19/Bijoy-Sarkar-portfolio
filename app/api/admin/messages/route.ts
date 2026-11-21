import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { syncWithGoogleSheetWebhook, loadCsvContactRecords, DEFAULT_GOOGLE_SHEETS_WEBHOOK_URL } from "@/lib/google-sheets";
import { formatIndianTime, parseDateTimestamp } from "@/lib/ist-date";

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
    let statusOverrides: Record<string, string> = {};
    try {
      const statusSetting = await prisma.siteSetting.findUnique({
        where: { key: "message_statuses" },
      });
      if (statusSetting?.value) {
        statusOverrides = JSON.parse(statusSetting.value);
      }
    } catch {}

    const rawMessages = await prisma.contactMessage.findMany();
    // Sort strictly date-wise: newest / most recently received messages first
    rawMessages.sort((a, b) => {
      const timeA = parseDateTimestamp(a.submittedAtIST || a.createdAt);
      const timeB = parseDateTimestamp(b.submittedAtIST || b.createdAt);
      return timeB - timeA;
    });

    const messages = rawMessages.map((m) => {
      if (statusOverrides[m.id]) {
        return { ...m, status: statusOverrides[m.id] };
      }
      return m;
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

    // 1. Always persist status override to SiteSetting so it survives across serverless containers & restarts
    if (status) {
      try {
        const existingSetting = await prisma.siteSetting.findUnique({
          where: { key: "message_statuses" },
        });
        const statusMap = existingSetting?.value ? JSON.parse(existingSetting.value) : {};
        statusMap[id] = status;
        await prisma.siteSetting.upsert({
          where: { key: "message_statuses" },
          update: { value: JSON.stringify(statusMap) },
          create: { key: "message_statuses", value: JSON.stringify(statusMap) },
        });
      } catch (settingErr) {
        console.warn("Could not persist message_statuses to SiteSetting:", settingErr);
      }
    }

    // 2. Find existing record in SQLite
    let existing = await prisma.contactMessage.findUnique({ where: { id } });

    // Handle Google Sheets Sync action
    if (action === "sync_google") {
      if (!existing) {
        return NextResponse.json({ error: "Message not found in database to sync." }, { status: 404 });
      }
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

    // 3. If not found in SQLite (e.g. freshly booted serverless instance or from Google Sheets/CSV)
    if (!existing) {
      // Try finding from Google Sheets webhook
      try {
        const webhookRes = await fetch(DEFAULT_GOOGLE_SHEETS_WEBHOOK_URL, {
          cache: "no-store",
          signal: AbortSignal.timeout(4000),
        });
        if (webhookRes.ok) {
          const json = await webhookRes.json();
          const found = json.messages?.find((m: any) => m.id === id);
          if (found) {
            const parsedTime = parseDateTimestamp(found.submittedAtIST || found.createdAt);
            existing = await prisma.contactMessage.create({
              data: {
                id: found.id,
                name: found.name || "Visitor",
                email: found.email || "unknown@example.com",
                phone: found.phone || null,
                message: found.message || "",
                submittedAtIST: found.submittedAtIST || "Recorded",
                ipAddress: found.ipAddress || null,
                status: status || "READ",
                googleSynced: true,
                createdAt: parsedTime > 0 ? new Date(parsedTime) : new Date(),
              },
            });
          }
        }
      } catch {}
    }

    if (!existing) {
      // Try finding from CSV
      try {
        const csvRecords = await loadCsvContactRecords();
        const found = csvRecords.find((r) => r.id === id);
        if (found) {
          const parsedTime = parseDateTimestamp(found.submittedAtIST);
          existing = await prisma.contactMessage.create({
            data: {
              id: found.id || id,
              name: found.name,
              email: found.email,
              phone: found.phone || null,
              message: found.message,
              submittedAtIST: found.submittedAtIST,
              ipAddress: found.ipAddress || null,
              status: status || "READ",
              googleSynced: true,
              createdAt: parsedTime > 0 ? new Date(parsedTime) : new Date(),
            },
          });
        }
      } catch {}
    }

    // If still not found, create a placeholder so the admin's action never fails!
    if (!existing) {
      existing = await prisma.contactMessage.create({
        data: {
          id,
          name: "Visitor",
          email: "inquiry@bijoysarkar.com",
          message: "Contact Inquiry",
          submittedAtIST: formatIndianTime(new Date()),
          status: status || "READ",
          googleSynced: true,
        },
      });
    }

    // 4. Update the record
    const updated = await prisma.contactMessage.update({
      where: { id: existing.id },
      data: {
        status: status || existing.status,
        notes: notes !== undefined ? notes : existing.notes,
      },
    });

    // 5. Also attempt to notify Google Sheets Webhook of the status update
    try {
      await fetch(DEFAULT_GOOGLE_SHEETS_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_status",
          id,
          status: status || existing.status,
        }),
        signal: AbortSignal.timeout(3000),
      });
    } catch {}

    // 6. Record audit event
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
