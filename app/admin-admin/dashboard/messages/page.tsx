import { AdminNavigation } from "@/components/admin/AdminNavigation";
import { MessagesManager } from "@/components/admin/MessagesManager";
import { prisma } from "@/lib/prisma";
import { loadCsvContactRecords, DEFAULT_GOOGLE_SHEETS_SPREADSHEET_URL, DEFAULT_GOOGLE_SHEETS_WEBHOOK_URL } from "@/lib/google-sheets";
import Link from "next/link";
import { ExternalLink, Sheet } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  let messages: any[] = [];
  let unreadCount = 0;

  try {
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
            try {
              await prisma.contactMessage.upsert({
                where: { id: m.id },
                update: {},
                create: {
                  id: m.id,
                  name: m.name,
                  email: m.email,
                  phone: m.phone || null,
                  message: m.message,
                  submittedAtIST: m.submittedAtIST,
                  ipAddress: m.ipAddress || null,
                  status: "UNREAD",
                  googleSynced: true,
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
          try {
            await prisma.contactMessage.upsert({
              where: { id: r.id || "temp" },
              update: {},
              create: {
                id: r.id,
                name: r.name,
                email: r.email,
                phone: r.phone || null,
                message: r.message,
                submittedAtIST: r.submittedAtIST,
                ipAddress: r.ipAddress || null,
                status: "UNREAD",
                googleSynced: true,
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

    // 3. Load all inquiries from SQLite database
    const [msgs, unread] = await Promise.all([
      prisma.contactMessage.findMany({
        orderBy: { createdAt: "desc" },
      }),
      prisma.contactMessage.count({
        where: { status: "UNREAD" },
      }),
    ]);
    messages = msgs;
    unreadCount = unread;
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
