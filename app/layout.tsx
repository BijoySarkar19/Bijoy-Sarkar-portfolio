import type { Metadata, Viewport } from "next";
import { Navbar } from "@/components/navigation/Navbar";
import { ScrollCanvas } from "@/components/hero/ScrollCanvas";
import { CustomScrollbar } from "@/components/ui/CustomScrollbar";
import { CleanCopyHandler } from "@/components/ui/CleanCopyHandler";
import { ScrollEdgeEffects } from "@/components/ui/ScrollEdgeEffects";
import { InteractiveAudioProvider } from "@/components/ui/InteractiveAudioProvider";
import { prisma } from "@/lib/prisma";
import "@/app/globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:4173";

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

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  let themeAccent = "#ff5e2c";
  let soundEnabled = true;
  let gamesEnabled = true;

  try {
    const settings = await prisma.siteSetting.findMany();
    const settingsMap: Record<string, string> = {};
    for (const s of settings) {
      settingsMap[s.key] = s.value;
    }
    if (settingsMap.themeAccent) themeAccent = settingsMap.themeAccent;
    if (settingsMap.soundEnabled !== undefined) soundEnabled = settingsMap.soundEnabled !== "false";
    if (settingsMap.gamesEnabled !== undefined) gamesEnabled = settingsMap.gamesEnabled !== "false";
  } catch (err) {
    console.error("Failed to load settings in RootLayout:", err);
  }

  const rgb = hexToRgb(themeAccent);

  return (
    <html
      lang="en"
      suppressHydrationWarning
      style={
        {
          "--theme-accent": themeAccent,
          "--orange": themeAccent,
          "--orange-rgb": rgb,
          "--orange-glow": `rgba(${rgb}, 0.45)`,
          "--orange-soft": `rgba(${rgb}, 0.15)`,
        } as React.CSSProperties
      }
    >
      <body suppressHydrationWarning>
        <ScrollCanvas />
        <div className="canvas-atmosphere" aria-hidden="true" />
        <ScrollEdgeEffects />
        <CustomScrollbar />
        <CleanCopyHandler />
        <InteractiveAudioProvider soundEnabled={soundEnabled} />
        <Navbar gamesEnabled={gamesEnabled} />
        {children}
      </body>
    </html>
  );
}
