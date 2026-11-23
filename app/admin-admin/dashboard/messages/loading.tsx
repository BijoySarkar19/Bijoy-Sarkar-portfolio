import { AdminNavigation } from "@/components/admin/AdminNavigation";

export default function MessagesLoading() {
  return (
    <main>
      <div className="admin-topline">
        <div>
          <p className="section-kicker">Contact Us Submissions</p>
          <h1>Messages &amp; Google Sheets Dataset</h1>
        </div>
      </div>

      <AdminNavigation active="messages" />

      <div className="admin-section-block" style={{ opacity: 0.6 }}>
        <div className="admin-stats admin-stats-4" style={{ marginBottom: 20 }}>
          <div className="admin-stat" style={{ minHeight: 90 }}>
            <span style={{ height: 32, width: 60, background: "rgba(255, 255, 255, 0.08)", borderRadius: 6, display: "inline-block", marginBottom: 8 }} />
            <span>Total Inquiries</span>
          </div>
          <div className="admin-stat" style={{ minHeight: 90 }}>
            <span style={{ height: 32, width: 40, background: "rgba(255, 255, 255, 0.08)", borderRadius: 6, display: "inline-block", marginBottom: 8 }} />
            <span>Unread Messages</span>
          </div>
          <div className="admin-stat" style={{ minHeight: 90 }}>
            <span style={{ height: 32, width: 40, background: "rgba(255, 255, 255, 0.08)", borderRadius: 6, display: "inline-block", marginBottom: 8 }} />
            <span>Replied</span>
          </div>
          <div className="admin-stat" style={{ minHeight: 90 }}>
            <span style={{ height: 32, width: 70, background: "rgba(255, 255, 255, 0.08)", borderRadius: 6, display: "inline-block", marginBottom: 8 }} />
            <span>Synced to Google</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, margin: "20px 0" }}>
          <span style={{ height: 32, width: 70, background: "rgba(255, 255, 255, 0.06)", borderRadius: 999, display: "inline-block" }} />
          <span style={{ height: 32, width: 85, background: "rgba(255, 255, 255, 0.06)", borderRadius: 999, display: "inline-block" }} />
          <span style={{ height: 32, width: 75, background: "rgba(255, 255, 255, 0.06)", borderRadius: 999, display: "inline-block" }} />
        </div>

        <div style={{ minHeight: 280, borderRadius: 12, border: "1px solid var(--line)", background: "rgba(255, 255, 255, 0.02)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 12, color: "var(--muted)", letterSpacing: "0.08em" }}>LOADING MESSAGES WORKSPACE...</span>
        </div>
      </div>
    </main>
  );
}
