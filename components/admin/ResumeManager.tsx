"use client";

import { useState } from "react";
import { Upload, FileText, CheckCircle, Trash2, Download, ExternalLink, Undo2, Ban } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatIndianTime } from "@/lib/ist-date";

export interface ResumeItem {
  id: string;
  filename: string;
  path: string;
  active: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export function ResumeManager({ initialResumes }: { initialResumes: ResumeItem[] }) {
  const router = useRouter();
  const [resumes, setResumes] = useState<ResumeItem[]>(initialResumes);
  const [file, setFile] = useState<File | null>(null);
  const [customName, setCustomName] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastAuditId, setLastAuditId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error"; canUndo?: boolean } | null>(null);

  // Strictly check active flag with no fallback to prevent false positives
  const activeResume = resumes.find((r) => r.active);

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

      // Refresh list
      const freshRes = await fetch("/api/admin/resume");
      const freshData = await freshRes.json();
      if (freshData.resumes) setResumes(freshData.resumes);
      router.refresh();
    } catch (err: unknown) {
      setMessage({ text: err instanceof Error ? err.message : "Failed to undo action.", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setMessage({ text: "Please select a PDF file first.", type: "error" });
      return;
    }

    setLoading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("file", file);
    if (customName.trim()) {
      formData.append("filename", customName.trim());
    }

    try {
      const res = await fetch("/api/admin/resume", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed.");

      setResumes((prev) => [data.resume, ...prev.map((r) => ({ ...r, active: false }))]);
      setLastAuditId(data.auditLogId || null);
      setMessage({
        text: `Successfully uploaded and activated "${data.resume.filename}"! Recorded in audit log.`,
        type: "success",
        canUndo: Boolean(data.auditLogId),
      });
      setFile(null);
      setCustomName("");
      router.refresh();
    } catch (err: unknown) {
      setMessage({ text: err instanceof Error ? err.message : "Error uploading CV.", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function handleActivate(id: string) {
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/resume", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Activation failed.");

      setResumes((prev) =>
        prev.map((r) => ({
          ...r,
          active: r.id === id,
        }))
      );
      setLastAuditId(data.auditLogId || null);
      setMessage({
        text: `Set "${data.resume.filename}" as the active portfolio CV! Recorded in audit log.`,
        type: "success",
        canUndo: Boolean(data.auditLogId),
      });
      router.refresh();
    } catch (err: unknown) {
      setMessage({ text: err instanceof Error ? err.message : "Failed to activate resume.", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  // Deactivate current active CV (fulfill user's "remove current cv option")
  async function handleRemoveCurrentActive() {
    if (!window.confirm("Remove the currently active CV from display? The public website will show 'Upcoming on his way'.")) return;

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/resume", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clearActive: true }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove active CV.");

      setResumes((prev) => prev.map((r) => ({ ...r, active: false })));
      setLastAuditId(data.auditLogId || null);
      setMessage({
        text: "Removed active CV. The public site now shows 'Upcoming on his way'. Recorded in audit log.",
        type: "success",
        canUndo: Boolean(data.auditLogId),
      });
      router.refresh();
    } catch (err: unknown) {
      setMessage({ text: err instanceof Error ? err.message : "Failed to deactivate active CV.", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, filename: string) {
    if (!window.confirm(`Delete the CV record for "${filename}"?`)) return;

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/resume?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Deletion failed.");

      setResumes((prev) => prev.filter((r) => r.id !== id));
      setLastAuditId(data.auditLogId || null);
      setMessage({
        text: `Deleted "${filename}". Recorded in audit log.`,
        type: "success",
        canUndo: Boolean(data.auditLogId),
      });
      router.refresh();
    } catch (err: unknown) {
      setMessage({ text: err instanceof Error ? err.message : "Failed to delete resume.", type: "error" });
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

      <div className="admin-crud-header">
        <div>
          <h2>CV &amp; Resume Management</h2>
          <p className="admin-form-help">Upload, preview, activate, or remove your portfolio resume PDF. Changes are logged with Indian Time (IST) and can be undone.</p>
        </div>
      </div>

      <div className="admin-resume-grid">
        {/* Upload Form Box */}
        <div className="admin-card">
          <div className="admin-card-heading">
            <div>
              <p className="section-kicker">Upload New CV</p>
              <h3>Upload &amp; Replace Resume</h3>
            </div>
          </div>

          <form onSubmit={handleUpload} className="admin-form" style={{ marginTop: 14 }}>
            <div className="field">
              <label htmlFor="cv-file">Select PDF File *</label>
              <input
                id="cv-file"
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                required
              />
              <span className="field-hint">PDF documents only. Maximum 10MB.</span>
            </div>

            <div className="field">
              <label htmlFor="cv-name">Custom Display Name (optional)</label>
              <input
                id="cv-name"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g. Bijoy_Sarkar_Software_Engineer_CV.pdf"
              />
            </div>

            <button className="button" type="submit" disabled={loading || !file}>
              <Upload size={14} /> {loading ? "Uploading..." : "Upload & Set as Active"}
            </button>
          </form>

          {/* List of Resumes */}
          <div className="admin-resume-list-box" style={{ marginTop: 28 }}>
            <h4 style={{ margin: "0 0 12px", color: "var(--white)", fontSize: 13 }}>Registered CV Documents</h4>
            <div className="admin-recent-list">
              {resumes.map((r) => (
                <div key={r.id} className="admin-recent-item" style={{ justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <FileText size={18} className="accent" />
                    <div>
                      <strong style={{ fontSize: 12, color: "var(--white)" }}>{r.filename}</strong>
                      <small style={{ display: "block", color: "var(--subtle)", fontSize: 9 }}>
                        Uploaded: {formatIndianTime(r.createdAt)}
                      </small>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {r.active ? (
                      <span className="admin-active-pill">
                        <CheckCircle size={11} /> Active on Site
                      </span>
                    ) : (
                      <button
                        className="admin-small-button"
                        type="button"
                        onClick={() => handleActivate(r.id)}
                        disabled={loading}
                      >
                        Set Active
                      </button>
                    )}

                    <a className="admin-small-button" href={r.path} target="_blank" rel="noreferrer" title="Open in new tab">
                      <ExternalLink size={12} />
                    </a>

                    {resumes.length > 1 && (
                      <button
                        className="admin-small-button danger"
                        type="button"
                        onClick={() => handleDelete(r.id, r.filename)}
                        disabled={loading}
                        title="Delete resume record"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live Active Preview & Current CV Controls */}
        <div className="admin-card">
          <div className="admin-card-heading">
            <div>
              <p className="section-kicker">Live Preview</p>
              <h3>Current Active CV</h3>
            </div>
            {activeResume && (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button
                  type="button"
                  className="admin-small-button danger"
                  onClick={handleRemoveCurrentActive}
                  disabled={loading}
                  title="Remove CV from public portfolio display"
                >
                  <Ban size={12} /> Remove Current CV
                </button>
                <a className="admin-inline-link" href={activeResume.path} download>
                  <Download size={13} /> Download
                </a>
              </div>
            )}
          </div>

          {activeResume ? (
            <div className="admin-cv-preview-box">
              <iframe
                className="resume-frame"
                style={{ height: 480, borderRadius: 12 }}
                src={`${activeResume.path}#toolbar=0&navpanes=0`}
                title="Current Active Resume"
              />
            </div>
          ) : (
            <div className="empty-state" style={{ padding: "48px 24px", textAlign: "center" }}>
              <div style={{ display: "inline-flex", padding: 12, borderRadius: "50%", background: "rgba(255, 94, 44, 0.1)", color: "var(--orange)", marginBottom: 12 }}>
                <Ban size={28} />
              </div>
              <h4 style={{ color: "var(--white)", marginBottom: 6 }}>No Active CV Selected</h4>
              <p className="muted" style={{ maxWidth: 360, margin: "0 auto 16px", fontSize: 13, lineHeight: 1.6 }}>
                There is currently no published resume. The public portfolio automatically displays:
              </p>
              <div style={{ display: "inline-block", padding: "6px 14px", borderRadius: 999, background: "rgba(255, 94, 44, 0.12)", border: "1px solid rgba(255, 94, 44, 0.3)", color: "var(--orange)", fontWeight: 700, fontSize: 12 }}>
                &ldquo;Upcoming on his way&rdquo;
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
