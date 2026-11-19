"use client";

import { useEffect } from "react";

function hexToRgb(hex: string): string {
  const clean = hex.replace("#", "").trim();
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return `${r}, ${g}, ${b}`;
  }
  if (clean.length === 6) {
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return `${r}, ${g}, ${b}`;
  }
  return "255, 94, 44";
}

function lightenHex(hex: string, percent: number): string {
  const clean = hex.replace("#", "").trim();
  const num = parseInt(clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean, 16);
  if (isNaN(num)) return hex;
  const amt = Math.round(2.55 * percent);
  const r = Math.min(255, Math.max(0, (num >> 16) + amt));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amt));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amt));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function applyThemeVariables(accent: string, mode?: string) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const cleanAccent = accent.trim();
  if (!cleanAccent) return;

  const rgb = hexToRgb(cleanAccent);
  root.style.setProperty("--theme-accent", cleanAccent);
  root.style.setProperty("--orange", cleanAccent);
  root.style.setProperty("--orange-rgb", rgb);
  root.style.setProperty("--orange-glow", `rgba(${rgb}, 0.45)`);
  root.style.setProperty("--orange-soft", `rgba(${rgb}, 0.15)`);
  root.style.setProperty("--orange-light", lightenHex(cleanAccent, 20));
  root.style.setProperty("--orange-lighter", lightenHex(cleanAccent, 35));

  if (mode) {
    root.setAttribute("data-theme", mode);
    if (mode === "light") {
      root.classList.add("light-mode");
    } else {
      root.classList.remove("light-mode");
    }
  }

  // Also broadcast custom event for ongoing artwork components
  window.dispatchEvent(new CustomEvent("portfolio-theme-accent-change", { detail: { accent: cleanAccent, rgb, mode } }));
}

export function ClientThemeSync({ initialAccent, initialMode }: { initialAccent?: string; initialMode?: string }) {
  useEffect(() => {
    // 1. Check cookies first
    let activeAccent = initialAccent || "";
    let activeMode = initialMode || "";

    const cookies = document.cookie.split(";").map((c) => c.trim());
    for (const c of cookies) {
      if (c.startsWith("portfolio_theme_accent=")) {
        activeAccent = decodeURIComponent(c.split("=")[1]);
      }
      if (c.startsWith("portfolio_theme_mode=")) {
        activeMode = decodeURIComponent(c.split("=")[1]);
      }
    }

    // 2. Check localStorage as high-priority fallback
    try {
      const localAccent = localStorage.getItem("site_theme_accent");
      if (localAccent) activeAccent = localAccent;

      const localSettings = localStorage.getItem("admin_site_settings");
      if (localSettings) {
        const parsed = JSON.parse(localSettings);
        if (parsed.themeAccent) activeAccent = parsed.themeAccent;
        if (parsed.themeMode) activeMode = parsed.themeMode;
      }
    } catch {}

    if (activeAccent) {
      applyThemeVariables(activeAccent, activeMode);
    }

    // Listen for cross-window / tab changes
    function onStorage(e: StorageEvent) {
      if (e.key === "site_theme_accent" && e.newValue) {
        applyThemeVariables(e.newValue);
      }
      if (e.key === "admin_site_settings" && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed.themeAccent) applyThemeVariables(parsed.themeAccent, parsed.themeMode);
        } catch {}
      }
    }

    function onThemeChange(e: Event) {
      const customEvent = e as CustomEvent<{ accent?: string; mode?: string }>;
      if (customEvent.detail?.accent) {
        applyThemeVariables(customEvent.detail.accent, customEvent.detail.mode);
      }
    }

    window.addEventListener("storage", onStorage);
    window.addEventListener("portfolio-theme-change", onThemeChange);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("portfolio-theme-change", onThemeChange);
    };
  }, [initialAccent, initialMode]);

  return null;
}
