import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loadCsvContactRecords, DEFAULT_GOOGLE_SHEETS_WEBHOOK_URL } from "@/lib/google-sheets";
import { parseDateTimestamp } from "@/lib/ist-date";
import { FALLBACK_CONTACT_MESSAGES } from "@/lib/fallback-messages";

export const runtime = "nodejs";

function isAdmin(role?: string) {
  return role === "ADMIN";
}

export async function POST() {
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

    let syncedCount = 0;

    // 1. Fetch live messages from Google Sheets Webhook
    try {
      const webhookRes = await fetch(DEFAULT_GOOGLE_SHEETS_WEBHOOK_URL, {
        cache: "no-store",
        signal: AbortSignal.timeout(6000),
      });

      if (webhookRes.ok) {
        const json = await webhookRes.json();
        if (json.messages && Array.isArray(json.messages) && json.messages.length > 0) {
          for (const m of json.messages) {
            try {
              const rowMatch = m.id?.match(/sheet-row-(\d+)/);
              const rowNum = rowMatch ? rowMatch[1] : "";
              const finalStatus = statusOverrides[m.id] || m.status || "UNREAD";
              const parsedTime = parseDateTimestamp(m.submittedAtIST || m.createdAt);
              const createdAtDate = parsedTime > 0 ? new Date(parsedTime) : new Date();
              const name = m.name?.trim() || (rowNum ? `Inquiry (Sheet Row ${rowNum})` : "Direct Submission");
              const email = m.email?.trim() || "Not provided";
              const message =
                m.message?.trim() ||
                (rowNum
                  ? `Direct spreadsheet inquiry recorded on Google Sheets (Row ${rowNum}).`
                  : "Direct spreadsheet inquiry recorded on Google Sheets.");
              const cleanPhone =
                m.phone === "#ERROR!" || !m.phone ? "Not provided" : String(m.phone).replace(/^'/, "").trim();

              await prisma.contactMessage.upsert({
                where: { id: m.id },
                update: {
                  status: statusOverrides[m.id] ? statusOverrides[m.id] : undefined,
                },
                create: {
                  id: m.id,
                  name,
                  email,
                  phone: cleanPhone,
                  message,
                  submittedAtIST: m.submittedAtIST || "Recorded",
                  ipAddress: m.ipAddress || null,
                  status: finalStatus,
                  googleSynced: true,
                  createdAt: createdAtDate,
                },
              });
              syncedCount++;
            } catch {}
          }
        }
      }
    } catch (err) {
      console.warn("Google Sheets background sync notice:", err);
    }

    // 2. Sync bundled CSV records
    try {
      const csvRecords = await loadCsvContactRecords();
      if (csvRecords.length > 0) {
        for (const r of csvRecords) {
          if (!r.name && !r.email && !r.message) continue;
          try {
            const id = r.id || "temp";
            const finalStatus = statusOverrides[id] || "UNREAD";
            const parsedTime = parseDateTimestamp(r.submittedAtIST);
            const createdAtDate = parsedTime > 0 ? new Date(parsedTime) : new Date();

            await prisma.contactMessage.upsert({
              where: { id },
              update: {
                status: statusOverrides[id] ? statusOverrides[id] : undefined,
              },
              create: {
                id,
                name: r.name,
                email: r.email,
                phone: r.phone || null,
                message: r.message,
                submittedAtIST: r.submittedAtIST,
                ipAddress: r.ipAddress || null,
                status: finalStatus,
                googleSynced: true,
                createdAt: createdAtDate,
              },
            });
          } catch {}
        }
      }
    } catch {}

    // 3. Return full updated list merging database and fallback entries with full 1:1 parity
    const rawMsgs = await prisma.contactMessage.findMany().catch(() => []);
    const msgMap = new Map<string, any>();
    for (const fb of FALLBACK_CONTACT_MESSAGES) {
      msgMap.set(fb.id, {
        ...fb,
        createdAt: new Date(fb.createdAt || Date.now()),
        updatedAt: new Date(fb.createdAt || Date.now()),
      });
    }
    for (const m of rawMsgs) {
      msgMap.set(m.id, m);
    }
    const mappedMsgs = Array.from(msgMap.values()).map((m) => {
      const rowMatch = m.id?.match(/sheet-row-(\d+)/);
      const rowNum = rowMatch ? rowMatch[1] : "";
      const defaultName = rowNum ? `Inquiry (Sheet Row ${rowNum})` : "Direct Submission";
      const cleanPhone =
        m.phone === "#ERROR!" || !m.phone ? "Not provided" : String(m.phone).replace(/^'/, "").trim();

      return {
        ...m,
        name: m.name?.trim() || defaultName,
        email: m.email?.trim() || "Not provided",
        phone: cleanPhone,
        message:
          m.message?.trim() ||
          (rowNum
            ? `Direct spreadsheet inquiry recorded on Google Sheets (Row ${rowNum}).`
            : "Direct spreadsheet inquiry recorded on Google Sheets."),
        status: statusOverrides[m.id] || m.status || "READ",
      };
    });

    mappedMsgs.sort((a, b) => {
      const timeA = parseDateTimestamp(a.submittedAtIST || a.createdAt);
      const timeB = parseDateTimestamp(b.submittedAtIST || b.createdAt);
      return timeB - timeA;
    });

    return NextResponse.json({
      success: true,
      syncedCount,
      totalCount: mappedMsgs.length,
      messages: mappedMsgs,
    });
  } catch (error) {
    console.error("Messages sync failed:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}
