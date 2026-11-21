"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Plus, Trash2, Edit3, Briefcase, Calendar, Building, Tag, Check, X, Undo2, Search } from "lucide-react";
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

  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const suggestions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return [];
    const list: { type: "role" | "org" | "skill" | "period"; title: string; subtitle: string; value: string }[] = [];
    const seen = new Set<string>();

    for (const exp of experiences) {
      if (exp.role.toLowerCase().includes(q)) {
        const key = `role-${exp.role}`;
        if (!seen.has(key)) {
          seen.add(key);
          list.push({ type: "role", title: exp.role, subtitle: `${exp.organization} (${exp.period})`, value: exp.role });
        }
      }
      if (exp.organization.toLowerCase().includes(q)) {
        const key = `org-${exp.organization}`;
        if (!seen.has(key)) {
          seen.add(key);
          list.push({ type: "org", title: exp.organization, subtitle: exp.role, value: exp.organization });
        }
      }
      if (Array.isArray(exp.tags)) {
        for (const tag of exp.tags) {
          if (tag.toLowerCase().includes(q)) {
            const key = `tag-${tag}`;
            if (!seen.has(key)) {
              seen.add(key);
              list.push({ type: "skill", title: tag, subtitle: `Used at ${exp.organization}`, value: tag });
            }
          }
        }
      }
      if (exp.period.toLowerCase().includes(q)) {
        const key = `period-${exp.period}`;
        if (!seen.has(key)) {
          seen.add(key);
          list.push({ type: "period", title: exp.period, subtitle: `${exp.role} at ${exp.organization}`, value: exp.period });
        }
      }
      if (list.length >= 8) break;
    }
    return list;
  }, [experiences, searchQuery]);

  const filteredExperiences = useMemo(() => {
    if (!searchQuery.trim()) return experiences;
    const q = searchQuery.toLowerCase().trim();
    return experiences.filter((exp) => {
      const matchRole = exp.role.toLowerCase().includes(q);
      const matchOrg = exp.organization.toLowerCase().includes(q);
      const matchPeriod = exp.period.toLowerCase().includes(q);
      const matchSummary = exp.summary.toLowerCase().includes(q);
      const matchTags = Array.isArray(exp.tags) && exp.tags.some((t) => t.toLowerCase().includes(q));
      return matchRole || matchOrg || matchPeriod || matchSummary || matchTags;
    });
  }, [experiences, searchQuery]);

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

      {/* Experience Search Bar with Live Suggestions */}
      <div className="admin-search-container" ref={searchContainerRef} style={{ marginTop: 6, marginBottom: 16 }}>
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
            placeholder="Search experience by role, company, skills, or period..."
            aria-label="Search work experiences"
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
              {filteredExperiences.length} {filteredExperiences.length === 1 ? "match" : "matches"}
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
                  {sug.type === "role" && <Briefcase size={13} style={{ color: "var(--orange)", flexShrink: 0 }} />}
                  {sug.type === "org" && <Building size={13} style={{ color: "#38bdf8", flexShrink: 0 }} />}
                  {sug.type === "skill" && <Tag size={13} style={{ color: "#4ade80", flexShrink: 0 }} />}
                  {sug.type === "period" && <Calendar size={13} style={{ color: "#a78bfa", flexShrink: 0 }} />}
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
            {filteredExperiences.map((exp) => (
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
            {filteredExperiences.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: 32 }}>
                  <p className="muted">
                    {searchQuery ? `No work experiences found matching "${searchQuery}".` : "No work experiences found. Click \"Add Experience\" to create one."}
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
