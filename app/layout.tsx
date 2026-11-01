import type { Metadata, Viewport } from "next";
import { Navbar } from "@/components/navigation/Navbar";
import { ScrollCanvas } from "@/components/hero/ScrollCanvas";
import { CustomScrollbar } from "@/components/ui/CustomScrollbar";
import { CleanCopyHandler } from "@/components/ui/CleanCopyHandler";
import { ScrollEdgeEffects } from "@/components/ui/ScrollEdgeEffects";
import { BirthdayCelebration } from "@/components/ui/BirthdayCelebration";
import { prisma } from "@/lib/prisma";
import { getSiteUrl } from "@/lib/site-url";
import "@/app/globals.css";

const siteUrl = getSiteUrl();

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Bijoy Sarkar — Portfolio | Software Engineer & AI Developer",
    template: "%s | Bijoy Sarkar",
  },
  description:
    "Official portfolio of Bijoy Sarkar, Software Engineer and AI Developer based in Agartala, India. Discover intelligent systems, full-stack applications, CivicLens Core, machine learning engineering, and curriculum vitae at bijoy-sarkar-portfolio.vercel.app.",
  keywords: [
    "Bijoy Sarkar",
    "Bijoy Sarkar portfolio",
    "bijoy sarkar portfolio .vercel.app",
    "bijoy-sarkar-portfolio.vercel.app",
    "bijoysarkar",
    "Bijoy Sarkar software engineer",
    "Bijoy Sarkar AI developer",
    "Bijoy Sarkar ICFAI University Tripura",
    "Bijoy Sarkar Agartala",
    "Bijoy Sarkar Tripura",
    "Bijoy Sarkar developer",
    "CivicLens Core",
    "Rakshak AI",
    "Software Engineer portfolio",
    "AI Developer portfolio",
    "Full Stack Engineer",
    "Machine Learning Developer",
    "Next.js Portfolio",
    "React",
    "TypeScript",
    "Python",
    "Docker"
  ],
  authors: [{ name: "Bijoy Sarkar", url: siteUrl }],
  creator: "Bijoy Sarkar",
  publisher: "Bijoy Sarkar",
  alternates: { canonical: siteUrl },
  openGraph: {
    type: "profile",
    locale: "en_US",
    url: siteUrl,
    title: "Bijoy Sarkar — Portfolio | Software Engineer & AI Developer",
    description:
      "Official portfolio of Bijoy Sarkar, Software Engineer and AI Developer. Intelligent systems, full-stack builds, and CV at bijoy-sarkar-portfolio.vercel.app.",
    siteName: "Bijoy Sarkar Portfolio",
    images: [
      {
        url: `${siteUrl}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "Bijoy Sarkar — Software Engineer & AI Developer Portfolio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bijoy Sarkar — Portfolio | Software Engineer & AI Developer",
    description:
      "Official portfolio of Bijoy Sarkar, Software Engineer and AI Developer at bijoy-sarkar-portfolio.vercel.app.",
    creator: "@bijoyy_19",
    site: "@bijoyy_19",
    images: [`${siteUrl}/twitter-image`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: { icon: "/favicon.svg?v=2", shortcut: "/favicon.svg?v=2" },
  verification: {
    google: "google220d1e3d7cee1635",
  },
  category: "technology",
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
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  "@id": `${siteUrl}/#website`,
                  url: siteUrl,
                  name: "Bijoy Sarkar Portfolio",
                  alternateName: [
                    "bijoy sarkar portfolio",
                    "bijoy sarkar portfolio .vercel.app",
                    "bijoy-sarkar-portfolio.vercel.app",
                    "Bijoy Sarkar Official Website",
                  ],
                  description:
                    "Official portfolio of Bijoy Sarkar — Software Engineer and AI Developer.",
                  publisher: {
                    "@id": `${siteUrl}/#person`,
                  },
                  inLanguage: "en-US",
                },
                {
                  "@type": "Person",
                  "@id": `${siteUrl}/#person`,
                  name: "Bijoy Sarkar",
                  alternateName: ["Bijoy Sarkar", "BijoySarkar19", "Bijoy Sarkar Portfolio"],
                  url: siteUrl,
                  image: `${siteUrl}/opengraph-image`,
                  jobTitle: "Software Engineer & AI Developer",
                  worksFor: {
                    "@type": "Organization",
                    name: "Software Engineering & AI Systems",
                  },
                  alumniOf: {
                    "@type": "EducationalOrganization",
                    name: "ICFAI University Tripura",
                    url: "https://www.iutripura.edu.in/",
                  },
                  address: {
                    "@type": "PostalAddress",
                    addressLocality: "Agartala",
                    addressRegion: "Tripura",
                    addressCountry: "India",
                  },
                  sameAs: [
                    "https://github.com/BijoySarkar19",
                    "https://www.linkedin.com/in/bijoysarkar19",
                    "https://x.com/bijoyy_19",
                    "https://www.instagram.com/bijoyysarkarr",
                    "https://facebook.com/share/1Cs44JBwnk/",
                  ],
                  knowsAbout: [
                    "Artificial Intelligence",
                    "Machine Learning",
                    "Full-Stack Software Engineering",
                    "Cybersecurity",
                    "React",
                    "Next.js",
                    "TypeScript",
                    "Python",
                    "FastAPI",
                    "Docker",
                  ],
                },
              ],
            }),
          }}
        />
      </head>
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
