import Link from "next/link";
import { ArrowRight, ExternalLink, FolderOpen, Globe2, Plus, Briefcase, Wrench, FileText, History } from "lucide-react";
import { AdminNavigation } from "@/components/admin/AdminNavigation";
import { SocialIcon } from "@/components/ui/SocialIcon";
import { prisma } from "@/lib/prisma";
import { formatIndianTime } from "@/lib/audit";
import { parseAuditChanges } from "@/lib/audit-diff";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  let totalProjects = 15;
  let publishedProjects = 15;
  let totalExperiences = 5;
  let totalSkillGroups = 7;
  let activeResume: { filename: string; path: string } | null = {
    filename: "Bijoy_Sarkar_CV.pdf",
    path: "/Bijoy_Sarkar_CV.pdf",
  };
  let totalAuditLogs = 1;
  let recentAuditLogs: Array<{
    id: string;
    entity: string;
    entityId: string;
    action: string;
    changes: string;
    adminId: string;
    adminName: string;
    timestamp: Date;
  }> = [];
  let recentProjects: Array<{
    id: string;
    title: string;
    slug: string;
    published: boolean;
    updatedAt: Date;
  }> = [];
  let totalMessages = 0;
  let unreadMessages = 0;

  try {
    const [
      pTotal,
      pPublished,
      expTotal,
      skillsTotal,
      resumeRecord,
      logsTotal,
      logsRecent,
      projRecent,
      msgTotal,
      msgUnread,
    ] = await Promise.all([
      prisma.project.count(),
      prisma.project.count({ where: { published: true } }),
      prisma.workExperience.count(),
      prisma.skillGroup.count(),
      prisma.resumeFile.findFirst({ where: { active: true } }),
      prisma.auditLog.count(),
      prisma.auditLog.findMany({ orderBy: { timestamp: "desc" }, take: 6 }),
      prisma.project.findMany({
        orderBy: { updatedAt: "desc" },
        take: 4,
        select: { id: true, title: true, slug: true, published: true, updatedAt: true },
      }),
      prisma.contactMessage.count(),
      prisma.contactMessage.count({ where: { status: "UNREAD" } }),
    ]);

    totalProjects = pTotal;
    publishedProjects = pPublished;
    totalExperiences = expTotal;
    totalSkillGroups = skillsTotal;
    if (resumeRecord) activeResume = resumeRecord;
    totalAuditLogs = logsTotal;
    recentAuditLogs = logsRecent;
    recentProjects = projRecent;
    totalMessages = msgTotal;
    unreadMessages = msgUnread;
  } catch (err) {
    console.warn("Prisma error caught on AdminDashboardPage:", err);
  }

  return (
    <main>
      <div className="admin-topline">
        <div>
          <p className="section-kicker">Administrator Control Room</p>
          <h1>Dashboard Overview</h1>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link className="button button-secondary" href="/" target="_blank">
            Live Site <ExternalLink size={13} />
          </Link>
          <Link className="button" href="/admin-admin/dashboard/projects/new">
            New Project <Plus size={14} />
          </Link>
        </div>
      </div>

      <AdminNavigation active="overview" />

      {/* Primary KPI Stats */}
      <div className="admin-stats admin-stats-6">
        <Link href="/admin-admin/dashboard/projects" className="admin-stat admin-stat-clickable">
          <strong>{totalProjects}</strong>
          <span>Projects ({publishedProjects} live)</span>
        </Link>
        <Link href="/admin-admin/dashboard/experience" className="admin-stat admin-stat-clickable">
          <strong>{totalExperiences}</strong>
          <span>Work Experiences</span>
        </Link>
        <Link href="/admin-admin/dashboard/skills" className="admin-stat admin-stat-clickable">
          <strong>{totalSkillGroups}</strong>
          <span>Skill &amp; Language Categories</span>
        </Link>
        <Link href="/admin-admin/dashboard/resume" className="admin-stat admin-stat-clickable">
          <strong style={{ fontSize: 16, marginTop: 4, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
            {activeResume?.filename || "Default PDF"}
          </strong>
          <span>Active CV</span>
        </Link>
        <Link href="/admin-admin/dashboard/audit" className="admin-stat admin-stat-clickable">
          <strong>{totalAuditLogs}</strong>
          <span>Audit Log Entries (IST)</span>
        </Link>
        <Link href="/admin-admin/dashboard/messages" className="admin-stat admin-stat-clickable">
          <strong style={{ color: unreadMessages > 0 ? "var(--orange)" : "var(--soft-white)" }}>
            {totalMessages} ({unreadMessages} new)
          </strong>
          <span>Inquiries (Google Sheets)</span>
        </Link>
      </div>

      {/* Quick Launch Cards */}
      <div className="admin-quick-actions-grid">
        <Link href="/admin-admin/dashboard/projects/new" className="admin-quick-action-card">
          <FolderOpen size={20} className="accent" />
          <div>
            <h4>Add New Project</h4>
            <p>Publish a project showcase with screenshots &amp; stack</p>
          </div>
          <ArrowRight size={14} className="quick-arrow" />
        </Link>

        <Link href="/admin-admin/dashboard/experience" className="admin-quick-action-card">
          <Briefcase size={20} className="accent" />
          <div>
            <h4>Manage Experience</h4>
            <p>Add, edit or remove internships and work timeline</p>
          </div>
          <ArrowRight size={14} className="quick-arrow" />
        </Link>

        <Link href="/admin-admin/dashboard/skills" className="admin-quick-action-card">
          <Wrench size={20} className="accent" />
          <div>
            <h4>Skills &amp; Languages</h4>
            <p>Modify technical toolkit and spoken languages</p>
          </div>
          <ArrowRight size={14} className="quick-arrow" />
        </Link>

        <Link href="/admin-admin/dashboard/resume" className="admin-quick-action-card">
          <FileText size={20} className="accent" />
          <div>
            <h4>Upload / Update CV</h4>
            <p>Upload a new PDF resume or manage active version</p>
          </div>
          <ArrowRight size={14} className="quick-arrow" />
        </Link>
      </div>

      <div className="admin-dashboard-split">
        {/* Recent Projects */}
        <section className="admin-card" aria-labelledby="recent-projects-title">
          <div className="admin-card-heading">
            <div>
              <p className="section-kicker">Portfolio Content</p>
              <h2 id="recent-projects-title">Recent Projects</h2>
            </div>
            <Link className="admin-inline-link" href="/admin-admin/dashboard/projects">
              Manage all <ArrowRight size={13} />
            </Link>
          </div>
          {recentProjects.length ? (
            <div className="admin-recent-list">
              {recentProjects.map((project) => (
                <Link className="admin-recent-item" href={`/admin-admin/dashboard/projects/${project.id}`} key={project.id}>
                  <span className="admin-recent-icon"><FolderOpen size={16} /></span>
                  <span className="admin-recent-title">
                    <strong>{project.title}</strong>
                    <small>/{project.slug}</small>
                  </span>
                  <span className={`admin-state${project.published ? " is-published" : ""}`}>
                    {project.published ? "Published" : "Draft"}
                  </span>
                  <ArrowRight className="admin-recent-arrow" size={14} />
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h3>No projects yet.</h3>
              <p>Start with your first portfolio entry.</p>
            </div>
          )}
        </section>

        {/* Recent Audit Dataset Activity (IST) */}
        <section className="admin-card" aria-labelledby="recent-activity-title">
          <div className="admin-card-heading">
            <div>
              <p className="section-kicker">Indian Time (IST) Audit Trail</p>
              <h2 id="recent-activity-title">Latest System Changes</h2>
            </div>
            <Link className="admin-inline-link" href="/admin-admin/dashboard/audit">
              View dataset <ArrowRight size={13} />
            </Link>
          </div>
          {recentAuditLogs.length ? (
            <div className="admin-recent-list">
              {recentAuditLogs.map((log) => {
                const audit = parseAuditChanges(log.changes, log.action, log.entity);
                return (
                  <div
                    className="admin-recent-item"
                    key={log.id}
                    style={{
                      flexDirection: "column",
                      alignItems: "stretch",
                      gap: 8,
                      padding: "14px 16px",
                      minHeight: "auto",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span className="admin-recent-icon" style={{ flexShrink: 0 }}><History size={14} /></span>
                        <strong style={{ fontSize: 11, color: "var(--white)" }}>
                          {log.action} · {log.entity}
                        </strong>
                        <small style={{ color: "var(--subtle)", fontSize: 10 }}>by {log.adminName}</small>
                      </div>
                      <span style={{ color: "var(--orange)", fontSize: 10, fontVariantNumeric: "tabular-nums" }}>
                        {formatIndianTime(log.timestamp)}
                      </span>
                    </div>

                    <p style={{ margin: 0, fontSize: 12, color: "var(--silver)", lineHeight: 1.5 }}>
                      {audit.summary}
                    </p>

                    {audit.diffs.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 2 }}>
                        {audit.diffs.slice(0, 3).map((d) => (
                          <div
                            key={d.field}
                            style={{
                              fontSize: 11,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              background: "rgba(255, 255, 255, 0.03)",
                              padding: "4px 8px",
                              borderRadius: 6,
                              border: "1px solid rgba(255, 255, 255, 0.06)",
                              flexWrap: "wrap",
                            }}
                          >
                            <span style={{ color: "var(--muted)", fontWeight: 600 }}>{d.label}:</span>
                            <span style={{ color: "#f87171", textDecoration: "line-through" }}>{d.from}</span>
                            <span style={{ color: "var(--subtle)" }}>→</span>
                            <span style={{ color: "#4ade80", fontWeight: 600 }}>{d.to}</span>
                          </div>
                        ))}
                        {audit.diffs.length > 3 && (
                          <span style={{ fontSize: 10, color: "var(--subtle)" }}>+{audit.diffs.length - 3} more modified fields</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <p className="muted">No activity logged yet.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
