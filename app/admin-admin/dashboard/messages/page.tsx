import { AdminNavigation } from "@/components/admin/AdminNavigation";
import { MessagesManager } from "@/components/admin/MessagesManager";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  const [messages, unreadCount] = await Promise.all([
    prisma.contactMessage.findMany({
      orderBy: { createdAt: "desc" },
    }),
    prisma.contactMessage.count({
      where: { status: "UNREAD" },
    }),
  ]);

  return (
    <main>
      <div className="admin-topline">
        <div>
          <p className="section-kicker">Contact Us Submissions</p>
          <h1>Messages &amp; Google Sheets Dataset</h1>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
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
