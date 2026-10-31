"use client";

import { useState } from "react";
import { Plus, Trash2, Edit3, Briefcase, Calendar, Building, Tag, Check, X, Undo2 } from "lucide-react";
import { useRouter } from "next/navigation";

export interface ExperienceItem {
  id: string;
  period: string;
  role: string;
  organization: string;
  summary: string;
  tags: string[];
  sortOrder: number;
}

export function ExperienceManager({ initialExperiences }: { initialExperiences: ExperienceItem[] }) {
  const router = useRouter();
  const [experiences, setExperiences] = useState<ExperienceItem[]>(initialExperiences);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastAuditId, setLastAuditId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error"; canUndo?: boolean } | null>(null);

  async function handleUndo() {
    if (!lastAuditId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/undo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auditLogId: lastAuditId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Undo failed.");

      setMessage({ text: `↩ Undone: ${data.message}`, type: "success" });
      setLastAuditId(null);

      const freshRes = await fetch("/api/admin/experiences");
      const freshData = await freshRes.json();
      if (freshData.experiences) setExperiences(freshData.experiences);
      router.refresh();
    } catch (err: unknown) {
      setMessage({ text: err instanceof Error ? err.message : "Failed to undo action.", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  // Form fields
  const [role, setRole] = useState("");
  const [organization, setOrganization] = useState("");
  const [period, setPeriod] = useState("");
  const [summary, setSummary] = useState("");
  const [tagsStr, setTagsStr] = useState("");
  const [sortOrder, setSortOrder] = useState(0);

  function resetForm() {
    setRole("");
    setOrganization("");
    setPeriod("");
    setSummary("");
    setTagsStr("");
    setSortOrder(0);
    setEditingId(null);
    setIsCreating(false);
  }

  function startEdit(exp: ExperienceItem) {
    setIsCreating(false);
    setEditingId(exp.id);
    setRole(exp.role);
    setOrganization(exp.organization);
    setPeriod(exp.period);
    setSummary(exp.summary);
    setTagsStr(Array.isArray(exp.tags) ? exp.tags.join(", ") : "");
    setSortOrder(exp.sortOrder);
  }

  function startCreate() {
    resetForm();
    setIsCreating(true);
    setSortOrder(experiences.length + 1);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const tags = tagsStr
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = { role, organization, period, summary, tags, sortOrder: Number(sortOrder) };

    try {
      const url = editingId ? `/api/admin/experiences/${editingId}` : "/api/admin/experiences";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save work experience.");

      setLastAuditId(data.auditLogId || null);

      if (editingId) {
        setExperiences((prev) =>
          prev.map((item) => (item.id === editingId ? data.experience : item)).sort((a, b) => a.sortOrder - b.sortOrder)
        );
        setMessage({
          text: `Updated "${role}" at ${organization} successfully! Recorded in audit log.`,
          type: "success",
          canUndo: Boolean(data.auditLogId),
        });
      } else {
        setExperiences((prev) => [...prev, data.experience].sort((a, b) => a.sortOrder - b.sortOrder));
        setMessage({
          text: `Created "${role}" at ${organization} successfully! Recorded in audit log.`,
          type: "success",
          canUndo: Boolean(data.auditLogId),
        });
      }

      resetForm();
      router.refresh();
    } catch (err: unknown) {
      setMessage({ text: err instanceof Error ? err.message : "Error saving experience.", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, roleName: string, orgName: string) {
    if (!window.confirm(`Are you sure you want to remove "${roleName}" at ${orgName}?`)) return;

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/experiences/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete experience.");

      setLastAuditId(data.auditLogId || null);
      setExperiences((prev) => prev.filter((item) => item.id !== id));
      setMessage({
        text: `Deleted "${roleName}" at ${orgName}. Recorded in audit log.`,
        type: "success",
        canUndo: Boolean(data.auditLogId),
      });
      if (editingId === id) resetForm();
      router.refresh();
    } catch (err: unknown) {
      setMessage({ text: err instanceof Error ? err.message : "Error deleting experience.", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-crud-panel">
      {message && (
        <div className={message.type === "success" ? "admin-success" : "admin-alert"} role="status" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{message.text}</span>
          {message.canUndo && lastAuditId && (
            <button
              type="button"
              onClick={handleUndo}
              disabled={loading}
              className="admin-small-button"
              style={{ background: "rgba(255, 94, 44, 0.2)", border: "1px solid var(--orange)", color: "var(--white)", fontWeight: 700 }}
            >
              <Undo2 size={12} /> Undo this change
            </button>
          )}
        </div>
      )}

      {/* Top action row */}
      <div className="admin-crud-header">
        <div>
          <h2>Work Experiences ({experiences.length})</h2>
          <p className="admin-form-help">Manage internships and roles. All edits save with Indian Time (IST) audit logs.</p>
        </div>
        {!isCreating && !editingId && (
          <button className="button" type="button" onClick={startCreate}>
            <Plus size={14} /> Add Experience
          </button>
        )}
      </div>

      {/* Form modal/card when creating or editing */}
      {(isCreating || editingId) && (
        <form className="admin-card admin-form-box" onSubmit={handleSubmit}>
          <div className="admin-form-header">
            <h3>{editingId ? "Edit Work Experience" : "Add New Work Experience"}</h3>
            <button className="admin-small-button" type="button" onClick={resetForm}>
              <X size={13} /> Cancel
            </button>
          </div>

          <div className="admin-form-grid">
            <div className="field">
              <label htmlFor="exp-role">Role Title *</label>
              <input
                id="exp-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
                placeholder="e.g. AI/ML Intern, Full-Stack Developer"
              />
            </div>

            <div className="field">
              <label htmlFor="exp-org">Organization / Company *</label>
              <input
                id="exp-org"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                required
                placeholder="e.g. STQC Directorate, NIT Silchar"
              />
            </div>

            <div className="field">
              <label htmlFor="exp-period">Time Period *</label>
              <input
                id="exp-period"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                required
                placeholder="e.g. Jun — Jul 2026, Jan 2025 — Present"
              />
            </div>

            <div className="field">
              <label htmlFor="exp-order">Display Order</label>
              <input
                id="exp-order"
                type="number"
                min="0"
                max="999"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
              />
            </div>

            <div className="field full-width">
              <label htmlFor="exp-summary">Description / Key Responsibilities *</label>
              <textarea
                id="exp-summary"
                rows={3}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                required
                placeholder="Summarize key tasks, frameworks used, deliverables achieved..."
              />
            </div>

            <div className="field full-width">
              <label htmlFor="exp-tags">Technologies &amp; Skill Tags (comma separated)</label>
              <input
                id="exp-tags"
                value={tagsStr}
                onChange={(e) => setTagsStr(e.target.value)}
                placeholder="AI Security, OWASP, Python, Docker"
              />
              <span className="field-counter">Separated by commas</span>
            </div>
          </div>

          <div className="form-bottom">
            <button className="admin-small-button" type="button" onClick={resetForm}>
              Cancel
            </button>
            <button className="button" type="submit" disabled={loading}>
              {loading ? "Saving..." : editingId ? "Save Changes" : "Create Experience"}
              <Check size={14} />
            </button>
          </div>
        </form>
      )}

      {/* Experience list table */}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Role &amp; Organization</th>
              <th>Period</th>
              <th>Summary</th>
              <th>Tags</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {experiences.map((exp) => (
              <tr key={exp.id}>
                <td><strong>#{exp.sortOrder}</strong></td>
                <td>
                  <div className="admin-cell-title">
                    <strong className="accent-text">{exp.role}</strong>
                    <span className="table-subtitle"><Building size={11} style={{ display: "inline", marginRight: 4 }} />{exp.organization}</span>
                  </div>
                </td>
                <td><span className="admin-date-badge"><Calendar size={11} /> {exp.period}</span></td>
                <td style={{ maxWidth: 300, whiteSpace: "normal" }}>
                  <p className="admin-table-p">{exp.summary}</p>
                </td>
                <td>
                  <div className="tag-list">
                    {(exp.tags || []).map((t, idx) => (
                      <span key={idx} className="tag">{t}</span>
                    ))}
                  </div>
                </td>
                <td>
                  <div className="admin-actions">
                    <button
                      className="admin-small-button"
                      type="button"
                      onClick={() => startEdit(exp)}
                      title="Edit this experience"
                    >
                      <Edit3 size={13} /> Edit
                    </button>
                    <button
                      className="admin-small-button danger"
                      type="button"
                      onClick={() => handleDelete(exp.id, exp.role, exp.organization)}
                      title="Delete this experience"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {experiences.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: 32 }}>
                  <p className="muted">No work experiences found. Click "Add Experience" to create one.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
