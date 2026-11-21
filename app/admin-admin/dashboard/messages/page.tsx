import { AdminNavigation } from "@/components/admin/AdminNavigation";
import { MessagesManager } from "@/components/admin/MessagesManager";
import { prisma } from "@/lib/prisma";
import { loadCsvContactRecords, DEFAULT_GOOGLE_SHEETS_SPREADSHEET_URL, DEFAULT_GOOGLE_SHEETS_WEBHOOK_URL } from "@/lib/google-sheets";
import { parseDateTimestamp } from "@/lib/ist-date";
import Link from "next/link";
import { ExternalLink, Sheet } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  let messages: any[] = [];
  let unreadCount = 0;

  try {
    // 0. Load status overrides from SiteSetting so status persists across serverless instances
    let statusOverrides: Record<string, string> = {};
    try {
      const statusSetting = await prisma.siteSetting.findUnique({
        where: { key: "message_statuses" },
      });
      if (statusSetting?.value) {
        statusOverrides = JSON.parse(statusSetting.value);
      }
    } catch {}

    // 1. Try to fetch live messages from the Google Apps Script Webhook
    try {
      const webhookRes = await fetch(DEFAULT_GOOGLE_SHEETS_WEBHOOK_URL, {
        cache: "no-store",
        signal: AbortSignal.timeout(4000),
      });
      if (webhookRes.ok) {
        const json = await webhookRes.json();
        if (json.messages && Array.isArray(json.messages) && json.messages.length > 0) {
          for (const m of json.messages) {
            // Ignore completely blank empty rows
            if (!m.name && !m.email && !m.message) continue;

            try {
              const finalStatus = statusOverrides[m.id] || m.status || "UNREAD";
              const parsedTime = parseDateTimestamp(m.submittedAtIST || m.createdAt);
              const createdAtDate = parsedTime > 0 ? new Date(parsedTime) : new Date();

              await prisma.contactMessage.upsert({
                where: { id: m.id },
                update: {
                  status: statusOverrides[m.id] ? statusOverrides[m.id] : undefined,
                },
                create: {
                  id: m.id,
                  name: m.name || "Visitor",
                  email: m.email || "unknown@example.com",
                  phone: m.phone || null,
                  message: m.message || "",
                  submittedAtIST: m.submittedAtIST || "Recorded",
                  ipAddress: m.ipAddress || null,
                  status: finalStatus,
                  googleSynced: true,
                  createdAt: createdAtDate,
                },
              });
            } catch {
              // Ignore duplicate ID errors
            }
          }
        }
      }
    } catch {
      // Non-blocking fallback
    }

    // 2. Ensure bundled CSV dataset records are synced into SQLite
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
          } catch {
            // Ignore if upsert failed
          }
        }
      }
    } catch {
      // Non-blocking
    }

    // 3. Load all inquiries from SQLite database and sort date-wise (newest / most recent first)
    const rawMsgs = await prisma.contactMessage.findMany();

    // Filter out any blank row artifacts
    const validMsgs = rawMsgs.filter((m) => m.name || m.email || m.message);

    // Apply any status overrides directly
    const mappedMsgs = validMsgs.map((m) => {
      if (statusOverrides[m.id]) {
        return { ...m, status: statusOverrides[m.id] };
      }
      return m;
    });

    // Strictly sort date-wise: newest / most recently done message first
    mappedMsgs.sort((a, b) => {
      const timeA = parseDateTimestamp(a.submittedAtIST || a.createdAt);
      const timeB = parseDateTimestamp(b.submittedAtIST || b.createdAt);
      return timeB - timeA;
    });

    messages = mappedMsgs;
    unreadCount = messages.filter((m) => m.status === "UNREAD").length;
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

      {/* KPI Stats */}
      <div className="admin-stats admin-stats-4" style={{ marginBottom: 24 }}>
        <div className="admin-stat">
          <strong>{messages.length}</strong>
          <span>Total Inquiries</span>
        </div>
        <div className="admin-stat">
          <strong style={{ color: unreadCount > 0 ? "var(--orange)" : "var(--soft-white)" }}>
            {unreadCount}
          </strong>
          <span>Unread Messages</span>
        </div>
        <div className="admin-stat">
          <strong>{messages.filter((m) => m.status === "REPLIED").length}</strong>
          <span>Replied</span>
        </div>
        <div className="admin-stat">
          <strong>{messages.filter((m) => m.googleSynced).length} / {messages.length}</strong>
          <span>Synced to Google</span>
        </div>
      </div>

      <MessagesManager initialMessages={JSON.parse(JSON.stringify(messages))} />
    </main>
  );
}
