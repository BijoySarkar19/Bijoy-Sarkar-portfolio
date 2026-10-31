"use client";

import { useState } from "react";
import { Mail, Phone, Calendar, Check, ExternalLink, Download, Trash2, RefreshCw, Send, Sheet, Copy } from "lucide-react";
import { useRouter } from "next/navigation";

export interface ContactMessageItem {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  message: string;
  submittedAtIST: string;
  ipAddress?: string | null;
  status: string;
  googleSynced: boolean;
  notes?: string | null;
  createdAt: string | Date;
}

export function MessagesManager({ initialMessages }: { initialMessages: ContactMessageItem[] }) {
  const router = useRouter();
  const [messages, setMessages] = useState<ContactMessageItem[]>(initialMessages);
  const [filter, setFilter] = useState<"ALL" | "UNREAD" | "READ" | "REPLIED" | "ARCHIVED">("ALL");
  const [loading, setLoading] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const filtered = messages.filter((m) => {
    if (filter === "ALL") return true;
    return m.status === filter;
  });

  const unreadCount = messages.filter((m) => m.status === "UNREAD").length;

  async function updateStatus(id: string, newStatus: string) {
    try {
      const res = await fetch("/api/admin/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status: newStatus } : m)));
      setFeedback({ text: `Message marked as ${newStatus.toLowerCase()}.`, type: "success" });
      router.refresh();
    } catch {
      setFeedback({ text: "Failed to update status.", type: "error" });
    }
  }

  async function syncGoogle(id: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "sync_google" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sync failed");
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, googleSynced: true } : m)));
      setFeedback({ text: "Synced with Google Sheets!", type: "success" });
      router.refresh();
    } catch (err: unknown) {
      setFeedback({ text: err instanceof Error ? err.message : "Sync failed.", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function deleteMessage(id: string) {
    if (!confirm("Are you sure you want to delete this contact submission?")) return;
    try {
      const res = await fetch(`/api/admin/messages?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete message");
      setMessages((prev) => prev.filter((m) => m.id !== id));
      setFeedback({ text: "Message removed.", type: "success" });
      router.refresh();
    } catch {
      setFeedback({ text: "Failed to delete message.", type: "error" });
    }
  }

  return (
    <div className="admin-section-block">
      {/* Action Bar */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 12, marginBottom: 20 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {(["ALL", "UNREAD", "READ", "REPLIED", "ARCHIVED"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              className={`button ${filter === tab ? "button-primary" : "button-secondary"}`}
              style={{ fontSize: 11, padding: "6px 12px", height: "auto" }}
              onClick={() => setFilter(tab)}
            >
              {tab === "ALL" ? `All (${messages.length})` : tab === "UNREAD" ? `Unread (${unreadCount})` : tab}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <a
            className="button button-secondary"
            href="https://docs.google.com/spreadsheets/d/1bkxAetgAqLrk0MM_17Ia2VVDzUrugcaQEhFy8WjiIQQ/edit?gid=0#gid=0"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 12 }}
            title="Open live Portfolio Inquiries Google Sheet (bijoysarkar7252@gmail.com)"
          >
            <Sheet size={13} style={{ color: "#34a853" }} /> Open Google Sheets <ExternalLink size={11} />
          </a>
          <a
            className="button"
            href="/downloads/contact-submissions.csv"
            download="contact-submissions.csv"
            style={{ fontSize: 12 }}
            title="Download CSV dataset containing all submissions"
          >
            <Download size={13} /> Export CSV
          </a>
        </div>
      </div>

      {feedback && (
        <div
          style={{
            padding: "10px 16px",
            marginBottom: 16,
            borderRadius: 8,
            fontSize: 12,
            background: feedback.type === "success" ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)",
            border: `1px solid ${feedback.type === "success" ? "rgba(34, 197, 94, 0.4)" : "rgba(239, 68, 68, 0.4)"}`,
            color: feedback.type === "success" ? "#4ade80" : "#f87171",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>{feedback.text}</span>
          <button type="button" onClick={() => setFeedback(null)} style={{ background: "none", border: 0, color: "inherit", cursor: "pointer" }}>✕</button>
        </div>
      )}

      {/* Messages List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {filtered.map((msg) => {
          const isUnread = msg.status === "UNREAD";
          const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(msg.email)}&su=Re:%20Inquiry%20from%20Portfolio&body=Hi%20${encodeURIComponent(msg.name)},%0A%0A`;

          return (
            <div
              key={msg.id}
              style={{
                background: isUnread ? "rgba(255, 94, 44, 0.05)" : "rgba(8, 11, 20, 0.7)",
                border: isUnread ? "1px solid rgba(255, 94, 44, 0.4)" : "1px solid var(--line)",
                borderRadius: 12,
                padding: "16px 20px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                transition: "all 150ms ease",
              }}
            >
              {/* Header: Name, Contact & Date */}
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <strong style={{ fontSize: 16, color: "var(--soft-white)" }}>{msg.name}</strong>
                    {isUnread && (
                      <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: "var(--orange)", color: "#fff" }}>
                        NEW / UNREAD
                      </span>
                    )}
                    <span
                      style={{
                        fontSize: 10,
                        padding: "2px 8px",
                        borderRadius: 6,
                        background: msg.status === "REPLIED" ? "rgba(34, 197, 94, 0.2)" : "rgba(255, 255, 255, 0.06)",
                        color: msg.status === "REPLIED" ? "#4ade80" : "var(--muted)",
                      }}
                    >
                      {msg.status}
                    </span>
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 16, fontSize: 12, color: "var(--muted)" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <Mail size={13} style={{ color: "var(--orange)" }} />
                      <a href={gmailComposeUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--soft-white)", textDecoration: "underline" }}>
                        {msg.email}
                      </a>
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <Phone size={13} style={{ color: "var(--orange)" }} />
                      <span>{msg.phone || "No phone provided"}</span>
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 11, color: "var(--muted)" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <Calendar size={12} />
                    <strong>{msg.submittedAtIST}</strong>
                  </span>
                </div>
              </div>

              {/* Message Body */}
              <div
                style={{
                  background: "rgba(0, 0, 0, 0.35)",
                  padding: "12px 14px",
                  borderRadius: 8,
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: "var(--soft-white)",
                  whiteSpace: "pre-wrap",
                  borderLeft: "3px solid var(--orange)",
                }}
              >
                {msg.message}
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 10, paddingTop: 4 }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                  <a
                    className="button"
                    href={gmailComposeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 11, padding: "5px 12px", height: "auto" }}
                  >
                    <Send size={11} /> Reply via Gmail
                  </a>

                  {isUnread ? (
                    <button
                      type="button"
                      className="button button-secondary"
                      style={{ fontSize: 11, padding: "5px 12px", height: "auto" }}
                      onClick={() => updateStatus(msg.id, "READ")}
                    >
                      <Check size={11} /> Mark Read
                    </button>
                  ) : msg.status !== "REPLIED" ? (
                    <button
                      type="button"
                      className="button button-secondary"
                      style={{ fontSize: 11, padding: "5px 12px", height: "auto" }}
                      onClick={() => updateStatus(msg.id, "REPLIED")}
                    >
                      Mark Replied
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="button button-secondary"
                      style={{ fontSize: 11, padding: "5px 12px", height: "auto" }}
                      onClick={() => updateStatus(msg.id, "UNREAD")}
                    >
                      Mark Unread
                    </button>
                  )}

                  <button
                    type="button"
                    className="button button-secondary"
                    style={{ fontSize: 11, padding: "5px 12px", height: "auto" }}
                    onClick={() => updateStatus(msg.id, msg.status === "ARCHIVED" ? "READ" : "ARCHIVED")}
                  >
                    {msg.status === "ARCHIVED" ? "Unarchive" : "Archive"}
                  </button>
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button
                    type="button"
                    className="button button-secondary"
                    style={{
                      fontSize: 10,
                      padding: "4px 8px",
                      height: "auto",
                      color: msg.googleSynced ? "#4ade80" : "inherit",
                      borderColor: msg.googleSynced ? "rgba(74, 222, 128, 0.3)" : undefined,
                    }}
                    onClick={() => syncGoogle(msg.id)}
                    disabled={loading}
                    title={msg.googleSynced ? "Row synced. Click to re-sync to Google Sheets" : "Sync row to Google Sheets Webhook"}
                  >
                    {msg.googleSynced ? <Check size={10} /> : <RefreshCw size={10} />}
                    {msg.googleSynced ? "Synced (Re-sync)" : "Sync Google Sheet"}
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteMessage(msg.id)}
                    style={{
                      background: "transparent",
                      border: "1px solid rgba(239, 68, 68, 0.3)",
                      borderRadius: 6,
                      color: "#f87171",
                      padding: "4px 8px",
                      cursor: "pointer",
                      fontSize: 11,
                    }}
                    title="Delete message"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--muted)", background: "rgba(8, 11, 20, 0.4)", borderRadius: 12 }}>
            No messages found in this filter.
          </div>
        )}
      </div>

      {/* Google Sheets Integration Guide Card */}
      <div style={{ marginTop: 32, padding: "20px", borderRadius: 12, background: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--line)" }}>
        <h3 style={{ fontSize: 14, color: "var(--soft-white)", margin: "0 0 8px" }}>
          📊 Google Sheet &amp; Gmail Alert Setup for <span className="accent">bijoysarkar7252@gmail.com</span>
        </h3>
        <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 14px", lineHeight: 1.6 }}>
          All contact submissions are automatically appended into <code>/public/downloads/contact-submissions.csv</code> with Indian Standard Time (IST), name, email, phone, and message. To automatically sync them to your live Google Sheet AND receive instant email alerts in <code>bijoysarkar7252@gmail.com</code> without SMTP:
        </p>
        <ol style={{ fontSize: 12, color: "var(--muted)", paddingLeft: 20, lineHeight: 1.7, margin: "0 0 16px" }}>
          <li>Open your Google Drive and create a new blank Google Sheet (signed in as <code>bijoysarkar7252@gmail.com</code>).</li>
          <li>In the sheet, go to <strong>Extensions &gt; Apps Script</strong>.</li>
          <li>Delete any code in the editor, paste the script below, and click <strong>Save</strong>:</li>
        </ol>

        <div style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => {
              const code = `function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "active",
    account: "bijoysarkar7252@gmail.com",
    message: "Google Sheets Webhook is active and connected!"
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = {};
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    // Auto-create header row if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Timestamp (IST)", "Name", "Email", "Phone", "Message", "IP Address"]);
      sheet.getRange("A1:F1").setFontWeight("bold").setBackground("#ff5e2c").setFontColor("#ffffff");
    }

    // Append inquiry row
    sheet.appendRow([
      data.timestampIST || new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
      data.name || "",
      data.email || "",
      data.phone || "Not provided",
      data.message || "",
      data.ipAddress || "Unknown"
    ]);

    // Send instant alert email to your Gmail
    MailApp.sendEmail({
      to: "bijoysarkar7252@gmail.com",
      subject: "New Portfolio Inquiry from " + (data.name || "Visitor"),
      replyTo: data.email || "bijoysarkar7252@gmail.com",
      body: "New message received on " + (data.timestampIST || "Now") + "\\n\\n" +
            "Name: " + (data.name || "N/A") + "\\n" +
            "Email: " + (data.email || "N/A") + "\\n" +
            "Phone: " + (data.phone || "Not provided") + "\\n\\n" +
            "Message:\\n" + (data.message || "")
    });

    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;
              navigator.clipboard.writeText(code);
              setCopiedScript(true);
              setTimeout(() => setCopiedScript(false), 2000);
            }}
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              zIndex: 2,
              background: copiedScript ? "#34a853" : "rgba(255, 94, 44, 0.2)",
              border: `1px solid ${copiedScript ? "#34a853" : "var(--orange)"}`,
              color: "#fff",
              padding: "6px 12px",
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {copiedScript ? <Check size={12} /> : <Copy size={12} />}
            {copiedScript ? "Copied Script!" : "Copy Script"}
          </button>
          <pre
            style={{
              background: "#05070e",
              padding: "14px",
              borderRadius: 8,
              border: "1px solid rgba(255, 255, 255, 0.08)",
              fontSize: 11,
              color: "#a5b4fc",
              overflowX: "auto",
              fontFamily: "monospace",
              lineHeight: 1.5,
              maxHeight: 260,
            }}
          >
{`function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "active",
    account: "bijoysarkar7252@gmail.com",
    message: "Google Sheets Webhook is active and connected!"
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = {};
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    // Auto-create header row if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Timestamp (IST)", "Name", "Email", "Phone", "Message", "IP Address"]);
      sheet.getRange("A1:F1").setFontWeight("bold").setBackground("#ff5e2c").setFontColor("#ffffff");
    }

    // Append row
    sheet.appendRow([
      data.timestampIST || new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
      data.name || "",
      data.email || "",
      data.phone || "Not provided",
      data.message || "",
      data.ipAddress || "Unknown"
    ]);

    // Send instant alert email to your Gmail
    MailApp.sendEmail({
      to: "bijoysarkar7252@gmail.com",
      subject: "New Portfolio Inquiry from " + (data.name || "Visitor"),
      replyTo: data.email || "bijoysarkar7252@gmail.com",
      body: "New message received on " + (data.timestampIST || "Now") + "\\n\\n" +
            "Name: " + (data.name || "N/A") + "\\n" +
            "Email: " + (data.email || "N/A") + "\\n" +
            "Phone: " + (data.phone || "Not provided") + "\\n\\n" +
            "Message:\\n" + (data.message || "")
    });

    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`}
          </pre>
        </div>

        <ol start={4} style={{ fontSize: 12, color: "var(--muted)", paddingLeft: 20, lineHeight: 1.7, margin: "14px 0 0" }}>
          <li>Click the 💾 <strong>Save icon</strong> (or press <code>Ctrl+S</code>) to eliminate the orange dot on <code>Code.gs</code>.</li>
          <li>Click <strong>Deploy &gt; New deployment</strong>. Select type <strong>Web app</strong> (gear icon ⚙).</li>
          <li>Set <em>Execute as</em>: <strong>Me (bijoysarkar7252@gmail.com)</strong> and <em>Who has access</em>: <strong>Anyone</strong> (crucial so visitors can submit).</li>
          <li>Click <strong>Deploy</strong>, authorize access with your Google account, and copy the generated <strong>Web app URL</strong> (ending in <code>/exec</code>).</li>
          <li>Go to <a href="/admin-admin/dashboard/settings" style={{ color: "var(--orange)", textDecoration: "underline" }}>Admin &gt; Settings</a>, paste the URL into <strong>Google Sheets Webhook URL</strong>, and click <strong>Save Settings</strong>.</li>
        </ol>

        <div style={{ marginTop: 18, padding: "12px 14px", borderRadius: 8, background: "rgba(52, 168, 83, 0.08)", border: "1px solid rgba(52, 168, 83, 0.28)", fontSize: 11, display: "flex", flexDirection: "column", gap: 4 }}>
          <strong style={{ color: "#34a853" }}>✓ Connected Google Sheet: Portfolio Inquiries</strong>
          <span style={{ color: "var(--soft-white)", wordBreak: "break-all" }}>
            File: <a href="https://docs.google.com/spreadsheets/d/1bkxAetgAqLrk0MM_17Ia2VVDzUrugcaQEhFy8WjiIQQ/edit?gid=0#gid=0" target="_blank" rel="noopener noreferrer" style={{ color: "#34a853", textDecoration: "underline" }}>docs.google.com/spreadsheets/d/1bkxAetgAqLrk0MM_17Ia2VVDzUrugcaQEhFy8WjiIQQ</a>
          </span>
          <span style={{ color: "var(--muted)", wordBreak: "break-all" }}>
            Deployment ID: <code>AKfycbyYBYJvRKMseONj9Gxj2yL2xsWGPQ2OYDTJ87hPuse8Xm31Gvn26_ygslpbZN-5utWu</code>
          </span>
        </div>
      </div>
    </div>
  );
}
