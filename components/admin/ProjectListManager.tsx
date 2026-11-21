"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowUpRight, Pencil, Sparkles, Rocket, Star, Eye, EyeOff, RotateCcw, Plus, Search, X, FolderGit2 } from "lucide-react";
import { DeleteProjectButton } from "@/components/admin/DeleteProjectButton";

export interface AdminProjectItem {
  id: string;
  slug: string;
  title: string;
  published: boolean;
  isOngoing: boolean;
  featuredOnHome: boolean;
  sortOrder: number;
  githubUrl: string | null;
  liveUrl: string | null;
  updatedAt: string;
  image1?: string;
}

export function ProjectListManager({ initialProjects }: { initialProjects: AdminProjectItem[] }) {
  const [projects, setProjects] = useState<AdminProjectItem[]>(initialProjects);
  const [filter, setFilter] = useState<"all" | "finished" | "ongoing" | "home" | "drafts">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error"; auditLogId?: string } | null>(null);
  const [undoing, setUndoing] = useState(false);

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

  // Compute live project search suggestions
  const suggestions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return [];
    const list: { type: "title" | "slug" | "stage"; title: string; subtitle: string; value: string }[] = [];
    const seen = new Set<string>();

    for (const p of projects) {
      if (p.title.toLowerCase().includes(q)) {
        const key = `title-${p.title}`;
        if (!seen.has(key)) {
          seen.add(key);
          list.push({
            type: "title",
            title: p.title,
            subtitle: `/${p.slug} · ${p.isOngoing ? "⚡ Currently Working" : "Main Project"}`,
            value: p.title,
          });
        }
      }
      if (p.slug.toLowerCase().includes(q)) {
        const key = `slug-${p.slug}`;
        if (!seen.has(key)) {
          seen.add(key);
          list.push({
            type: "slug",
            title: `/${p.slug}`,
            subtitle: `${p.title}`,
            value: p.slug,
          });
        }
      }
      if (list.length >= 8) break;
    }
    return list;
  }, [projects, searchQuery]);

  // Project search filter helper
  const matchesSearch = (p: AdminProjectItem) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      p.title.toLowerCase().includes(q) ||
      p.slug.toLowerCase().includes(q) ||
      (p.githubUrl && p.githubUrl.toLowerCase().includes(q)) ||
      (p.liveUrl && p.liveUrl.toLowerCase().includes(q)) ||
      (p.isOngoing ? "currently working ongoing" : "main finished").includes(q) ||
      (p.published ? "published" : "draft").includes(q)
    );
  };

  // Strictly partition Finished Projects vs Currently Working Builds with search applied
  const allFinished = projects.filter((p) => !p.isOngoing);
  const allOngoing = projects.filter((p) => p.isOngoing);

  const finishedProjects = allFinished.filter(matchesSearch);
  const ongoingProjects = allOngoing.filter(matchesSearch);

  const homeMainCount = allFinished.filter((p) => p.featuredOnHome && p.published).length;
  const ongoingHomeCount = allOngoing.filter((p) => p.featuredOnHome && p.published).length;
  const draftsCount = projects.filter((p) => !p.published).length;
  const totalMatches = finishedProjects.length + ongoingProjects.length;

  async function handleToggle(id: string, action: "toggle_ongoing" | "toggle_featured_home" | "toggle_published" | "apply_ongoing_artwork") {
    // Client-side guard rails enforcing 5 main projects and 2 ongoing projects limits
    if (action === "toggle_featured_home") {
      const target = projects.find((p) => p.id === id);
      if (target && !target.featuredOnHome) {
        if (!target.isOngoing && homeMainCount >= 5) {
          setMessage({
            text: "Top 5 limit reached. Maximum 5 projects can be shown on the main page. Please remove a project from Top 5 first before adding another.",
            type: "error",
          });
          return;
        }
        if (target.isOngoing && ongoingHomeCount >= 2) {
          setMessage({
            text: "Limit reached. Only 2 currently working projects can be shown on the main page. Please remove one from the main page first before selecting another.",
            type: "error",
          });
          return;
        }
      }
    }

    setLoadingId(id);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/projects/${id}/toggle`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");

      setProjects((prev) =>
        prev.map((p) => {
          if (p.id !== id) return p;
          if (action === "toggle_ongoing") {
            const nextOngoing = !p.isOngoing;
            let image1 = p.image1;
            if (!nextOngoing && image1 && (image1.includes("ongoing-project-cover") || image1.includes("ongoing-coder"))) {
              image1 = "";
            }
            return { ...p, isOngoing: nextOngoing, image1 };
          }
          if (action === "toggle_featured_home") return { ...p, featuredOnHome: !p.featuredOnHome };
          if (action === "toggle_published") return { ...p, published: !p.published };
          if (action === "apply_ongoing_artwork") return { ...p, image1: "/images/ongoing-project-cover.webp" };
          return p;
        })
      );

      setMessage({ text: data.message, type: "success", auditLogId: data.auditLogId });
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : "Failed to perform action.", type: "error" });
    } finally {
      setLoadingId(null);
    }
  }

  async function handleUndo() {
    if (!message?.auditLogId) return;
    setUndoing(true);
    try {
      const res = await fetch("/api/admin/undo", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ auditLogId: message.auditLogId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Undo failed");

      window.location.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Undo failed");
      setUndoing(false);
    }
  }

  function renderTable(items: AdminProjectItem[], isOngoingGroup: boolean) {
    if (items.length === 0) {
      return (
        <div className="admin-card" style={{ padding: "20px 24px", textAlign: "center", color: "var(--muted)", fontSize: "12px", borderStyle: "dashed" }}>
          {isOngoingGroup ? "No currently working projects." : "No projects found in this category."}
        </div>
      );
    }

    return (
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: 55, textAlign: "center" }}>#</th>
              <th>Project</th>
              <th>Subsection / Stage</th>
              <th>Home Showcase</th>
              <th>Status</th>
              <th>Links</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((project, index) => {
              const isLoading = loadingId === project.id;
              return (
                <tr key={project.id}>
                  <td style={{ textAlign: "center" }}>
                    <span className={`admin-index-pill ${isOngoingGroup ? "is-ongoing" : ""}`}>
                      {isOngoingGroup ? `⚡ ${String(index + 1).padStart(2, "0")}` : String(index + 1).padStart(2, "0")}
                    </span>
                  </td>

                  <td>
                    <strong>{project.title}</strong>
                    <small className="table-subtitle">/{project.slug}</small>
                  </td>

                  {/* Ongoing / Currently Working vs Main Section */}
                  <td>
                    {project.isOngoing ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 5, alignItems: "flex-start" }}>
                        <span className="admin-tag-ongoing" title="Shown in 'Currently Working' subsection">
                          ⚡ Currently Working
                        </span>
                        <button
                          type="button"
                          className="admin-deploy-btn"
                          disabled={isLoading}
                          onClick={() => handleToggle(project.id, "toggle_ongoing")}
                          title="Complete and deploy to Main Projects section"
                        >
                          <Rocket size={11} /> Deploy to Main Projects
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 5, alignItems: "flex-start" }}>
                        <span className="admin-tag-main">✓ Main Project</span>
                        <button
                          type="button"
                          className="admin-set-ongoing-btn"
                          disabled={isLoading}
                          onClick={() => handleToggle(project.id, "toggle_ongoing")}
                          title="Move to 'Currently Working' subsection"
                        >
                          Mark as Ongoing
                        </button>
                      </div>
                    )}
                  </td>

                  {/* Featured in Home Top 5 / Ongoing Top 2 Toggle */}
                  <td>
                    <button
                      type="button"
                      className={`admin-home-toggle ${project.featuredOnHome ? "is-featured" : ""} ${project.isOngoing ? "is-ongoing" : ""}`}
                      disabled={isLoading}
                      onClick={() => handleToggle(project.id, "toggle_featured_home")}
                      title={
                        project.isOngoing
                          ? (project.featuredOnHome ? "Click to remove from Main Page (browse index only)" : "Click to feature on Main Page (max 2 currently working)")
                          : (project.featuredOnHome ? "Click to remove from Home Top 5 (browse index only)" : "Click to feature in Home Top 5 (max 5 main projects)")
                      }
                    >
                      {project.isOngoing ? (
                        <>
                          <Sparkles size={12} />
                          {project.featuredOnHome ? "In Home (Top 2)" : "Browse Index Only"}
                        </>
                      ) : (
                        <>
                          <Star size={12} fill={project.featuredOnHome ? "currentColor" : "none"} />
                          {project.featuredOnHome ? "In Home Top 5" : "Browse Index Only"}
                        </>
                      )}
                    </button>
                  </td>

                  {/* Published / Draft Toggle */}
                  <td>
                    <button
                      type="button"
                      className={`admin-state ${project.published ? "is-published" : ""}`}
                      disabled={isLoading}
                      onClick={() => handleToggle(project.id, "toggle_published")}
                      style={{ cursor: "pointer", border: 0 }}
                      title="Click to toggle publish status"
                    >
                      {project.published ? <Eye size={11} style={{ marginRight: 4 }} /> : <EyeOff size={11} style={{ marginRight: 4 }} />}
                      {project.published ? "Published" : "Draft"}
                    </button>
                  </td>

                  <td>{Number(Boolean(project.githubUrl)) + Number(Boolean(project.liveUrl))}/2</td>

                  <td>
                    <div className="admin-actions">
                      <Link className="admin-small-button" href={`/admin-admin/dashboard/projects/${project.id}`}>
                        <Pencil size={12} /> Edit
                      </Link>
                      <DeleteProjectButton id={project.id} title={project.title} />
                      {project.published ? (
                        <Link className="admin-small-button" href={`/projects/${project.slug}`} target="_blank" aria-label={`View ${project.title}`}>
                          <ArrowUpRight size={13} />
                        </Link>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="admin-project-manager">
      {/* Top action row placed below Sign Out navigation */}
      <div className="admin-crud-header" style={{ marginBottom: 18 }}>
        <div>
          <h2>Projects Catalog ({projects.length})</h2>
          <p className="admin-form-help">Manage portfolio showcases, stage deployment, and live status.</p>
        </div>
        <Link className="button" href="/admin-admin/dashboard/projects/new">
          <Plus size={14} /> Add Project
        </Link>
      </div>

      {/* Stats & Guidelines Bar */}
      <div className="admin-project-stats-bar">
        <div className="stat-pill">
          <span>Finished Projects:</span>
          <strong style={{ color: "#4ade80" }}>{finishedProjects.length} (01 to {String(finishedProjects.length).padStart(2, "0")})</strong>
        </div>
        <div className="stat-pill">
          <span>Currently Working:</span>
          <strong style={{ color: ongoingProjects.length > 0 ? "var(--orange)" : "var(--muted)" }}>
            {ongoingProjects.length} active ({ongoingHomeCount}/2 on Home)
          </strong>
        </div>
        <div className="stat-pill">
          <span>Main Page Top 5:</span>
          <strong style={{ color: homeMainCount === 5 ? "#4ade80" : "var(--accent)" }}>{homeMainCount} / 5 chosen</strong>
        </div>
        <div className="stat-pill">
          <span>Total Catalog:</span>
          <strong>{projects.length}</strong>
        </div>
      </div>

      {message && (
        <div className={`admin-alert ${message.type === "success" ? "admin-alert-success" : "admin-alert-error"}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{message.text}</span>
          {message.auditLogId && (
            <button type="button" className="admin-undo-btn" onClick={handleUndo} disabled={undoing}>
              <RotateCcw size={12} /> {undoing ? "Reverting…" : "Undo this change"}
            </button>
          )}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="admin-filter-tabs">
        <button type="button" className={`admin-tab ${filter === "all" ? "is-active" : ""}`} onClick={() => setFilter("all")}>
          All Projects ({projects.length})
        </button>
        <button type="button" className={`admin-tab ${filter === "finished" ? "is-active" : ""}`} onClick={() => setFilter("finished")}>
          ✓ Finished Projects ({finishedProjects.length})
        </button>
        <button type="button" className={`admin-tab ${filter === "ongoing" ? "is-active" : ""}`} onClick={() => setFilter("ongoing")}>
          ⚡ Currently Working ({ongoingProjects.length})
        </button>
        <button type="button" className={`admin-tab ${filter === "home" ? "is-active" : ""}`} onClick={() => setFilter("home")}>
          ★ Main Page Top 5 ({homeMainCount}/5)
        </button>
        <button type="button" className={`admin-tab ${filter === "drafts" ? "is-active" : ""}`} onClick={() => setFilter("drafts")}>
          Drafts ({draftsCount})
        </button>
      </div>

      {/* Projects Search Bar with Live Suggestions */}
      <div className="admin-search-container" ref={searchContainerRef} style={{ marginTop: 14 }}>
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
            placeholder="Search projects by title, slug, stage, or tags..."
            aria-label="Search projects"
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
              {totalMatches} {totalMatches === 1 ? "project" : "projects"}
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
                  <FolderGit2 size={13} style={{ color: "var(--orange)", flexShrink: 0 }} />
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

      {/* Render Lists Based on Filter */}
      {filter === "all" ? (
        <div className="admin-project-sections">
          {/* Section 1: Finished Projects Catalog (Strictly 01 to 15) */}
          <div className="admin-project-group" style={{ marginBottom: 34 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
              <div>
                <h3 style={{ display: "flex", alignItems: "center", gap: 8, margin: 0, fontSize: 16, color: "var(--white)" }}>
                  <span style={{ color: "#4ade80" }}>✓</span> Finished Projects Catalog ({finishedProjects.length})
                </h3>
                <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: 11 }}>
                  Real life problems, systems, and completed production software showcases. Strictly numbered 01 to {String(finishedProjects.length).padStart(2, "0")}.
                </p>
              </div>
              <span style={{ fontSize: 11, color: "var(--silver)", background: "rgba(255,255,255,0.04)", padding: "4px 10px", borderRadius: 6, border: "1px solid var(--line)" }}>
                {homeMainCount} / 5 on Home Top 5
              </span>
            </div>
            {renderTable(finishedProjects, false)}
          </div>

          {/* Section 2: Currently Working Projects (Strictly Isolated & Separate) */}
          <div className="admin-project-group" style={{ marginTop: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
              <div>
                <h3 style={{ display: "flex", alignItems: "center", gap: 8, margin: 0, fontSize: 16, color: "var(--white)" }}>
                  <span style={{ color: "var(--orange)" }}>⚡</span> Currently Working Projects ({ongoingProjects.length})
                </h3>
                <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: 11 }}>
                  Active engineering builds in progress. Kept separate from finished projects. Deploy to move into the Finished Projects Directory.
                </p>
              </div>
              <span style={{ fontSize: 11, color: "var(--orange)", background: "rgba(var(--orange-rgb), 0.1)", padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(var(--orange-rgb), 0.3)" }}>
                {ongoingHomeCount} / 2 on Home
              </span>
            </div>
            {renderTable(ongoingProjects, true)}
          </div>
        </div>
      ) : filter === "finished" ? (
        <div className="admin-project-group">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
            <div>
              <h3 style={{ display: "flex", alignItems: "center", gap: 8, margin: 0, fontSize: 16, color: "var(--white)" }}>
                <span style={{ color: "#4ade80" }}>✓</span> Finished Projects Directory ({finishedProjects.length})
              </h3>
              <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: 11 }}>
                Real life problems, systems, and completed production software showcases. Strictly numbered 01 to {String(finishedProjects.length).padStart(2, "0")}.
              </p>
            </div>
            <span style={{ fontSize: 11, color: "var(--silver)", background: "rgba(255,255,255,0.04)", padding: "4px 10px", borderRadius: 6, border: "1px solid var(--line)" }}>
              {homeMainCount} / 5 on Home Top 5
            </span>
          </div>
          {renderTable(finishedProjects, false)}
        </div>
      ) : filter === "ongoing" ? (
        <div className="admin-project-group">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
            <div>
              <h3 style={{ display: "flex", alignItems: "center", gap: 8, margin: 0, fontSize: 16, color: "var(--white)" }}>
                <span style={{ color: "var(--orange)" }}>⚡</span> Currently Working Projects ({ongoingProjects.length})
              </h3>
              <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: 11 }}>
                Active engineering builds in progress. Kept separate from finished projects. Deploy to move into the Finished Directory.
              </p>
            </div>
            <span style={{ fontSize: 11, color: "var(--orange)", background: "rgba(var(--orange-rgb), 0.1)", padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(var(--orange-rgb), 0.3)" }}>
              {ongoingHomeCount} / 2 on Home
            </span>
          </div>
          {renderTable(ongoingProjects, true)}
        </div>
      ) : filter === "home" ? (
        <div className="admin-project-group">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
            <div>
              <h3 style={{ display: "flex", alignItems: "center", gap: 8, margin: 0, fontSize: 16, color: "var(--white)" }}>
                ★ Main Page Top 5 Showcases ({homeMainCount}/5)
              </h3>
              <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: 11 }}>
                Projects selected to appear on the main website homepage.
              </p>
            </div>
          </div>
          {renderTable(projects.filter((p) => p.featuredOnHome && !p.isOngoing), false)}
        </div>
      ) : (
        <div className="admin-project-group">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
            <div>
              <h3 style={{ display: "flex", alignItems: "center", gap: 8, margin: 0, fontSize: 16, color: "var(--white)" }}>
                Draft Projects ({draftsCount})
              </h3>
              <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: 11 }}>
                Unpublished projects hidden from public view.
              </p>
            </div>
          </div>
          {renderTable(projects.filter((p) => !p.published), false)}
        </div>
      )}
    </div>
  );
}
