"use client";

import { useState } from "react";
import { Download, Search, Filter, ShieldCheck, Database, Calendar, User, Undo2, Check } from "lucide-react";
import { formatIndianTime } from "@/lib/ist-date";
import { parseAuditChanges } from "@/lib/audit-diff";
import { useRouter } from "next/navigation";

export interface AuditItem {
  id: string;
  entity: string;
  entityId: string;
  action: string;
  changes: Record<string, unknown> | string;
  adminId: string;
  adminName: string;
  rawTimestamp: string;
  indianTime: string;
}

export function AuditLogViewer({ initialLogs }: { initialLogs: AuditItem[] }) {
  const router = useRouter();
  const [logs, setLogs] = useState<AuditItem[]>(initialLogs);
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("ALL");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [loadingUndoId, setLoadingUndoId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const filtered = logs.filter((log) => {
    if (entityFilter !== "ALL" && log.entity !== entityFilter) return false;
    if (actionFilter !== "ALL" && log.action !== actionFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchAdmin = log.adminName.toLowerCase().includes(q);
      const matchEntity = log.entity.toLowerCase().includes(q);
      const matchAction = log.action.toLowerCase().includes(q);
      const matchChanges = JSON.stringify(log.changes).toLowerCase().includes(q);
      const matchTime = log.indianTime.toLowerCase().includes(q);
      return matchAdmin || matchEntity || matchAction || matchChanges || matchTime;
    }
    return true;
  });

  async function handleUndo(auditLogId: string) {
    if (!window.confirm("Are you sure you want to revert this administrative action?")) return;
    setLoadingUndoId(auditLogId);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/undo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auditLogId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Undo failed.");

      setMessage({ text: `↩ Success: ${data.message}`, type: "success" });

      // Refresh log data
      const refreshRes = await fetch("/api/admin/audit-logs");
      const refreshData = await refreshRes.json();
      if (refreshData.logs) {
        setLogs(
          refreshData.logs.map((l: any) => ({
            id: l.id,
            entity: l.entity,
            entityId: l.entityId,
            action: l.action,
            changes: typeof l.changes === "string" ? JSON.parse(l.changes || "{}") : l.changes,
            adminId: l.adminId,
            adminName: l.adminName,
            rawTimestamp: l.timestamp,
            indianTime: formatIndianTime(l.timestamp),
          }))
        );
      }
      router.refresh();
    } catch (err: unknown) {
      setMessage({ text: err instanceof Error ? err.message : "Error executing undo.", type: "error" });
    } finally {
      setLoadingUndoId(null);
    }
  }

  function downloadJson() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filtered, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `portfolio_audit_dataset_ist_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  function getActionBadgeClass(action: string) {
    switch (action.toUpperCase()) {
      case "CREATE":
      case "INITIAL_SEED":
        return "badge-create";
      case "UPDATE":
      case "ACTIVATE":
        return "badge-update";
      case "DELETE":
      case "DEACTIVATE":
        return "badge-delete";
      case "UPLOAD":
        return "badge-upload";
      default:
        return "badge-default";
    }
  }

  return (
    <div className="admin-crud-panel">
      {message && (
        <div className={message.type === "success" ? "admin-success" : "admin-alert"} role="status">
          {message.text}
        </div>
      )}

      <div className="admin-crud-header">
        <div>
          <h2>System Activity &amp; Audit Dataset ({filtered.length} entries)</h2>
          <p className="admin-form-help">
            Chronological audit trail tracking all administrative modifications. Every timestamp is recorded with exact Indian Standard Time (IST - Asia/Kolkata). Any action can be reversed via the Undo option.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <a className="button button-secondary" href="/api/admin/audit-logs?format=csv" download>
            <Download size={13} /> Export CSV
          </a>
          <button className="button" type="button" onClick={downloadJson}>
            <Database size={13} /> Export JSON Dataset
          </button>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="admin-audit-filters">
        <div className="admin-search-input-wrap">
          <Search size={14} className="muted" />
          <input
            placeholder="Search activity by admin, action, changes, or date..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="admin-filter-group">
          <Filter size={13} className="muted" />
          <select value={entityFilter} onChange={(e) => setEntityFilter(e.target.value)}>
            <option value="ALL">All Entities</option>
            <option value="PROJECT">Projects</option>
            <option value="WORK_EXPERIENCE">Work Experience</option>
            <option value="SKILL_GROUP">Skills &amp; Languages</option>
            <option value="RESUME">CV / Resume</option>
            <option value="SETTINGS">Site Settings</option>
            <option value="SYSTEM">System</option>
          </select>

          <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
            <option value="ALL">All Actions</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="UPLOAD">UPLOAD</option>
            <option value="ACTIVATE">ACTIVATE</option>
            <option value="DEACTIVATE">DEACTIVATE</option>
          </select>
        </div>
      </div>

      {/* Dataset table (desktop) */}
      <div className="admin-table-wrap admin-audit-table-desktop">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Action</th>
              <th>Entity</th>
              <th>Indian Time (IST)</th>
              <th>Admin Operator</th>
              <th>Modification Details / Dataset Diff</th>
              <th>Revert / Undo</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((log) => {
              const canUndo = log.action !== "INITIAL_SEED" && log.action !== "LOGIN" && !log.changes?.toString().includes("UNDO:");
              return (
                <tr key={log.id}>
                  <td>
                    <span className={`admin-action-badge ${getActionBadgeClass(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td>
                    <strong style={{ color: "var(--soft-white)", fontSize: 11 }}>{log.entity}</strong>
                    <small style={{ display: "block", color: "var(--subtle)", fontSize: 9 }}>ID: {log.entityId.slice(0, 12)}...</small>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--orange)", fontSize: 11 }}>
                      <Calendar size={12} />
                      <span>{log.indianTime}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--silver)", fontSize: 11 }}>
                      <User size={12} />
                      <span>{log.adminName}</span>
                    </div>
                  </td>
                  <td style={{ minWidth: 280, maxWidth: 420, whiteSpace: "normal" }}>
                    {(() => {
                      const audit = parseAuditChanges(log.changes, log.action, log.entity);
                      return (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          <p style={{ margin: 0, fontSize: 12, color: "var(--white)", fontWeight: 600, lineHeight: 1.4 }}>
                            {audit.summary}
                          </p>

                          {audit.diffs.length > 0 ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                              {audit.diffs.map((d) => (
                                <div
                                  key={d.field}
                                  style={{
                                    fontSize: 11,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    background: "rgba(255, 255, 255, 0.03)",
                                    padding: "4px 8px",
                                    borderRadius: 6,
                                    border: "1px solid rgba(255, 255, 255, 0.06)",
                                    flexWrap: "wrap",
                                  }}
                                >
                                  <strong style={{ color: "var(--silver)" }}>{d.label}:</strong>
                                  <span style={{ color: "#f87171", textDecoration: "line-through" }}>{d.from}</span>
                                  <span style={{ color: "var(--subtle)" }}>→</span>
                                  <span style={{ color: "#4ade80", fontWeight: 600 }}>{d.to}</span>
                                </div>
                              ))}
                            </div>
                          ) : null}

                          {audit.rawText && audit.rawText.length > 3 && (
                            <details style={{ marginTop: 2 }}>
                              <summary style={{ fontSize: 10, color: "var(--subtle)", cursor: "pointer", textDecoration: "underline" }}>
                                Raw Data
                              </summary>
                              <pre className="admin-changes-pre" style={{ marginTop: 4, maxHeight: 150, overflowY: "auto", fontSize: 10 }}>
                                {audit.rawText}
                              </pre>
                            </details>
                          )}
                        </div>
                      );
                    })()}
                  </td>
                  <td>
                    {canUndo ? (
                      <button
                        type="button"
                        className="admin-small-button"
                        onClick={() => handleUndo(log.id)}
                        disabled={loadingUndoId === log.id}
                        title="Revert this modification"
                        style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
                      >
                        <Undo2 size={11} /> {loadingUndoId === log.id ? "Undoing..." : "Undo"}
                      </button>
                    ) : (
                      <span style={{ color: "var(--subtle)", fontSize: 10 }}>—</span>
                    )}
                  </td>
                </tr>
              );
            })}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: 36 }}>
                  <p className="muted">No activity records match your current filters.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile-Friendly Audit Activity Cards (Hidden on Desktop, Visible on Phone/Tablet) */}
      <div className="admin-audit-mobile-list">
        {filtered.map((log) => {
          const canUndo = log.action !== "INITIAL_SEED" && log.action !== "LOGIN" && !log.changes?.toString().includes("UNDO:");
          const audit = parseAuditChanges(log.changes, log.action, log.entity);
          return (
            <div key={`mobile-${log.id}`} className="admin-audit-mobile-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span className={`admin-action-badge ${getActionBadgeClass(log.action)}`}>
                    {log.action}
                  </span>
                  <strong style={{ color: "var(--white)", fontSize: 13 }}>{log.entity}</strong>
                </div>
                {canUndo && (
                  <button
                    type="button"
                    className="admin-small-button"
                    onClick={() => handleUndo(log.id)}
                    disabled={loadingUndoId === log.id}
                    title="Revert this modification"
                    style={{ display: "inline-flex", alignItems: "center", gap: 4, flexShrink: 0 }}
                  >
                    <Undo2 size={11} /> {loadingUndoId === log.id ? "Undoing..." : "Undo"}
                  </button>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--subtle)", marginTop: 2 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <User size={12} />
                  <span>{log.adminName}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--orange)" }}>
                  <Calendar size={12} />
                  <span>{log.indianTime}</span>
                </div>
              </div>

              <div style={{ padding: "8px 10px", background: "rgba(255, 255, 255, 0.02)", borderRadius: 8, border: "1px solid var(--line)" }}>
                <p style={{ margin: 0, fontSize: 12, color: "var(--silver)", fontWeight: 500, lineHeight: 1.5 }}>
                  {audit.summary}
                </p>

                {audit.diffs.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                    {audit.diffs.map((d) => (
                      <div
                        key={d.field}
                        style={{
                          fontSize: 11,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          background: "rgba(255, 255, 255, 0.04)",
                          padding: "4px 8px",
                          borderRadius: 6,
                          flexWrap: "wrap",
                        }}
                      >
                        <strong style={{ color: "var(--muted)" }}>{d.label}:</strong>
                        <span style={{ color: "#f87171", textDecoration: "line-through" }}>{d.from}</span>
                        <span style={{ color: "var(--subtle)" }}>→</span>
                        <span style={{ color: "#4ade80", fontWeight: 600 }}>{d.to}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="empty-state" style={{ padding: 24 }}>
            <p className="muted">No activity records match your current filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
