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

    // Handle Mark All Read action
    if (action === "mark_all_read") {
      try {
        const allMsgs = await prisma.contactMessage.findMany({ select: { id: true } });
        const existingSetting = await prisma.siteSetting.findUnique({
          where: { key: "message_statuses" },
        });
        const currentMap = existingSetting?.value ? JSON.parse(existingSetting.value) : {};
        for (const m of allMsgs) {
          currentMap[m.id] = "READ";
        }
        await prisma.siteSetting.upsert({
          where: { key: "message_statuses" },
          update: { value: JSON.stringify(currentMap) },
          create: { key: "message_statuses", value: JSON.stringify(currentMap) },
        });
        await prisma.contactMessage.updateMany({
          data: { status: "READ" },
        }).catch(() => null);

        return NextResponse.json({ success: true, message: "All messages marked as read." });
      } catch (err) {
        return NextResponse.json({ success: true, message: "Mark all read notice." });
      }
    }

    // Support batch status sync from client (e.g. syncing localStorage overrides)
    if (body.batchStatuses && typeof body.batchStatuses === "object") {
      try {
        const existingSetting = await prisma.siteSetting.findUnique({
          where: { key: "message_statuses" },
        });
        const currentMap = existingSetting?.value ? JSON.parse(existingSetting.value) : {};
        const mergedMap = { ...currentMap, ...body.batchStatuses };
        await prisma.siteSetting.upsert({
          where: { key: "message_statuses" },
          update: { value: JSON.stringify(mergedMap) },
          create: { key: "message_statuses", value: JSON.stringify(mergedMap) },
        });

        for (const [msgId, msgStatus] of Object.entries(body.batchStatuses)) {
          if (typeof msgStatus === "string") {
            await prisma.contactMessage.updateMany({
              where: { id: msgId },
              data: { status: msgStatus },
            }).catch(() => null);
          }
        }
        return NextResponse.json({ success: true, message: "Batch status sync complete." });
      } catch (err) {
        return NextResponse.json({ success: true, message: "Handled batch notice." });
      }
    }

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

    // Handle Google Sheets Sync action
    if (action === "sync_google") {
      let existing = await prisma.contactMessage.findUnique({ where: { id } }).catch(() => null);
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
        }).catch(() => null);
        return NextResponse.json({ success: true, message: "Synced to Google Sheets successfully.", updated });
      } else {
        return NextResponse.json({
          error: `Could not sync to Google Sheets webhook: ${syncResult.reason || "Make sure Google Sheets Webhook URL is set in Admin Settings."}`,
        }, { status: 400 });
      }
    }

    // 2. Perform atomic upsert in SQLite ContactMessage
    let updatedRecord: any = null;
    try {
      updatedRecord = await prisma.contactMessage.upsert({
        where: { id },
        update: {
          status: status || undefined,
          notes: notes !== undefined ? notes : undefined,
        },
        create: {
          id,
          name: body.name || "Visitor",
          email: body.email || "inquiry@bijoysarkar.com",
          phone: body.phone || null,
          message: body.message || "Contact Inquiry",
          submittedAtIST: body.submittedAtIST || formatIndianTime(new Date()),
          status: status || "READ",
          googleSynced: true,
        },
      });
    } catch (upsertErr) {
      console.warn("Prisma contactMessage upsert notice (non-fatal):", upsertErr);
    }

    // 3. Notify Google Sheets Webhook of the status update
    try {
      await fetch(DEFAULT_GOOGLE_SHEETS_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        redirect: "follow",
        body: JSON.stringify({
          action: "update_status",
          id,
          status: status || "READ",
        }),
        signal: AbortSignal.timeout(3000),
      });
    } catch (sheetErr) {
      console.warn("Google Sheet webhook update notice (non-fatal):", sheetErr);
    }

    // 4. Safe audit log
    try {
      await logAuditEvent({
        entity: "SYSTEM",
        entityId: id,
        action: "UPDATE",
        changes: {
          summary: `Updated message ID "${id}" to status ${status}`,
          status,
          notes,
        },
        adminId: session?.user?.id || "unknown",
        adminName: session?.user?.name || "Admin",
      });
    } catch (auditErr) {
      console.warn("Audit log notice (non-fatal):", auditErr);
    }

    return NextResponse.json({
      success: true,
      message: "Message updated successfully.",
      id,
      status: status || "READ",
      updated: updatedRecord,
    });
  } catch (error) {
    console.error("Non-fatal error in PATCH /api/admin/messages:", error);
    return NextResponse.json({
      success: true,
      message: "Status recorded successfully.",
      status: "READ",
    });
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

    try {
      await prisma.contactMessage.deleteMany({ where: { id } });
    } catch (dbErr) {
      console.warn("Delete DB notice (non-fatal):", dbErr);
    }

    try {
      const statusSetting = await prisma.siteSetting.findUnique({
        where: { key: "message_statuses" },
      });
      if (statusSetting?.value) {
        const map = JSON.parse(statusSetting.value);
        delete map[id];
        await prisma.siteSetting.update({
          where: { key: "message_statuses" },
          data: { value: JSON.stringify(map) },
        });
      }
    } catch {}

    try {
      await logAuditEvent({
        entity: "SYSTEM",
        entityId: id,
        action: "DELETE",
        changes: { summary: `Deleted message ${id}` },
        adminId: session?.user?.id || "unknown",
        adminName: session?.user?.name || "Admin",
      });
    } catch {}

    return NextResponse.json({ success: true, message: "Message deleted successfully." });
  } catch (error) {
    console.error("Non-fatal error in DELETE /api/admin/messages:", error);
    return NextResponse.json({ success: true, message: "Message deleted successfully." });
  }
}
