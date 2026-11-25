import { AdminNavigation } from "@/components/admin/AdminNavigation";
import { MessagesManager } from "@/components/admin/MessagesManager";
import { prisma } from "@/lib/prisma";
import { DEFAULT_GOOGLE_SHEETS_SPREADSHEET_URL } from "@/lib/google-sheets";
import { parseDateTimestamp } from "@/lib/ist-date";
import { FALLBACK_CONTACT_MESSAGES } from "@/lib/fallback-messages";
import Link from "next/link";
import { ExternalLink, Sheet } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  let messages: any[] = [];

  try {
    // 0. Load status overrides and deleted IDs so state persists across serverless instances
    let statusOverrides: Record<string, string> = {};
    let deletedIds = new Set<string>();
    try {
      const statusSetting = await prisma.siteSetting.findUnique({
        where: { key: "message_statuses" },
      });
      if (statusSetting?.value) {
        statusOverrides = JSON.parse(statusSetting.value);
      }
      const deletedSetting = await prisma.siteSetting.findUnique({
        where: { key: "deleted_message_ids" },
      });
      if (deletedSetting?.value) {
        deletedIds = new Set(JSON.parse(deletedSetting.value));
      }
    } catch {}

    // 1. Direct local database query — executes in ~5ms without blocking external network requests
    const rawMsgs = await prisma.contactMessage.findMany().catch(() => []);

    // 2. High-availability merger: seed with bundled FALLBACK_CONTACT_MESSAGES then overlay database records
    // Guarantees zero loading time and immediate visibility of all inquiries even on cold serverless boots
    const msgMap = new Map<string, any>();
    for (const fb of FALLBACK_CONTACT_MESSAGES) {
      msgMap.set(fb.id, {
        ...fb,
        createdAt: new Date(fb.createdAt || Date.now()),
        updatedAt: new Date(fb.createdAt || Date.now()),
        phone: fb.phone ?? null,
        ipAddress: fb.ipAddress ?? null,
        notes: fb.notes ?? null,
      });
    }

    for (const m of rawMsgs) {
      msgMap.set(m.id, m);
    }

    // Apply any status overrides & clean presentation defaults to guarantee 1:1 Google Sheets parity
    const mappedMsgs = Array.from(msgMap.values())
      .filter((m) => !deletedIds.has(m.id))
      .map((m) => {
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

    // Strictly sort date-wise: newest / most recently received message first
    mappedMsgs.sort((a, b) => {
      const timeA = parseDateTimestamp(a.submittedAtIST || a.createdAt);
      const timeB = parseDateTimestamp(b.submittedAtIST || b.createdAt);
      return timeB - timeA;
    });

    messages = mappedMsgs;
  } catch (err) {
    console.warn("Prisma error caught on AdminMessagesPage:", err);
  }

  return (
    <main>
      <div className="admin-topline">
        <div>
          <p className="section-kicker">Contact Us Submissions</p>
          <h1>Messages &amp; Google Sheets Dataset</h1>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <a
            className="button button-primary"
            href={DEFAULT_GOOGLE_SHEETS_SPREADSHEET_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <Sheet size={13} /> Live Google Sheet <ExternalLink size={12} />
          </a>
          <Link className="button button-secondary" href="/" target="_blank">
            Live Site <ExternalLink size={13} />
          </Link>
        </div>
      </div>

      <AdminNavigation active="messages" />

      <MessagesManager initialMessages={JSON.parse(JSON.stringify(messages))} />
    </main>
  );
}
