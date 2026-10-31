"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Pencil, Sparkles, Rocket, Star, Eye, EyeOff, RotateCcw, Plus } from "lucide-react";
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
}

export function ProjectListManager({ initialProjects }: { initialProjects: AdminProjectItem[] }) {
  const [projects, setProjects] = useState<AdminProjectItem[]>(initialProjects);
  const [filter, setFilter] = useState<"all" | "home" | "ongoing" | "drafts">("all");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error"; auditLogId?: string } | null>(null);
  const [undoing, setUndoing] = useState(false);

  const homeMainCount = projects.filter((p) => !p.isOngoing && p.featuredOnHome && p.published).length;
  const ongoingHomeCount = projects.filter((p) => p.isOngoing && p.featuredOnHome && p.published).length;
  const totalOngoingCount = projects.filter((p) => p.isOngoing).length;

  async function handleToggle(id: string, action: "toggle_ongoing" | "toggle_featured_home" | "toggle_published") {
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
          if (action === "toggle_ongoing") return { ...p, isOngoing: !p.isOngoing };
          if (action === "toggle_featured_home") return { ...p, featuredOnHome: !p.featuredOnHome };
          if (action === "toggle_published") return { ...p, published: !p.published };
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

      // Refresh list from window or re-fetch
      window.location.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Undo failed");
      setUndoing(false);
    }
  }

  const filteredProjects = projects.filter((p) => {
    if (filter === "home") return p.featuredOnHome;
    if (filter === "ongoing") return p.isOngoing;
    if (filter === "drafts") return !p.published;
    return true;
  });

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
          <span>Main Page Top 5:</span>
          <strong style={{ color: homeMainCount === 5 ? "#4ade80" : "var(--accent)" }}>{homeMainCount} / 5 chosen</strong>
        </div>
        <div className="stat-pill">
          <span>Currently Working (Home):</span>
          <strong style={{ color: ongoingHomeCount > 0 ? "#ffd699" : "var(--muted)" }}>{ongoingHomeCount} / 2 active ({totalOngoingCount} total)</strong>
        </div>
        <div className="stat-pill">
          <span>Total Projects:</span>
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
        <button type="button" className={`admin-tab ${filter === "home" ? "is-active" : ""}`} onClick={() => setFilter("home")}>
          ★ Main Page Top 5 ({homeMainCount}/5)
        </button>
        <button type="button" className={`admin-tab ${filter === "ongoing" ? "is-active" : ""}`} onClick={() => setFilter("ongoing")}>
          ⚡ Currently Working ({ongoingHomeCount}/2 on Home)
        </button>
        <button type="button" className={`admin-tab ${filter === "drafts" ? "is-active" : ""}`} onClick={() => setFilter("drafts")}>
          Drafts ({projects.filter((p) => !p.published).length})
        </button>
      </div>

      {filteredProjects.length ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Subsection / Stage</th>
                <th>Home Showcase</th>
                <th>Status</th>
                <th>Links</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((project) => {
                const isLoading = loadingId === project.id;
                return (
                  <tr key={project.id}>
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
      ) : (
        <div className="admin-card">
          <div className="empty-state">
            <span className="empty-state-mark">{"//"}</span>
            <h3>No projects found in this filter.</h3>
            <p>Try switching filter tabs or create a new project.</p>
          </div>
        </div>
      )}
    </div>
  );
}
