import { AdminNavigation } from "@/components/admin/AdminNavigation";
import { MessagesManager } from "@/components/admin/MessagesManager";
import { prisma } from "@/lib/prisma";
import { DEFAULT_GOOGLE_SHEETS_SPREADSHEET_URL } from "@/lib/google-sheets";
import { parseDateTimestamp } from "@/lib/ist-date";
import Link from "next/link";
import { ExternalLink, Sheet } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  let messages: any[] = [];

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

    // 1. Direct local database query — executes in ~5ms without blocking external network requests
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
