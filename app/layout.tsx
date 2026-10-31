import type { Metadata, Viewport } from "next";
import { Navbar } from "@/components/navigation/Navbar";
import { ScrollCanvas } from "@/components/hero/ScrollCanvas";
import { CustomScrollbar } from "@/components/ui/CustomScrollbar";
import { CleanCopyHandler } from "@/components/ui/CleanCopyHandler";
import { ScrollEdgeEffects } from "@/components/ui/ScrollEdgeEffects";
import { BirthdayCelebration } from "@/components/ui/BirthdayCelebration";
import { prisma } from "@/lib/prisma";
import "@/app/globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:4173";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Bijoy Sarkar — Software Engineer & AI Developer",
  description: "Portfolio of Bijoy Sarkar — Software Engineer and AI Developer building intelligent systems, full-stack applications, AI/ML solutions and secure software.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    title: "Bijoy Sarkar — Software Engineer & AI Developer",
    description: "Building intelligent systems and full-stack solutions.",
    siteName: "Bijoy Sarkar Portfolio",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bijoy Sarkar — Software Engineer & AI Developer",
    description: "Building intelligent systems and full-stack solutions.",
  },
  robots: { index: true, follow: true },
  icons: { icon: "/favicon.svg?v=2", shortcut: "/favicon.svg?v=2" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
};

function hexToRgb(hex: string): string {
  const clean = hex.replace("#", "");
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
  const clean = hex.replace("#", "");
  const num = parseInt(clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean, 16);
  const amt = Math.round(2.55 * percent);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 255) + amt));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 255) + amt));
  const b = Math.min(255, Math.max(0, (num & 255) + amt));
  return `rgb(${r}, ${g}, ${b})`;
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  let themeAccent = "#ff5e2c";
  let themeMode = "dark";
  let gamesEnabled = true;
  let aboutEnabled = true;
  let projectsEnabled = true;
  let resumeEnabled = true;
  let contactEnabled = true;
  let contactEmail = "bijoysarkar7252@gmail.com";

  try {
    const settings = await prisma.siteSetting.findMany();
    const settingsMap: Record<string, string> = {};
    for (const s of settings) {
      settingsMap[s.key] = s.value;
    }
    if (settingsMap.themeAccent) themeAccent = settingsMap.themeAccent;
    if (settingsMap.themeMode) themeMode = settingsMap.themeMode;
    if (settingsMap.gamesEnabled !== undefined) gamesEnabled = settingsMap.gamesEnabled !== "false";
    if (settingsMap.aboutEnabled !== undefined) aboutEnabled = settingsMap.aboutEnabled !== "false";
    if (settingsMap.projectsEnabled !== undefined) projectsEnabled = settingsMap.projectsEnabled !== "false";
    if (settingsMap.resumeEnabled !== undefined) resumeEnabled = settingsMap.resumeEnabled !== "false";
    if (settingsMap.contactEnabled !== undefined) contactEnabled = settingsMap.contactEnabled !== "false";
    if (settingsMap.contactEmail) contactEmail = settingsMap.contactEmail;
  } catch (err) {
    console.error("Failed to load settings in RootLayout:", err);
  }

  const rgb = hexToRgb(themeAccent);
  const isLight = themeMode === "light";

  return (
    <html
      lang="en"
      className={isLight ? "light-mode" : ""}
      data-theme={themeMode}
      suppressHydrationWarning
      style={
        {
          "--theme-accent": themeAccent,
          "--orange": themeAccent,
          "--orange-rgb": rgb,
          "--orange-glow": `rgba(${rgb}, 0.45)`,
          "--orange-soft": `rgba(${rgb}, 0.15)`,
          "--orange-light": lightenHex(themeAccent, 20),
          "--orange-lighter": lightenHex(themeAccent, 35),
        } as React.CSSProperties
      }
    >
      <body suppressHydrationWarning>
        <ScrollCanvas />
        <div className="canvas-atmosphere" aria-hidden="true" />
        <ScrollEdgeEffects />
        <CustomScrollbar />
        <CleanCopyHandler />
        <Navbar
          gamesEnabled={gamesEnabled}
          aboutEnabled={aboutEnabled}
          projectsEnabled={projectsEnabled}
          resumeEnabled={resumeEnabled}
          contactEnabled={contactEnabled}
        />
        <BirthdayCelebration contactEmail={contactEmail} />
        {children}
      </body>
    </html>
  );
}
