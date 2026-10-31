"use client";

import { useState } from "react";
import { Save, Undo2, Sliders, Sparkles, Volume2, Gamepad2, Mail, MapPin, Globe, Check, Sheet } from "lucide-react";
import { useRouter } from "next/navigation";

export interface SiteSettingsMap {
  heroTitle?: string;
  heroSubhead?: string;
  heroBio?: string;
  contactEmail?: string;
  location?: string;
  status?: string;
  githubUrl?: string;
  themeAccent?: string;
  soundEnabled?: string;
  gamesEnabled?: string;
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

  function handleChange(key: string, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save settings.");

      if (data.settings) {
        setSettings(data.settings);
      }
      setLastAuditId(data.auditLogId || null);
      setMessage({
        text: "Portfolio settings updated and saved! Recorded in audit log with Indian Time (IST).",
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

      // Refresh settings from server
      const refreshRes = await fetch("/api/admin/settings");
      const refreshData = await refreshRes.json();
      if (refreshData.settings) setSettings(refreshData.settings);
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
              style={{ background: "rgba(255, 94, 44, 0.2)", border: "1px solid var(--orange)", color: "var(--white)", fontWeight: 700 }}
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
            Customize hero headline, contact details, status, color accents, and feature flags. Every update is tracked with Indian Standard Time (IST) audit logs and can be reverted anytime.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="admin-form">
        <div className="admin-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 20 }}>
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
              <span className="field-hint">Displayed in the large hero heading.</span>
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
                value={settings.heroBio ?? "Computer Science undergraduate focused on AI/ML, secure software, and useful digital products."}
                onChange={(e) => handleChange("heroBio", e.target.value)}
              />
            </div>
          </div>

          {/* Contact & Availability */}
          <div className="admin-card">
            <div className="admin-card-heading">
              <div>
                <p className="section-kicker">Availability &amp; Contacts</p>
                <h3>Public Contact Information</h3>
              </div>
            </div>

            <div className="field" style={{ marginTop: 14 }}>
              <label htmlFor="setting-contactEmail">Contact Email Address</label>
              <input
                id="setting-contactEmail"
                type="email"
                value={settings.contactEmail ?? "bijoysarkar190@gmail.com"}
                onChange={(e) => handleChange("contactEmail", e.target.value)}
              />
              <span className="field-hint">Recipients for public contact inquiries.</span>
            </div>

            <div className="field">
              <label htmlFor="setting-location">Location / Region</label>
              <input
                id="setting-location"
                value={settings.location ?? "Agartala, India"}
                onChange={(e) => handleChange("location", e.target.value)}
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

            <div className="field">
              <label htmlFor="setting-githubUrl">GitHub Profile URL</label>
              <input
                id="setting-githubUrl"
                value={settings.githubUrl ?? "https://github.com/BijoySarkar19"}
                onChange={(e) => handleChange("githubUrl", e.target.value)}
              />
            </div>

            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label htmlFor="setting-googleSheetsWebhookUrl" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Sheet size={14} style={{ color: "#34a853" }} />
                <span>Google Sheets Webhook URL (for bijoysarkar7252@gmail.com)</span>
              </label>
              <input
                id="setting-googleSheetsWebhookUrl"
                placeholder="https://script.google.com/macros/s/.../exec"
                value={settings.googleSheetsWebhookUrl ?? ""}
                onChange={(e) => handleChange("googleSheetsWebhookUrl", e.target.value)}
              />
              <span className="field-hint">
                Paste your deployed Google Apps Script Web App URL here. Submissions will automatically append to your live Google Sheet and alert bijoysarkar7252@gmail.com.
              </span>
            </div>
          </div>

          {/* Theme & Features */}
          <div className="admin-card" style={{ gridColumn: "1 / -1" }}>
            <div className="admin-card-heading">
              <div>
                <p className="section-kicker">Aesthetics &amp; Feature Flags</p>
                <h3>Accent Theme &amp; Interactive Engine</h3>
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <label style={{ display: "block", color: "var(--soft-white)", fontSize: 13, marginBottom: 8, fontWeight: 600 }}>
                Theme Accent Color
              </label>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
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
                        gap: 8,
                        padding: "8px 14px",
                        borderRadius: 10,
                        border: isSelected ? `2px solid ${preset.hex}` : "1px solid var(--line)",
                        background: isSelected ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.03)",
                        cursor: "pointer",
                        color: "var(--white)",
                        fontSize: 12,
                      }}
                    >
                      <span
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: "50%",
                          background: preset.hex,
                          boxShadow: `0 0 8px ${preset.hex}`,
                        }}
                      />
                      <span>{preset.name}</span>
                      {isSelected && <Check size={12} style={{ color: preset.hex }} />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginTop: 24 }}>
              <div style={{ padding: 16, borderRadius: 12, border: "1px solid var(--line)", background: "rgba(255,255,255,0.02)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <strong style={{ color: "var(--white)", fontSize: 13 }}>Interactive Web Audio FX</strong>
                    <p style={{ margin: "4px 0 0", color: "var(--subtle)", fontSize: 11 }}>Synthesizes tactile UI cyber clicks and game audio.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={(settings.soundEnabled ?? "true") === "true"}
                    onChange={(e) => handleChange("soundEnabled", e.target.checked ? "true" : "false")}
                    style={{ width: 18, height: 18, accentColor: "var(--orange)" }}
                  />
                </div>
              </div>

              <div style={{ padding: 16, borderRadius: 12, border: "1px solid var(--line)", background: "rgba(255,255,255,0.02)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <strong style={{ color: "var(--white)", fontSize: 13 }}>Portfolio Mini-Games Section</strong>
                    <p style={{ margin: "4px 0 0", color: "var(--subtle)", fontSize: 11 }}>Enables 2048 &amp; Signal Pairs memory challenge.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={(settings.gamesEnabled ?? "true") === "true"}
                    onChange={(e) => handleChange("gamesEnabled", e.target.checked ? "true" : "false")}
                    style={{ width: 18, height: 18, accentColor: "var(--orange)" }}
                  />
                </div>
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
