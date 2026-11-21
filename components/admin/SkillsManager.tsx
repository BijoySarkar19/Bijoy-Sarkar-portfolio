"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Plus, Trash2, Edit3, Check, X, Layers, Code2, BrainCircuit, Terminal, Smartphone, Database, Fingerprint, Languages, Undo2, Search } from "lucide-react";
import { useRouter } from "next/navigation";

export interface SkillGroupItem {
  id: string;
  title: string;
  note: string;
  icon: string;
  skills: string[];
  sortOrder: number;
}

const AVAILABLE_ICONS = [
  { name: "Code2", label: "Programming (Code2)" },
  { name: "BrainCircuit", label: "AI / ML (BrainCircuit)" },
  { name: "Terminal", label: "Web / Tools (Terminal)" },
  { name: "Smartphone", label: "Mobile (Smartphone)" },
  { name: "Database", label: "Data / DB (Database)" },
  { name: "Fingerprint", label: "Security (Fingerprint)" },
  { name: "Languages", label: "Spoken Languages (Languages)" },
  { name: "Layers", label: "General Stack (Layers)" },
];

export function SkillsManager({ initialGroups }: { initialGroups: SkillGroupItem[] }) {
  const router = useRouter();
  const [groups, setGroups] = useState<SkillGroupItem[]>(initialGroups);
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
    const list: { type: "category" | "skill"; title: string; subtitle: string; value: string }[] = [];
    const seen = new Set<string>();

    for (const g of groups) {
      if (g.title.toLowerCase().includes(q)) {
        const key = `cat-${g.title}`;
        if (!seen.has(key)) {
          seen.add(key);
          list.push({ type: "category", title: g.title, subtitle: `${g.skills.length} skills · ${g.note}`, value: g.title });
        }
      }
      if (Array.isArray(g.skills)) {
        for (const s of g.skills) {
          if (s.toLowerCase().includes(q)) {
            const key = `skill-${s}`;
            if (!seen.has(key)) {
              seen.add(key);
              list.push({ type: "skill", title: s, subtitle: `In ${g.title}`, value: s });
            }
          }
        }
      }
      if (list.length >= 8) break;
    }
    return list;
  }, [groups, searchQuery]);

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groups;
    const q = searchQuery.toLowerCase().trim();
    return groups.filter((g) => {
      const matchTitle = g.title.toLowerCase().includes(q);
      const matchNote = g.note.toLowerCase().includes(q);
      const matchSkill = Array.isArray(g.skills) && g.skills.some((s) => s.toLowerCase().includes(q));
      return matchTitle || matchNote || matchSkill;
    });
  }, [groups, searchQuery]);

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

      const freshRes = await fetch("/api/admin/skills");
      const freshData = await freshRes.json();
      if (freshData.skillGroups) setGroups(freshData.skillGroups);
      router.refresh();
    } catch (err: unknown) {
      setMessage({ text: err instanceof Error ? err.message : "Failed to undo action.", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  // Form fields
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [icon, setIcon] = useState("Code2");
  const [skillsStr, setSkillsStr] = useState("");
  const [sortOrder, setSortOrder] = useState(0);

  function resetForm() {
    setTitle("");
    setNote("");
    setIcon("Code2");
    setSkillsStr("");
    setSortOrder(0);
    setEditingId(null);
    setIsCreating(false);
  }

  function startEdit(group: SkillGroupItem) {
    setIsCreating(false);
    setEditingId(group.id);
    setTitle(group.title);
    setNote(group.note);
    setIcon(group.icon || "Code2");
    setSkillsStr(Array.isArray(group.skills) ? group.skills.join(", ") : "");
    setSortOrder(group.sortOrder);
  }

  function startCreate() {
    resetForm();
    setIsCreating(true);
    setSortOrder(groups.length + 1);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const skills = skillsStr
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (skills.length === 0) {
      setMessage({ text: "Please enter at least one skill or language.", type: "error" });
      setLoading(false);
      return;
    }

    const payload = { title, note, icon, skills, sortOrder: Number(sortOrder) };

    try {
      const url = editingId ? `/api/admin/skills/${editingId}` : "/api/admin/skills";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save skill group.");

      setLastAuditId(data.auditLogId || null);

      if (editingId) {
        setGroups((prev) =>
          prev.map((item) => (item.id === editingId ? data.skillGroup : item)).sort((a, b) => a.sortOrder - b.sortOrder)
        );
        setMessage({
          text: `Updated "${title}" category with ${skills.length} skills. Logged with Indian Time!`,
          type: "success",
          canUndo: Boolean(data.auditLogId),
        });
      } else {
        setGroups((prev) => [...prev, data.skillGroup].sort((a, b) => a.sortOrder - b.sortOrder));
        setMessage({
          text: `Created "${title}" category with ${skills.length} skills. Logged with Indian Time!`,
          type: "success",
          canUndo: Boolean(data.auditLogId),
        });
      }

      resetForm();
      router.refresh();
    } catch (err: unknown) {
      setMessage({ text: err instanceof Error ? err.message : "Error saving skills.", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, groupTitle: string) {
    if (!window.confirm(`Delete the "${groupTitle}" skills category?`)) return;

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/skills/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete category.");

      setLastAuditId(data.auditLogId || null);
      setGroups((prev) => prev.filter((item) => item.id !== id));
      setMessage({
        text: `Deleted "${groupTitle}" category. Recorded in audit log.`,
        type: "success",
        canUndo: Boolean(data.auditLogId),
      });
      if (editingId === id) resetForm();
      router.refresh();
    } catch (err: unknown) {
      setMessage({ text: err instanceof Error ? err.message : "Error deleting category.", type: "error" });
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

      {/* Header */}
      <div className="admin-crud-header">
        <div>
          <h2>Skills &amp; Languages Categories ({groups.length})</h2>
          <p className="admin-form-help">Manage technical tools, frameworks, and spoken languages with full CRUD &amp; IST audit tracking.</p>
        </div>
        {!isCreating && !editingId && (
          <button className="button" type="button" onClick={startCreate}>
            <Plus size={14} /> Add Category
          </button>
        )}
      </div>

      {/* Skills Search Bar with Live Suggestions */}
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
            placeholder="Search skills by tool name, language, or category..."
            aria-label="Search skills and languages"
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
              {filteredGroups.length} {filteredGroups.length === 1 ? "category" : "categories"}
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
                  {sug.type === "category" ? (
                    <Layers size={13} style={{ color: "var(--orange)", flexShrink: 0 }} />
                  ) : (
                    <Code2 size={13} style={{ color: "#38bdf8", flexShrink: 0 }} />
                  )}
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

      {/* Form modal/card */}
      {(isCreating || editingId) && (
        <form className="admin-card admin-form-box" onSubmit={handleSubmit}>
          <div className="admin-form-header">
            <h3>{editingId ? "Edit Skill/Language Category" : "Add New Skill/Language Category"}</h3>
            <button className="admin-small-button" type="button" onClick={resetForm}>
              <X size={13} /> Cancel
            </button>
          </div>

          <div className="admin-form-grid">
            <div className="field">
              <label htmlFor="skill-title">Category Title *</label>
              <input
                id="skill-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="e.g. Programming, Spoken Languages, Cloud &amp; DevOps"
              />
            </div>

            <div className="field">
              <label htmlFor="skill-note">Sub-heading / Note *</label>
              <input
                id="skill-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                required
                placeholder="e.g. Languages &amp; fundamentals, Spoken languages"
              />
            </div>

            <div className="field">
              <label htmlFor="skill-icon">Icon Symbol</label>
              <select id="skill-icon" value={icon} onChange={(e) => setIcon(e.target.value)}>
                {AVAILABLE_ICONS.map((i) => (
                  <option key={i.name} value={i.name}>
                    {i.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="skill-order">Display Order</label>
              <input
                id="skill-order"
                type="number"
                min="0"
                max="999"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
              />
            </div>

            <div className="field full-width">
              <label htmlFor="skill-tags">Skills / Languages List (comma-separated) *</label>
              <textarea
                id="skill-tags"
                rows={3}
                value={skillsStr}
                onChange={(e) => setSkillsStr(e.target.value)}
                required
                placeholder="e.g. Python, C++, Java, JavaScript, Dart, SQL"
              />
              <span className="field-counter">Enter each item separated by commas.</span>
            </div>
          </div>

          <div className="form-bottom">
            <button className="admin-small-button" type="button" onClick={resetForm}>
              Cancel
            </button>
            <button className="button" type="submit" disabled={loading}>
              {loading ? "Saving..." : editingId ? "Save Changes" : "Create Category"}
              <Check size={14} />
            </button>
          </div>
        </form>
      )}

      {/* Grid of skill categories */}
      <div className="admin-skills-cards-grid">
        {filteredGroups.map((group) => (
          <div key={group.id} className="admin-skill-mgmt-card">
            <div className="admin-skill-mgmt-top">
              <div>
                <span className="admin-order-chip">#{group.sortOrder}</span>
                <h4>{group.title}</h4>
                <p className="admin-skill-note">{group.note}</p>
              </div>
              <div className="admin-actions">
                <button
                  className="admin-small-button"
                  type="button"
                  onClick={() => startEdit(group)}
                  title="Edit category"
                >
                  <Edit3 size={13} /> Edit
                </button>
                <button
                  className="admin-small-button danger"
                  type="button"
                  onClick={() => handleDelete(group.id, group.title)}
                  title="Delete category"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            <div className="admin-skill-tags-wrap">
              {(group.skills || []).map((skill, sIdx) => {
                const isSkillMatch = searchQuery.trim() && skill.toLowerCase().includes(searchQuery.toLowerCase().trim());
                return (
                  <span
                    key={sIdx}
                    className="skill-pill"
                    style={isSkillMatch ? { borderColor: "var(--orange)", background: "rgba(255, 94, 44, 0.2)", color: "#fff" } : undefined}
                  >
                    {skill}
                  </span>
                );
              })}
            </div>
          </div>
        ))}

        {filteredGroups.length === 0 && (
          <div className="empty-state full-width">
            <p className="muted">
              {searchQuery ? `No skill categories found matching "${searchQuery}".` : "No skill categories configured. Click \"Add Category\" above to create one."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
