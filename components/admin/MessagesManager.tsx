"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Mail, Phone, Calendar, Check, CheckCheck, ExternalLink, Download, Trash2, RefreshCw, Send, Sheet, Copy, Search, X, User, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { parseDateTimestamp, formatMessageCardIST } from "@/lib/ist-date";

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

// Matches phone number without requiring country code
function matchesPhone(phone: string | null | undefined, query: string): boolean {
  if (!phone || !query) return false;
  const q = query.toLowerCase().trim();
  const raw = phone.toLowerCase();
  if (raw.includes(q)) return true;

  const pDigits = phone.replace(/\D/g, "");
  const qDigits = query.replace(/\D/g, "");
  if (qDigits.length > 0) {
    if (pDigits.includes(qDigits)) return true;
    // Strip common country code prefixes (e.g. 91 for India, 1 for US, etc.)
    const national = pDigits.replace(/^(91|1|44|61|81)/, "");
    if (national.includes(qDigits)) return true;
  }
  return false;
}

export function MessagesManager({ initialMessages }: { initialMessages: ContactMessageItem[] }) {
  const router = useRouter();

  // Initialize with messages sorted strictly date-wise (newest / most recently received first)
  // Fall back immediately to browser localStorage cache if initialMessages is empty for 0ms cold-start display
  const [messages, setMessages] = useState<ContactMessageItem[]>(() => {
    let list = [...initialMessages];
    if (list.length === 0 && typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("portfolio_cached_messages");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            list = parsed;
          }
        }
      } catch {}
    }
    list.sort((a, b) => {
      const timeA = parseDateTimestamp(a.submittedAtIST || a.createdAt);
      const timeB = parseDateTimestamp(b.submittedAtIST || b.createdAt);
      return timeB - timeA;
    });
    return list;
  });

  const [filter, setFilter] = useState<"ALL" | "UNREAD" | "READ" | "REPLIED" | "ARCHIVED">("ALL");
  const [recentlyUpdatedIds, setRecentlyUpdatedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Background sync from Google Sheets without blocking page transition or disrupting UI
  async function triggerSheetsSync(manual: boolean = true) {
    if (manual) {
      setIsManualSyncing(true);
    }
    try {
      const res = await fetch("/api/admin/messages/sync", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.messages && Array.isArray(data.messages) && data.messages.length > 0) {
          let localOverrides: Record<string, string> = {};
          try {
            const raw = localStorage.getItem("portfolio_msg_statuses");
            if (raw) localOverrides = JSON.parse(raw);
          } catch {}

          setMessages((prev) => {
            const activeStatusMap: Record<string, string> = { ...localOverrides };
            for (const m of prev) {
              if (m.status !== "UNREAD") {
                activeStatusMap[m.id] = m.status;
              }
            }

            const updatedList = data.messages.map((m: ContactMessageItem) => ({
              ...m,
              status: activeStatusMap[m.id] || m.status,
            }));

            updatedList.sort((a: ContactMessageItem, b: ContactMessageItem) => {
              const timeA = parseDateTimestamp(a.submittedAtIST || a.createdAt);
              const timeB = parseDateTimestamp(b.submittedAtIST || b.createdAt);
              if (timeB !== timeA) return timeB - timeA;
              return (b.id || "").localeCompare(a.id || "");
            });

            try {
              localStorage.setItem("portfolio_cached_messages", JSON.stringify(updatedList));
            } catch {}

            return updatedList;
          });

          if (manual) {
            setFeedback({ text: `Synced with Google Sheets (${data.messages.length} inquiries up to date)`, type: "success" });
          }
        }
      } else if (manual) {
        setFeedback({ text: "Could not sync with Google Sheets webhook.", type: "error" });
      }
    } catch {
      if (manual) {
        setFeedback({ text: "Sync failed. Check network connection.", type: "error" });
      }
    } finally {
      if (manual) {
        setIsManualSyncing(false);
      }
    }
  }

  // Trigger silent non-blocking background check 200ms after page mount
  useEffect(() => {
    const timer = setTimeout(() => {
      triggerSheetsSync(false);
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  // Persist messages cache to localStorage for instant 0ms retrieval on subsequent page visits
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem("portfolio_cached_messages", JSON.stringify(messages));
      } catch {}
    }
  }, [messages]);

  // Close suggestions popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync state when initialMessages change from server, while strictly protecting user updates & localStorage overrides
  useEffect(() => {
    if (initialMessages.length === 0) {
      try {
        const cached = localStorage.getItem("portfolio_cached_messages");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
          }
        }
      } catch {}
      return;
    }

    let localOverrides: Record<string, string> = {};
    try {
      const raw = localStorage.getItem("portfolio_msg_statuses");
      if (raw) localOverrides = JSON.parse(raw);
    } catch {}

    setMessages((prev) => {
      // Gather any status changes made during this session
      const activeStatusMap: Record<string, string> = { ...localOverrides };
      for (const m of prev) {
        if (m.status !== "UNREAD") {
          activeStatusMap[m.id] = m.status;
        }
      }

      const list = initialMessages.map((m) => {
        const finalStatus = activeStatusMap[m.id] || m.status;
        return {
          ...m,
          status: finalStatus,
        };
      });

      list.sort((a, b) => {
        const timeA = parseDateTimestamp(a.submittedAtIST || a.createdAt);
        const timeB = parseDateTimestamp(b.submittedAtIST || b.createdAt);
        return timeB - timeA;
      });
      return list;
    });
  }, [initialMessages]);

  // Load client-side local overrides on mount for instant zero-latency consistency
  useEffect(() => {
    try {
      const raw = localStorage.getItem("portfolio_msg_statuses");
      if (raw) {
        const overrides = JSON.parse(raw);
        setMessages((prev) =>
          prev.map((m) => (overrides[m.id] ? { ...m, status: overrides[m.id] } : m))
        );
      }
    } catch {}
  }, []);

  // Compute live search suggestions across Name, Email, Phone (no country code), and Message description
  const suggestions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return [];

    const list: { type: "name" | "email" | "phone" | "message"; title: string; subtitle: string; value: string }[] = [];
    const seen = new Set<string>();

    for (const m of messages) {
      // 1. Name suggestion
      if (m.name && m.name.toLowerCase().includes(q)) {
        const key = `name-${m.name}`;
        if (!seen.has(key)) {
          seen.add(key);
          list.push({ type: "name", title: m.name, subtitle: m.email || "Name match", value: m.name });
        }
      }

      // 2. Email suggestion
      if (m.email && m.email.toLowerCase().includes(q)) {
        const key = `email-${m.email}`;
        if (!seen.has(key)) {
          seen.add(key);
          list.push({ type: "email", title: m.email, subtitle: `Inquiry by ${m.name}`, value: m.email });
        }
      }

      // 3. Phone number suggestion (does NOT require country code)
      if (m.phone && matchesPhone(m.phone, q)) {
        const cleanDigits = m.phone.replace(/[^\d+]/g, "");
        const key = `phone-${cleanDigits}`;
        if (!seen.has(key)) {
          seen.add(key);
          const rawWithoutCountry = m.phone.replace(/^\+91\s*/, "").replace(/^'\+91\s*/, "").replace(/^'/, "");
          list.push({
            type: "phone",
            title: m.phone.replace(/^'/, ""),
            subtitle: `${m.name} · Matches without country code`,
            value: rawWithoutCountry,
          });
        }
      }

      // 4. Message / Description excerpt suggestion
      if (m.message && m.message.toLowerCase().includes(q)) {
        const idx = m.message.toLowerCase().indexOf(q);
        const start = Math.max(0, idx - 15);
        const end = Math.min(m.message.length, idx + q.length + 35);
        const snippet = (start > 0 ? "..." : "") + m.message.substring(start, end).trim() + (end < m.message.length ? "..." : "");
        const key = `msg-${snippet}`;
        if (!seen.has(key)) {
          seen.add(key);
          list.push({
            type: "message",
            title: snippet,
            subtitle: `Message content from ${m.name}`,
            value: m.message.substring(idx, Math.min(m.message.length, idx + 25)).trim(),
          });
        }
      }

      if (list.length >= 8) break;
    }

    return list;
  }, [messages, searchQuery]);

  // Combined tab + search filtering
  const filtered = useMemo(() => {
    return messages
      .filter((m) => {
        // Tab filter: Keep message in view if user recently updated its status in the active tab session
        if (filter !== "ALL" && m.status !== filter && !recentlyUpdatedIds.has(m.id)) {
          return false;
        }

        // Search query filter (Name, Title, Email, Phone without country code, Message)
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = m.name?.toLowerCase().includes(q);
        const emailMatch = m.email?.toLowerCase().includes(q);
        const msgMatch = m.message?.toLowerCase().includes(q);
        const notesMatch = m.notes?.toLowerCase().includes(q);
        const phoneMatch = matchesPhone(m.phone, q);

        return Boolean(nameMatch || emailMatch || msgMatch || notesMatch || phoneMatch);
      })
      .sort((a, b) => {
        const timeA = parseDateTimestamp(a.submittedAtIST || a.createdAt);
        const timeB = parseDateTimestamp(b.submittedAtIST || b.createdAt);
        if (timeB !== timeA) return timeB - timeA;
        return (b.id || "").localeCompare(a.id || "");
      });
  }, [messages, filter, searchQuery, recentlyUpdatedIds]);

  const totalCount = messages.length;
  const unreadCount = messages.filter((m) => m.status === "UNREAD").length;
  const readCount = messages.filter((m) => m.status === "READ").length;
  const repliedCount = messages.filter((m) => m.status === "REPLIED").length;
  const archivedCount = messages.filter((m) => m.status === "ARCHIVED").length;
  const syncedCount = messages.filter((m) => m.googleSynced).length;

  async function markAllAsRead() {
    setMessages((prev) => prev.map((m) => ({ ...m, status: "READ" })));
    setRecentlyUpdatedIds(new Set());
    setFeedback({ text: "All messages marked as read.", type: "success" });

    try {
      const raw = localStorage.getItem("portfolio_msg_statuses");
      const overrides = raw ? JSON.parse(raw) : {};
      for (const m of messages) {
        overrides[m.id] = "READ";
      }
      localStorage.setItem("portfolio_msg_statuses", JSON.stringify(overrides));
    } catch {}

    try {
      await fetch("/api/admin/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_all_read" }),
      });
    } catch {}
  }

  async function updateStatus(id: string, newStatus: string) {
    // 1. Immediate optimistic UI update — locked in place
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: newStatus } : m))
    );
    setRecentlyUpdatedIds((prev) => new Set(prev).add(id));
    setFeedback({ text: `Message marked as ${newStatus.toLowerCase()}.`, type: "success" });

    // 2. Persist in browser localStorage for 0ms client-side persistence
    try {
      const raw = localStorage.getItem("portfolio_msg_statuses");
      const overrides = raw ? JSON.parse(raw) : {};
      overrides[id] = newStatus;
      localStorage.setItem("portfolio_msg_statuses", JSON.stringify(overrides));
    } catch {}

    // 3. Persist to server backend API asynchronously (no router.refresh to prevent race conditions)
    try {
      const res = await fetch("/api/admin/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.warn("Server update notice:", data);
      }
      setFeedback({ text: `Message marked as ${newStatus.toLowerCase()} successfully.`, type: "success" });
    } catch (err: unknown) {
      console.warn("Server status notice:", err);
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
    } catch {
      setFeedback({ text: "Failed to delete message.", type: "error" });
    }
  }

  return (
    <div className="admin-section-block">
      {/* Live Interactive KPI Stats Cards */}
      <div className="admin-stats admin-stats-4" style={{ marginBottom: 20 }}>
        <div
          className={`admin-stat admin-stat-clickable ${filter === "ALL" ? "active-stat" : ""}`}
          onClick={() => {
            setFilter("ALL");
            setRecentlyUpdatedIds(new Set());
          }}
          title="Click to view all inquiry submissions"
          style={{
            cursor: "pointer",
            transition: "all 0.2s ease",
            borderColor: filter === "ALL" ? "var(--orange)" : undefined,
            background: filter === "ALL" ? "rgba(255, 94, 44, 0.08)" : undefined,
          }}
        >
          <strong>{totalCount}</strong>
          <span>Total Inquiries</span>
        </div>

        <div
          className={`admin-stat admin-stat-clickable ${filter === "UNREAD" ? "active-stat" : ""}`}
          onClick={() => {
            setFilter("UNREAD");
            setRecentlyUpdatedIds(new Set());
          }}
          title="Click to view unread messages"
          style={{
            cursor: "pointer",
            transition: "all 0.2s ease",
            borderColor: filter === "UNREAD" ? "var(--orange)" : undefined,
            background: filter === "UNREAD" ? "rgba(255, 94, 44, 0.08)" : undefined,
          }}
        >
          <strong style={{ color: unreadCount > 0 ? "var(--orange)" : "var(--soft-white)" }}>
            {unreadCount}
          </strong>
          <span>Unread Messages</span>
        </div>

        <div
          className={`admin-stat admin-stat-clickable ${filter === "REPLIED" ? "active-stat" : ""}`}
          onClick={() => {
            setFilter("REPLIED");
            setRecentlyUpdatedIds(new Set());
          }}
          title="Click to view replied messages"
          style={{
            cursor: "pointer",
            transition: "all 0.2s ease",
            borderColor: filter === "REPLIED" ? "var(--orange)" : undefined,
            background: filter === "REPLIED" ? "rgba(255, 94, 44, 0.08)" : undefined,
          }}
        >
          <strong style={{ color: repliedCount > 0 ? "#34a853" : "var(--soft-white)" }}>
            {repliedCount}
          </strong>
          <span>Replied</span>
        </div>

        <div
          className="admin-stat"
          title="Inquiries synchronized with Google Sheets"
        >
          <strong>{syncedCount} / {totalCount}</strong>
          <span>Synced to Google</span>
        </div>
      </div>

      {/* Action Bar */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          {(["ALL", "UNREAD", "READ", "REPLIED", "ARCHIVED"] as const).map((tab) => {
            const count =
              tab === "ALL"
                ? totalCount
                : tab === "UNREAD"
                ? unreadCount
                : tab === "READ"
                ? readCount
                : tab === "REPLIED"
                ? repliedCount
                : archivedCount;

            return (
              <button
                key={tab}
                type="button"
                className={`button ${filter === tab ? "button-primary" : "button-secondary"}`}
                style={{ fontSize: 11, padding: "6px 12px", height: "auto" }}
                onClick={() => {
                  setFilter(tab);
                  setRecentlyUpdatedIds(new Set());
                }}
              >
                {tab === "ALL"
                  ? `All (${count})`
                  : tab === "UNREAD"
                  ? `Unread (${count})`
                  : tab === "READ"
                  ? `Read (${count})`
                  : tab === "REPLIED"
                  ? `Replied (${count})`
                  : `Archived (${count})`}
              </button>
            );
          })}

          {unreadCount > 0 && (
            <button
              type="button"
              className="button button-secondary"
              style={{ fontSize: 11, padding: "6px 12px", height: "auto", color: "var(--orange)", borderColor: "var(--orange)" }}
              onClick={markAllAsRead}
              title="Mark all unread inquiries as read"
            >
              <CheckCheck size={12} /> Mark All Read
            </button>
          )}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
          <button
            type="button"
            className="button button-secondary"
            onClick={() => triggerSheetsSync(true)}
            disabled={isManualSyncing}
            style={{ fontSize: 12, display: "inline-flex", alignItems: "center", gap: 6 }}
            title="Sync latest inquiries from Google Sheets in real-time"
          >
            <RefreshCw size={13} style={{ animation: isManualSyncing ? "spin 1s linear infinite" : undefined }} />
            {isManualSyncing ? "Syncing..." : "Sync Sheets"}
          </button>
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

      {/* Smart Search Bar with Live Suggestions (Name, Title, Email, Phone without country code, Message) */}
      <div className="admin-search-container" ref={searchContainerRef}>
        <div className="admin-search-bar">
          <Search size={15} style={{ color: "var(--orange)", flexShrink: 0 }} />
          <input
            type="text"
            className="admin-search-input"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Search by name, email, phone (no country code needed), or message content..."
            aria-label="Search inquiries"
          />
          {searchQuery && (
            <button
              type="button"
              className="admin-search-clear"
              onClick={() => {
                setSearchQuery("");
                setShowSuggestions(false);
              }}
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
          {searchQuery && (
            <span className="admin-search-badge">
              {filtered.length} {filtered.length === 1 ? "match" : "matches"}
            </span>
          )}
        </div>

        {/* Suggestions Popover */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="admin-suggestions-popover">
            {suggestions.map((sug, idx) => (
              <div
                key={`${sug.type}-${sug.value}-${idx}`}
                className="admin-suggestion-item"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setSearchQuery(sug.value);
                  setShowSuggestions(false);
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  {sug.type === "name" && <User size={13} style={{ color: "var(--orange)", flexShrink: 0 }} />}
                  {sug.type === "email" && <Mail size={13} style={{ color: "#38bdf8", flexShrink: 0 }} />}
                  {sug.type === "phone" && <Phone size={13} style={{ color: "#4ade80", flexShrink: 0 }} />}
                  {sug.type === "message" && <MessageSquare size={13} style={{ color: "#a78bfa", flexShrink: 0 }} />}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: "var(--white)", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {sug.title}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {sug.subtitle}
                    </div>
                  </div>
                </div>
                <span className="admin-suggestion-tag">{sug.type}</span>
              </div>
            ))}
          </div>
        )}
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
        {filtered.length === 0 ? (
          <div className="admin-card" style={{ padding: "30px", textAlign: "center", color: "var(--muted)", fontSize: 13, borderStyle: "dashed" }}>
            {searchQuery ? `No inquiries match "${searchQuery}". Try searching by phone digits without country code, or a sender name.` : "No messages found in this filter."}
          </div>
        ) : (
          filtered.map((msg) => {
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
                    <strong>{formatMessageCardIST(msg.submittedAtIST || msg.createdAt)}</strong>
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
                    onClick={() => {
                      if (msg.status !== "REPLIED") {
                        updateStatus(msg.id, "REPLIED");
                      }
                    }}
                    title="Opens Gmail compose and automatically marks message as Replied"
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
                  ) : msg.status === "REPLIED" ? (
                    <>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: 11,
                          padding: "5px 10px",
                          background: "rgba(52, 168, 83, 0.15)",
                          border: "1px solid #34a853",
                          color: "#34a853",
                          borderRadius: 6,
                          fontWeight: 600,
                        }}
                      >
                        <Check size={11} /> Replied
                      </span>
                      <button
                        type="button"
                        className="button button-secondary"
                        style={{ fontSize: 11, padding: "5px 12px", height: "auto" }}
                        onClick={() => updateStatus(msg.id, "UNREAD")}
                        title="Mark as unread"
                      >
                        Mark Unread
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="button button-secondary"
                      style={{ fontSize: 11, padding: "5px 12px", height: "auto" }}
                      onClick={() => updateStatus(msg.id, "REPLIED")}
                    >
                      Mark Replied
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
        }))}
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
              const code = `/**
 * Bijoy Sarkar Portfolio — Google Sheets & Gmail Webhook Engine v2.2
 * Features:
 * 1. Automatic Column Resizing: Fits every column (A-G) perfectly to content so text never cuts off.
 * 2. Day Name Display: Formats timestamps with full day name (e.g., "Sunday, 22 Nov 2026, 12:27:02 am IST").
 * 3. Menu Tools: Adds a "Portfolio Tools" menu in Google Sheets to manually re-fit columns or fix legacy rows.
 * 4. Interactive Status: Syncs READ, REPLIED, ARCHIVED, UNREAD statuses directly with the Admin Portal.
 * 5. Instant Gmail Alerts: Sends formatted instant notifications to bijoysarkar7252@gmail.com.
 */

function onOpen() {
  try {
    var ui = SpreadsheetApp.getUi();
    ui.createMenu("Portfolio Tools")
      .addItem("Auto-Resize Columns & Format", "manualFormatAndResize")
      .addItem("Add Day Names to Existing Timestamps", "addDayNamesToExistingRows")
      .addToUi();
  } catch (e) {}

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  autoResizeAndFormat(sheet);
}

function manualFormatAndResize() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  autoResizeAndFormat(sheet);
}

function autoResizeAndFormat(sheet) {
  try {
    if (!sheet) {
      sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    }
    // Header styling
    if (sheet.getLastRow() >= 1) {
      sheet.getRange("A1:G1")
        .setFontWeight("bold")
        .setBackground("#ff5e2c")
        .setFontColor("#ffffff")
        .setHorizontalAlignment("center");
    }
    // Auto-fit all 7 columns
    sheet.autoResizeColumns(1, 7);

    // Ensure Column A (Timestamp with Day Name) has ample minimum width
    if (sheet.getColumnWidth(1) < 260) {
      sheet.setColumnWidth(1, 270);
    }
    // Comfortable minimum widths for all columns
    if (sheet.getColumnWidth(2) < 140) sheet.setColumnWidth(2, 150);
    if (sheet.getColumnWidth(3) < 200) sheet.setColumnWidth(3, 220);
    if (sheet.getColumnWidth(4) < 130) sheet.setColumnWidth(4, 140);
    if (sheet.getColumnWidth(5) < 260) sheet.setColumnWidth(5, 300);
    if (sheet.getColumnWidth(6) < 130) sheet.setColumnWidth(6, 140);
    if (sheet.getColumnWidth(7) < 100) sheet.setColumnWidth(7, 110);
  } catch (e) {}
}

function getFormattedISTWithDay(date) {
  var d = date || new Date();
  var dayStr = Utilities.formatDate(d, "Asia/Kolkata", "EEEE, dd MMM yyyy, hh:mm:ss a");
  var parts = dayStr.split(", ");
  if (parts.length >= 2) {
    var timePart = parts[1].replace(/\\b(AM|PM)\\b/i, function(m) { return m.toLowerCase(); });
    return parts[0] + ", " + timePart + " IST";
  }
  return dayStr + " IST";
}

function addDayNamesToExistingRows() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;

  var range = sheet.getRange(2, 1, lastRow - 1, 1);
  var values = range.getValues();
  var changed = false;

  for (var i = 0; i < values.length; i++) {
    var val = values[i][0];
    if (!val) continue;
    var str = String(val).trim();
    var hasDay = /^(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)/i.test(str);
    if (!hasDay) {
      var d = new Date(str.replace(/IST$/i, "").trim());
      if (isNaN(d.getTime())) {
        var dmy = str.match(/^(\\d{1,2})[\\/\\-](\\d{1,2})[\\/\\-](\\d{4})(.*)$/);
        if (dmy) {
          d = new Date(dmy[2] + "/" + dmy[1] + "/" + dmy[3] + (dmy[4] || ""));
        }
      }
      if (!isNaN(d.getTime())) {
        values[i][0] = getFormattedISTWithDay(d);
        changed = true;
      }
    }
  }
  if (changed) {
    range.setValues(values);
  }
  autoResizeAndFormat(sheet);
}

function doGet(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    autoResizeAndFormat(sheet);
    var data = sheet.getDataRange().getValues();
    var messages = [];
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (row && (row[0] || row[1] || row[2] || row[4])) {
        var cleanPhone = String(row[3] || "").replace(/^'/, "").trim();
        var status = (row[6] && row[6].toString().trim()) ? row[6].toString().trim().toUpperCase() : "UNREAD";
        messages.push({
          id: "sheet-row-" + (i + 1),
          submittedAtIST: String(row[0] || ""),
          name: String(row[1] || ""),
          email: String(row[2] || ""),
          phone: cleanPhone || "Not provided",
          message: String(row[4] || ""),
          ipAddress: String(row[5] || "Unknown"),
          status: status,
          googleSynced: true,
          createdAt: new Date().toISOString()
        });
      }
    }
    return ContentService.createTextOutput(JSON.stringify({
      status: "active",
      account: "bijoysarkar7252@gmail.com",
      total: messages.length,
      messages: messages
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      error: err.toString(),
      messages: []
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = {};
    if (e && e.postData && e.postData.contents) {
      try { data = JSON.parse(e.postData.contents); } catch (pErr) { data = {}; }
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    // Auto-create header row if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Timestamp (IST)", "Name", "Email", "Phone", "Message", "IP Address", "Status"]);
      sheet.getRange("A1:G1").setFontWeight("bold").setBackground("#ff5e2c").setFontColor("#ffffff");
    }

    // 1. Handle Status Update (Mark Read, Replied, Archive, etc.)
    if (data.action === "update_status" && data.id) {
      var rowIdx = -1;
      var match = data.id.match(/sheet-row-(\\d+)/);
      if (match) {
        rowIdx = parseInt(match[1], 10);
      }
      if (rowIdx > 1 && rowIdx <= sheet.getLastRow()) {
        sheet.getRange(rowIdx, 7).setValue(data.status || "READ");
        autoResizeAndFormat(sheet);
        return ContentService.createTextOutput(JSON.stringify({
          status: "success",
          action: "update_status",
          row: rowIdx,
          newStatus: data.status
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    // 2. Format phone to prevent formula parsing
    var rawPhone = data.rawPhone || data.phone || "Not provided";
    var phone = rawPhone;
    if (phone && phone.toString().indexOf("+") === 0) {
      phone = "'" + phone;
    }

    // 3. Timestamp in Indian Standard Time (IST) with full day name
    var timestamp = data.timestampIST || getFormattedISTWithDay(new Date());

    // 4. Append row
    sheet.appendRow([
      timestamp,
      data.name || "",
      data.email || "",
      phone,
      data.message || "",
      data.ipAddress || "Unknown",
      "UNREAD"
    ]);

    // 5. Automatically resize all columns to fit the new text perfectly
    autoResizeAndFormat(sheet);

    // 6. Send instant alert email to Gmail
    MailApp.sendEmail({
      to: "bijoysarkar7252@gmail.com",
      subject: "New Portfolio Inquiry from " + (data.name || "Visitor"),
      replyTo: data.email || "bijoysarkar7252@gmail.com",
      body: "New message received on " + timestamp + "\\n\\n" +
            "Name: " + (data.name || "N/A") + "\\n" +
            "Email: " + (data.email || "N/A") + "\\n" +
            "Phone: " + (data.rawPhone || data.phone || "Not provided") + "\\n\\n" +
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
{`/**
 * Bijoy Sarkar Portfolio — Google Sheets & Gmail Webhook Engine v2.2
 */

function onOpen() {
  try {
    var ui = SpreadsheetApp.getUi();
    ui.createMenu("Portfolio Tools")
      .addItem("Auto-Resize Columns & Format", "manualFormatAndResize")
      .addItem("Add Day Names to Existing Timestamps", "addDayNamesToExistingRows")
      .addToUi();
  } catch (e) {}

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  autoResizeAndFormat(sheet);
}

function manualFormatAndResize() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  autoResizeAndFormat(sheet);
}

function autoResizeAndFormat(sheet) {
  try {
    if (!sheet) sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    if (sheet.getLastRow() >= 1) {
      sheet.getRange("A1:G1").setFontWeight("bold").setBackground("#ff5e2c").setFontColor("#ffffff").setHorizontalAlignment("center");
    }
    sheet.autoResizeColumns(1, 7);
    if (sheet.getColumnWidth(1) < 260) sheet.setColumnWidth(1, 270);
  } catch (e) {}
}

function getFormattedISTWithDay(date) {
  var d = date || new Date();
  var dayStr = Utilities.formatDate(d, "Asia/Kolkata", "EEEE, dd MMM yyyy, hh:mm:ss a");
  var parts = dayStr.split(", ");
  if (parts.length >= 2) {
    var timePart = parts[1].replace(/\\b(AM|PM)\\b/i, function(m) { return m.toLowerCase(); });
    return parts[0] + ", " + timePart + " IST";
  }
  return dayStr + " IST";
}

function addDayNamesToExistingRows() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;
  var range = sheet.getRange(2, 1, lastRow - 1, 1);
  var values = range.getValues();
  var changed = false;
  for (var i = 0; i < values.length; i++) {
    var val = values[i][0];
    if (!val) continue;
    var str = String(val).trim();
    if (!/^(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)/i.test(str)) {
      var d = new Date(str.replace(/IST$/i, "").trim());
      if (isNaN(d.getTime())) {
        var dmy = str.match(/^(\\d{1,2})[\\/\\-](\\d{1,2})[\\/\\-](\\d{4})(.*)$/);
        if (dmy) d = new Date(dmy[2] + "/" + dmy[1] + "/" + dmy[3] + (dmy[4] || ""));
      }
      if (!isNaN(d.getTime())) {
        values[i][0] = getFormattedISTWithDay(d);
        changed = true;
      }
    }
  }
  if (changed) range.setValues(values);
  autoResizeAndFormat(sheet);
}

function doGet(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    autoResizeAndFormat(sheet);
    var data = sheet.getDataRange().getValues();
    var messages = [];
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (row && (row[0] || row[1] || row[2] || row[4])) {
        var status = (row[6] && row[6].toString().trim()) ? row[6].toString().trim().toUpperCase() : "UNREAD";
        messages.push({
          id: "sheet-row-" + (i + 1),
          submittedAtIST: String(row[0] || ""),
          name: String(row[1] || ""),
          email: String(row[2] || ""),
          phone: String(row[3] || "Not provided").replace(/^'/, ""),
          message: String(row[4] || ""),
          ipAddress: String(row[5] || "Unknown"),
          status: status,
          googleSynced: true,
          createdAt: new Date().toISOString()
        });
      }
    }
    return ContentService.createTextOutput(JSON.stringify({
      status: "active",
      account: "bijoysarkar7252@gmail.com",
      total: messages.length,
      messages: messages
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      error: err.toString(),
      messages: []
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = {};
    if (e && e.postData && e.postData.contents) {
      try { data = JSON.parse(e.postData.contents); } catch (pErr) { data = {}; }
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Timestamp (IST)", "Name", "Email", "Phone", "Message", "IP Address", "Status"]);
      sheet.getRange("A1:G1").setFontWeight("bold").setBackground("#ff5e2c").setFontColor("#ffffff");
    }

    if (data.action === "update_status" && data.id) {
      var rowIdx = -1;
      var match = data.id.match(/sheet-row-(\\d+)/);
      if (match) rowIdx = parseInt(match[1], 10);
      if (rowIdx > 1 && rowIdx <= sheet.getLastRow()) {
        sheet.getRange(rowIdx, 7).setValue(data.status || "READ");
        autoResizeAndFormat(sheet);
        return ContentService.createTextOutput(JSON.stringify({ status: "success", newStatus: data.status })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    var phone = data.rawPhone || data.phone || "Not provided";
    if (phone && phone.toString().indexOf("+") === 0) phone = "'" + phone;
    var timestamp = data.timestampIST || getFormattedISTWithDay(new Date());

    sheet.appendRow([timestamp, data.name || "", data.email || "", phone, data.message || "", data.ipAddress || "Unknown", "UNREAD"]);
    autoResizeAndFormat(sheet);

    MailApp.sendEmail({
      to: "bijoysarkar7252@gmail.com",
      subject: "New Portfolio Inquiry from " + (data.name || "Visitor"),
      replyTo: data.email || "bijoysarkar7252@gmail.com",
      body: "New message received on " + timestamp + "\\n\\nName: " + (data.name || "N/A") + "\\nEmail: " + (data.email || "N/A") + "\\nPhone: " + (data.rawPhone || data.phone || "Not provided") + "\\n\\nMessage:\\n" + (data.message || "")
    });

    return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
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
