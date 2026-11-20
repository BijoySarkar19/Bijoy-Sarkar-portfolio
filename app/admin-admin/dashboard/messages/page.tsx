import { AdminNavigation } from "@/components/admin/AdminNavigation";
import { MessagesManager } from "@/components/admin/MessagesManager";
import { prisma } from "@/lib/prisma";
import { loadCsvContactRecords, DEFAULT_GOOGLE_SHEETS_SPREADSHEET_URL } from "@/lib/google-sheets";
import Link from "next/link";
import { ExternalLink, Sheet } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  let messages: any[] = [];
  let unreadCount = 0;

  try {
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

    // Fallback: If database is brand new / ephemeral (e.g. fresh container on Vercel), populate from CSV dataset
    if (messages.length === 0) {
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
        messages = await prisma.contactMessage.findMany({
          orderBy: { createdAt: "desc" },
        });
        unreadCount = messages.filter((m) => m.status === "UNREAD").length;
      }
    }
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
