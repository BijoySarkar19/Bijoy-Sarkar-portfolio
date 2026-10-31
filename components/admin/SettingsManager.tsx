"use client";

import { useState } from "react";
import {
  Save,
  Undo2,
  Moon,
  Sun,
  Check,
  Sheet,
  GraduationCap,
  Plus,
  Trash2,
  ExternalLink,
  MapPin,
  Layers,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { useRouter } from "next/navigation";

export interface DegreeItem {
  id: string;
  degree: string;
  institution: string;
  link: string;
  period: string;
  showOnHome: boolean;
}

export const DEFAULT_DEGREES: DegreeItem[] = [
  {
    id: "btech-degree",
    degree: "B.Tech · Computer Science & Engineering",
    institution: "ICFAI University Tripura",
    link: "https://www.iutripura.edu.in/",
    period: "2023—expected 2027",
    showOnHome: true,
  },
];

export interface SiteSettingsMap {
  heroTitle?: string;
  heroSubhead?: string;
  heroBio?: string;
  contactEmail?: string;
  contactRecipientEmail?: string;
  location?: string;
  currentLocation?: string;
  displayAddressMode?: string;
  status?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  youtubeUrl?: string;
  discordUrl?: string;
  googleSheetsWebhookUrl?: string;
  themeAccent?: string;
  themeMode?: string;
  // Section Visibility Toggles
  heroEnabled?: string;
  aboutEnabled?: string;
  skillsEnabled?: string;
  projectsEnabled?: string;
  resumeEnabled?: string;
  gamesEnabled?: string;
  contactEnabled?: string;
  // Section Editorial Texts
  aboutTitle?: string;
  aboutBio?: string;
  aboutLead?: string;
  skillsTitle?: string;
  skillsSubtitle?: string;
  projectsTitle?: string;
  projectsSubtitle?: string;
  ongoingTitle?: string;
  ongoingSubtitle?: string;
  resumeTitle?: string;
  resumeSubtitle?: string;
  gamesTitle?: string;
  gamesSubtitle?: string;
  contactTitle?: string;
  contactSubtitle?: string;
  // Degrees JSON
  degreesList?: string;
  [key: string]: string | undefined;
}

const ACCENT_PRESETS = [
  { name: "Cyber Orange", hex: "#ff5e2c" },
  { name: "Electric Blue", hex: "#00b4d8" },
  { name: "Neon Violet", hex: "#9d4edd" },
  { name: "Matrix Emerald", hex: "#00f5d4" },
  { name: "Crimson Red", hex: "#e63946" },
];

export function SettingsManager({ initialSettings }: { initialSettings: SiteSettingsMap }) {
  const router = useRouter();
  const [settings, setSettings] = useState<SiteSettingsMap>(initialSettings);
  const [loading, setLoading] = useState(false);
  const [lastAuditId, setLastAuditId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error"; canUndo?: boolean } | null>(null);

  // Degrees state
  const [degrees, setDegrees] = useState<DegreeItem[]>(() => {
    try {
      if (initialSettings.degreesList) {
        const parsed = JSON.parse(initialSettings.degreesList);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Error parsing degreesList:", e);
    }
    return DEFAULT_DEGREES;
  });

  function handleChange(key: string, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  function handleAddDegree() {
    const newDegree: DegreeItem = {
      id: `degree-${Date.now()}`,
      degree: "M.Tech · Computer Science & Engineering",
      institution: "Institution / University Name",
      link: "https://",
      period: "2027—2029",
      showOnHome: true,
    };
    setDegrees((prev) => [...prev, newDegree]);
  }

  function handleUpdateDegree(id: string, field: keyof DegreeItem, value: any) {
    setDegrees((prev) => prev.map((d) => (d.id === id ? { ...d, [field]: value } : d)));
  }

  function handleDeleteDegree(id: string) {
    if (degrees.length <= 1) {
      if (!window.confirm("Are you sure you want to remove this degree? At least one degree is recommended.")) return;
    }
    setDegrees((prev) => prev.filter((d) => d.id !== id));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const payload = {
      ...settings,
      degreesList: JSON.stringify(degrees),
    };

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save settings.");

      if (data.settings) {
        setSettings(data.settings);
      }

      // Immediately preview theme mode and accent on client
      if (typeof document !== "undefined") {
        if (settings.themeMode === "light") {
          document.documentElement.classList.add("light-mode");
          document.documentElement.setAttribute("data-theme", "light");
        } else {
          document.documentElement.classList.remove("light-mode");
          document.documentElement.setAttribute("data-theme", "dark");
        }
        if (settings.themeAccent) {
          document.documentElement.style.setProperty("--theme-accent", settings.themeAccent);
          document.documentElement.style.setProperty("--orange", settings.themeAccent);
        }
      }

      setLastAuditId(data.auditLogId || null);
      setMessage({
        text: "Portfolio settings, sections, degrees, and content updated and saved! Recorded in audit log.",
        type: "success",
        canUndo: Boolean(data.auditLogId),
      });
      router.refresh();
    } catch (err: unknown) {
      setMessage({ text: err instanceof Error ? err.message : "Error saving settings.", type: "error" });
    } finally {
      setLoading(false);
    }
  }

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

      const refreshRes = await fetch("/api/admin/settings");
      const refreshData = await refreshRes.json();
      if (refreshData.settings) {
        setSettings(refreshData.settings);
        if (refreshData.settings.degreesList) {
          try {
            setDegrees(JSON.parse(refreshData.settings.degreesList));
          } catch {}
        }
      }
      router.refresh();
    } catch (err: unknown) {
      setMessage({ text: err instanceof Error ? err.message : "Failed to undo settings.", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-crud-panel">
      {message && (
        <div
          className={message.type === "success" ? "admin-success" : "admin-alert"}
          role="status"
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
        >
          <span>{message.text}</span>
          {message.canUndo && lastAuditId && (
            <button
              type="button"
              onClick={handleUndo}
              disabled={loading}
              className="admin-small-button"
              style={{
                background: "rgba(255, 94, 44, 0.2)",
                border: "1px solid var(--orange)",
                color: "var(--white)",
                fontWeight: 700,
              }}
            >
              <Undo2 size={12} /> Undo this change
            </button>
          )}
        </div>
      )}

      <div className="admin-crud-header">
        <div>
          <h2>Site Settings &amp; Configuration</h2>
          <p className="admin-form-help">
            Customize hero headline, section modules, editorial texts, degrees, addresses, and color accents. All edits are logged in IST and reversible.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="admin-form">
        <div
          className="admin-grid"
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 20 }}
        >
          {/* Section Visibility Modules (Image 2 request) */}
          <div className="admin-card" style={{ gridColumn: "1 / -1" }}>
            <div className="admin-card-heading">
              <div>
                <p className="section-kicker">Portfolio Modules</p>
                <h3>Section Visibility Toggles</h3>
              </div>
            </div>
            <p className="field-hint" style={{ marginTop: 6, marginBottom: 16 }}>
              Enable or disable any section across the public portfolio. Disabled sections are gracefully removed from the page and navigation bars.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 12,
              }}
            >
              {[
                { key: "heroEnabled", label: "Home / Hero Section", desc: "Top introduction, title, and canvas framing" },
                { key: "aboutEnabled", label: "About Section", desc: "Bio, metrics row, degrees, and work experiences" },
                { key: "skillsEnabled", label: "Skills & Languages", desc: "Categorized engineering skill groups and pills" },
                { key: "projectsEnabled", label: "Projects Section", desc: "Main top 5 showcases and currently working ongoing builds" },
                { key: "resumeEnabled", label: "Resume / CV Section", desc: "Interactive CV document viewer and download actions" },
                { key: "gamesEnabled", label: "Mini-Games Section", desc: "Interactive 2048 & Signal Pairs memory challenge" },
                { key: "contactEnabled", label: "Get in Touch (Contact)", desc: "Contact inquiry form, direct email, and location" },
              ].map(({ key, label, desc }) => {
                const isChecked = (settings[key] ?? "true") !== "false";
                return (
                  <div
                    key={key}
                    style={{
                      padding: "12px 16px",
                      borderRadius: 12,
                      border: "1px solid var(--line)",
                      background: "rgba(255,255,255,0.02)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                    }}
                  >
                    <div>
                      <strong style={{ color: "var(--white)", fontSize: 13, display: "block" }}>{label}</strong>
                      <span style={{ color: "var(--subtle)", fontSize: 11 }}>{desc}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => handleChange(key, e.target.checked ? "true" : "false")}
                      style={{ width: 18, height: 18, accentColor: "var(--orange)", cursor: "pointer" }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Education & Degrees Manager */}
          <div className="admin-card" style={{ gridColumn: "1 / -1" }}>
            <div className="admin-card-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p className="section-kicker">Academic Credentials</p>
                <h3>Degrees &amp; Education Management</h3>
              </div>
              <button
                type="button"
                onClick={handleAddDegree}
                className="admin-small-button"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  borderRadius: 8,
                  background: "rgba(var(--orange-rgb), 0.15)",
                  border: "1px solid var(--orange)",
                  color: "var(--white)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <Plus size={14} /> Add Degree (e.g. M.Tech)
              </button>
            </div>
            <p className="field-hint" style={{ marginTop: 6, marginBottom: 16 }}>
              Add and manage your academic degrees. Toggle &apos;Show on Home&apos; to decide which degrees appear on the public portfolio. Adding M.Tech or other degrees automatically renders a dedicated credential card on the main page.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {degrees.map((deg, index) => (
                <div
                  key={deg.id}
                  style={{
                    padding: 16,
                    borderRadius: 14,
                    border: "1px solid var(--line)",
                    background: "rgba(255, 255, 255, 0.03)",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr)) 120px 40px",
                    gap: 12,
                    alignItems: "end",
                  }}
                >
                  <div className="field" style={{ margin: 0 }}>
                    <label style={{ fontSize: 11 }}>Degree Title *</label>
                    <input
                      value={deg.degree}
                      onChange={(e) => handleUpdateDegree(deg.id, "degree", e.target.value)}
                      placeholder="e.g. B.Tech · Computer Science & Engineering"
                    />
                  </div>
                  <div className="field" style={{ margin: 0 }}>
                    <label style={{ fontSize: 11 }}>University / Institution *</label>
                    <input
                      value={deg.institution}
                      onChange={(e) => handleUpdateDegree(deg.id, "institution", e.target.value)}
                      placeholder="e.g. ICFAI University Tripura"
                    />
                  </div>
                  <div className="field" style={{ margin: 0 }}>
                    <label style={{ fontSize: 11 }}>University Webpage Link</label>
                    <input
                      value={deg.link}
                      onChange={(e) => handleUpdateDegree(deg.id, "link", e.target.value)}
                      placeholder="https://www.iutripura.edu.in/"
                    />
                  </div>
                  <div className="field" style={{ margin: 0 }}>
                    <label style={{ fontSize: 11 }}>Completion / Period</label>
                    <input
                      value={deg.period}
                      onChange={(e) => handleUpdateDegree(deg.id, "period", e.target.value)}
                      placeholder="e.g. 2023—expected 2027"
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center" }}>
                    <span style={{ fontSize: 10, color: "var(--subtle)" }}>Show on Home</span>
                    <input
                      type="checkbox"
                      checked={deg.showOnHome}
                      onChange={(e) => handleUpdateDegree(deg.id, "showOnHome", e.target.checked)}
                      style={{ width: 18, height: 18, accentColor: "var(--orange)", cursor: "pointer" }}
                    />
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => handleDeleteDegree(deg.id)}
                      className="admin-small-button"
                      title="Remove degree"
                      style={{
                        width: 32,
                        height: 32,
                        padding: 0,
                        display: "grid",
                        placeItems: "center",
                        borderRadius: 8,
                        background: "rgba(239, 68, 68, 0.1)",
                        border: "1px solid rgba(239, 68, 68, 0.3)",
                        color: "#ef4444",
                        cursor: "pointer",
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section Editorial Content & Lead Texts */}
          <div className="admin-card" style={{ gridColumn: "1 / -1" }}>
            <div className="admin-card-heading">
              <div>
                <p className="section-kicker">Section Copywriting</p>
                <h3>Editorial Headings &amp; Section Descriptions</h3>
              </div>
            </div>
            <p className="field-hint" style={{ marginTop: 6, marginBottom: 18 }}>
              Directly edit all section headlines, subheads, and philosophy statements. Content automatically flows without overlapping.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
                gap: 18,
              }}
            >
              {/* About Section Texts */}
              <div style={{ padding: 16, borderRadius: 12, border: "1px solid var(--line)", background: "rgba(255,255,255,0.02)" }}>
                <strong style={{ color: "var(--orange)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  About Section
                </strong>
                <div className="field" style={{ marginTop: 10 }}>
                  <label>Section Heading</label>
                  <input
                    value={settings.aboutTitle ?? "Engineering with purpose."}
                    onChange={(e) => handleChange("aboutTitle", e.target.value)}
                    placeholder="Engineering with purpose."
                  />
                </div>
                <div className="field">
                  <label>Bio Summary (under Heading)</label>
                  <textarea
                    rows={2}
                    value={
                      settings.aboutBio ??
                      "B.Tech Computer Science and Engineering undergraduate at ICFAI University Tripura. I work across AI/ML, full-stack software, mobile apps, and cybersecurity."
                    }
                    onChange={(e) => handleChange("aboutBio", e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Lead Engineering Philosophy (beside Experience)</label>
                  <textarea
                    rows={3}
                    value={
                      settings.aboutLead ??
                      "I turn complex requirements into clear, reliable software. I enjoy exploring the details, connecting the right tools, and shaping each idea into something people can use."
                    }
                    onChange={(e) => handleChange("aboutLead", e.target.value)}
                  />
                </div>
              </div>

              {/* Skills Section Texts */}
              <div style={{ padding: 16, borderRadius: 12, border: "1px solid var(--line)", background: "rgba(255,255,255,0.02)" }}>
                <strong style={{ color: "var(--orange)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Technical Skills Section
                </strong>
                <div className="field" style={{ marginTop: 10 }}>
                  <label>Section Heading</label>
                  <input
                    value={settings.skillsTitle ?? "A broad stack. A builder's mindset."}
                    onChange={(e) => handleChange("skillsTitle", e.target.value)}
                    placeholder="A broad stack. A builder's mindset."
                  />
                </div>
                <div className="field">
                  <label>Aside Description</label>
                  <textarea
                    rows={3}
                    value={
                      settings.skillsSubtitle ??
                      "Tools are only useful when they fit the job. I keep learning across product engineering, intelligent systems, and secure software."
                    }
                    onChange={(e) => handleChange("skillsSubtitle", e.target.value)}
                  />
                </div>
              </div>

              {/* Main Projects Showcase */}
              <div style={{ padding: 16, borderRadius: 12, border: "1px solid var(--line)", background: "rgba(255,255,255,0.02)" }}>
                <strong style={{ color: "var(--orange)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Main Projects Showcase
                </strong>
                <div className="field" style={{ marginTop: 10 }}>
                  <label>Section Heading</label>
                  <input
                    value={settings.projectsTitle ?? "Real problems. Useful software."}
                    onChange={(e) => handleChange("projectsTitle", e.target.value)}
                    placeholder="Real problems. Useful software."
                  />
                </div>
                <div className="field">
                  <label>Aside Description</label>
                  <textarea
                    rows={3}
                    value={
                      settings.projectsSubtitle ??
                      "A curated cross-section of AI, cybersecurity, systems, and full-stack engineering."
                    }
                    onChange={(e) => handleChange("projectsSubtitle", e.target.value)}
                  />
                </div>
              </div>

              {/* Currently Working Subsection */}
              <div style={{ padding: 16, borderRadius: 12, border: "1px solid var(--line)", background: "rgba(255,255,255,0.02)" }}>
                <strong style={{ color: "var(--orange)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Currently Working On (Ongoing Subsection)
                </strong>
                <div className="field" style={{ marginTop: 10 }}>
                  <label>Subsection Heading</label>
                  <input
                    value={settings.ongoingTitle ?? "Currently working on. Next-generation builds."}
                    onChange={(e) => handleChange("ongoingTitle", e.target.value)}
                    placeholder="Currently working on. Next-generation builds."
                  />
                </div>
                <div className="field">
                  <label>Subsection Description</label>
                  <textarea
                    rows={3}
                    value={
                      settings.ongoingSubtitle ??
                      "Projects undergoing active engineering and architectural iteration. Once completed, they are deployed directly to the main portfolio section."
                    }
                    onChange={(e) => handleChange("ongoingSubtitle", e.target.value)}
                  />
                </div>
              </div>

              {/* Resume Section Texts */}
              <div style={{ padding: 16, borderRadius: 12, border: "1px solid var(--line)", background: "rgba(255,255,255,0.02)" }}>
                <strong style={{ color: "var(--orange)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  CV / Resume Section
                </strong>
                <div className="field" style={{ marginTop: 10 }}>
                  <label>Section Heading</label>
                  <input
                    value={settings.resumeTitle ?? "Experience in the details."}
                    onChange={(e) => handleChange("resumeTitle", e.target.value)}
                    placeholder="Experience in the details."
                  />
                </div>
                <div className="field">
                  <label>Description</label>
                  <textarea
                    rows={3}
                    value={
                      settings.resumeSubtitle ??
                      "Education, internships, technical work, and the projects behind this portfolio—all in one place."
                    }
                    onChange={(e) => handleChange("resumeSubtitle", e.target.value)}
                  />
                </div>
              </div>

              {/* Games Section Texts */}
              <div style={{ padding: 16, borderRadius: 12, border: "1px solid var(--line)", background: "rgba(255,255,255,0.02)" }}>
                <strong style={{ color: "var(--orange)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Mini-Games Section
                </strong>
                <div className="field" style={{ marginTop: 10 }}>
                  <label>Section Heading</label>
                  <input
                    value={settings.gamesTitle ?? "Take a break. Play a little."}
                    onChange={(e) => handleChange("gamesTitle", e.target.value)}
                    placeholder="Take a break. Play a little."
                  />
                </div>
                <div className="field">
                  <label>Aside Description</label>
                  <textarea
                    rows={3}
                    value={
                      settings.gamesSubtitle ??
                      "Two quick games, built for the keyboard and touch. Come back whenever you are ready."
                    }
                    onChange={(e) => handleChange("gamesSubtitle", e.target.value)}
                  />
                </div>
              </div>

              {/* Contact Section Texts */}
              <div style={{ padding: 16, borderRadius: 12, border: "1px solid var(--line)", background: "rgba(255,255,255,0.02)" }}>
                <strong style={{ color: "var(--orange)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Contact Section
                </strong>
                <div className="field" style={{ marginTop: 10 }}>
                  <label>Section Heading</label>
                  <input
                    value={settings.contactTitle ?? "Have a problem worth solving?"}
                    onChange={(e) => handleChange("contactTitle", e.target.value)}
                    placeholder="Have a problem worth solving?"
                  />
                </div>
                <div className="field">
                  <label>Description</label>
                  <textarea
                    rows={3}
                    value={
                      settings.contactSubtitle ??
                      "For software roles, AI/ML work, or a project idea, send a note and tell me what you have in mind."
                    }
                    onChange={(e) => handleChange("contactSubtitle", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Identity & Hero Section */}
          <div className="admin-card">
            <div className="admin-card-heading">
              <div>
                <p className="section-kicker">Hero Identity</p>
                <h3>Headline &amp; Bio Information</h3>
              </div>
            </div>

            <div className="field" style={{ marginTop: 14 }}>
              <label htmlFor="setting-heroTitle">Primary Hero Title</label>
              <input
                id="setting-heroTitle"
                value={settings.heroTitle ?? "Software Engineer & AI Developer"}
                onChange={(e) => handleChange("heroTitle", e.target.value)}
                placeholder="Software Engineer & AI Developer"
              />
            </div>

            <div className="field">
              <label htmlFor="setting-heroSubhead">Hero Subheadline</label>
              <input
                id="setting-heroSubhead"
                value={settings.heroSubhead ?? "Building intelligent systems and full-stack solutions."}
                onChange={(e) => handleChange("heroSubhead", e.target.value)}
                placeholder="Building intelligent systems and full-stack solutions."
              />
            </div>

            <div className="field">
              <label htmlFor="setting-heroBio">Hero Bio / Description</label>
              <textarea
                id="setting-heroBio"
                rows={3}
                value={
                  settings.heroBio ??
                  "Computer Science undergraduate focused on AI/ML, secure software, and useful digital products."
                }
                onChange={(e) => handleChange("heroBio", e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="setting-status">Current Status Pill</label>
              <input
                id="setting-status"
                value={settings.status ?? "Open to opportunities"}
                onChange={(e) => handleChange("status", e.target.value)}
              />
            </div>
          </div>

          {/* Contact, Inboxes & Addresses */}
          <div className="admin-card">
            <div className="admin-card-heading">
              <div>
                <p className="section-kicker">Availability &amp; Inboxes</p>
                <h3>Contact &amp; Delivery Settings</h3>
              </div>
            </div>

            <div className="field" style={{ marginTop: 14 }}>
              <label htmlFor="setting-contactEmail">Public Display Email</label>
              <input
                id="setting-contactEmail"
                type="email"
                value={settings.contactEmail ?? "bijoysarkar7252@gmail.com"}
                onChange={(e) => handleChange("contactEmail", e.target.value)}
              />
              <span className="field-hint">Publicly displayed email on Contact section, Hero, and Footer.</span>
            </div>

            <div className="field">
              <label htmlFor="setting-contactRecipientEmail">Contact Form Destination Inbox</label>
              <input
                id="setting-contactRecipientEmail"
                type="email"
                placeholder="bijoysarkar7252@gmail.com"
                value={settings.contactRecipientEmail ?? "bijoysarkar7252@gmail.com"}
                onChange={(e) => handleChange("contactRecipientEmail", e.target.value)}
              />
              <span className="field-hint">Where visitor messages sent through the Contact Us form will be delivered.</span>
            </div>

            <div className="field">
              <label htmlFor="setting-location">Permanent / Primary Address</label>
              <input
                id="setting-location"
                value={settings.location ?? "Agartala, Tripura, India"}
                onChange={(e) => handleChange("location", e.target.value)}
              />
              <span className="field-hint">Home city/state/country.</span>
            </div>

            <div className="field">
              <label htmlFor="setting-currentLocation">Current / Working Address (Optional)</label>
              <input
                id="setting-currentLocation"
                value={settings.currentLocation ?? ""}
                onChange={(e) => handleChange("currentLocation", e.target.value)}
                placeholder="e.g. Bengaluru, Karnataka, India (or leave blank)"
              />
              <span className="field-hint">For future relocations or internships.</span>
            </div>

            <div className="field">
              <label>Address Display Mode</label>
              <select
                value={settings.displayAddressMode ?? "primary"}
                onChange={(e) => handleChange("displayAddressMode", e.target.value)}
              >
                <option value="primary">Show Primary Address Only (Agartala, Tripura, India)</option>
                <option value="current">Show Current Address Only</option>
                <option value="both">Show Both (Primary &amp; Current)</option>
              </select>
            </div>

            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label htmlFor="setting-googleSheetsWebhookUrl" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Sheet size={14} style={{ color: "#34a853" }} />
                <span>Google Sheets Webhook URL</span>
              </label>
              <input
                id="setting-googleSheetsWebhookUrl"
                placeholder="https://script.google.com/macros/s/.../exec"
                value={settings.googleSheetsWebhookUrl ?? ""}
                onChange={(e) => handleChange("googleSheetsWebhookUrl", e.target.value)}
              />
              <span className="field-hint">
                Deployed Google Apps Script Web App URL. Contact submissions automatically sync here.
              </span>
            </div>
          </div>

          {/* Social Media Links */}
          <div className="admin-card">
            <div className="admin-card-heading">
              <div>
                <p className="section-kicker">Social Media</p>
                <h3>Online Profiles &amp; Handles</h3>
              </div>
            </div>

            <div className="field" style={{ marginTop: 14 }}>
              <label htmlFor="setting-githubUrl">GitHub Profile URL</label>
              <input
                id="setting-githubUrl"
                value={settings.githubUrl ?? "https://github.com/BijoySarkar19"}
                onChange={(e) => handleChange("githubUrl", e.target.value)}
                placeholder="https://github.com/BijoySarkar19"
              />
            </div>

            <div className="field">
              <label htmlFor="setting-linkedinUrl">LinkedIn Profile URL</label>
              <input
                id="setting-linkedinUrl"
                value={settings.linkedinUrl ?? "https://www.linkedin.com/in/bijoysarkar19"}
                onChange={(e) => handleChange("linkedinUrl", e.target.value)}
                placeholder="https://www.linkedin.com/in/bijoysarkar19"
              />
            </div>

            <div className="field">
              <label htmlFor="setting-twitterUrl">X / Twitter Profile URL</label>
              <input
                id="setting-twitterUrl"
                value={settings.twitterUrl ?? "https://x.com/bijoyy_19"}
                onChange={(e) => handleChange("twitterUrl", e.target.value)}
                placeholder="https://x.com/bijoyy_19"
              />
            </div>

            <div className="field">
              <label htmlFor="setting-instagramUrl">Instagram Profile URL</label>
              <input
                id="setting-instagramUrl"
                value={settings.instagramUrl ?? "https://www.instagram.com/bijoyysarkarr?obrf=dW1zenpraWt3eGI="}
                onChange={(e) => handleChange("instagramUrl", e.target.value)}
                placeholder="https://www.instagram.com/username"
              />
            </div>

            <div className="field">
              <label htmlFor="setting-facebookUrl">Facebook Profile URL</label>
              <input
                id="setting-facebookUrl"
                value={settings.facebookUrl ?? "https://www.facebook.com/share/1Cs44JBwnk/"}
                onChange={(e) => handleChange("facebookUrl", e.target.value)}
                placeholder="https://www.facebook.com/..."
              />
            </div>

            <div className="field">
              <label htmlFor="setting-youtubeUrl">YouTube Channel URL</label>
              <input
                id="setting-youtubeUrl"
                value={settings.youtubeUrl ?? ""}
                onChange={(e) => handleChange("youtubeUrl", e.target.value)}
                placeholder="https://youtube.com/@channel (Optional)"
              />
            </div>

            <div className="field">
              <label htmlFor="setting-discordUrl">Discord Profile / Invite URL</label>
              <input
                id="setting-discordUrl"
                value={settings.discordUrl ?? ""}
                onChange={(e) => handleChange("discordUrl", e.target.value)}
                placeholder="https://discord.gg/... (Optional)"
              />
            </div>
          </div>

          {/* Theme Accent & Display Mode */}
          <div className="admin-card">
            <div className="admin-card-heading">
              <div>
                <p className="section-kicker">Aesthetics &amp; Colors</p>
                <h3>Accent Theme &amp; Display Engine</h3>
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <label style={{ display: "block", color: "var(--soft-white)", fontSize: 13, marginBottom: 8, fontWeight: 600 }}>
                Display Theme Mode
              </label>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                {[
                  { mode: "dark", label: "Dark Mode (Default)", icon: Moon },
                  { mode: "light", label: "Light Mode", icon: Sun },
                ].map(({ mode, label, icon: Icon }) => {
                  const isSelected = (settings.themeMode ?? "dark") === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => handleChange("themeMode", mode)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 16px",
                        borderRadius: 10,
                        border: isSelected ? "2px solid var(--orange)" : "1px solid var(--line)",
                        background: isSelected ? "rgba(var(--orange-rgb), 0.12)" : "rgba(255, 255, 255, 0.03)",
                        cursor: "pointer",
                        color: "var(--white)",
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      <Icon size={14} style={{ color: isSelected ? "var(--orange)" : "var(--silver)" }} />
                      <span>{label}</span>
                      {isSelected && <Check size={12} style={{ color: "var(--orange)", marginLeft: 2 }} />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ marginTop: 20 }}>
              <label style={{ display: "block", color: "var(--soft-white)", fontSize: 13, marginBottom: 8, fontWeight: 600 }}>
                Theme Accent Color
              </label>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                {ACCENT_PRESETS.map((preset) => {
                  const isSelected = (settings.themeAccent ?? "#ff5e2c").toLowerCase() === preset.hex.toLowerCase();
                  return (
                    <button
                      key={preset.hex}
                      type="button"
                      onClick={() => handleChange("themeAccent", preset.hex)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 12px",
                        borderRadius: 8,
                        border: isSelected ? `2px solid ${preset.hex}` : "1px solid var(--line)",
                        background: isSelected ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.03)",
                        cursor: "pointer",
                        color: "var(--white)",
                        fontSize: 11,
                      }}
                    >
                      <span
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          background: preset.hex,
                          boxShadow: `0 0 6px ${preset.hex}`,
                        }}
                      />
                      <span>{preset.name}</span>
                      {isSelected && <Check size={11} style={{ color: preset.hex }} />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ marginTop: 28, display: "flex", justifyContent: "flex-end" }}>
              <button className="button" type="submit" disabled={loading} style={{ minWidth: 160 }}>
                <Save size={14} /> {loading ? "Saving Settings..." : "Save Settings"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
