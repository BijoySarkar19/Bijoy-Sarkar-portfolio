import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { existsSync, readFileSync } from "node:fs";
import { Navbar } from "@/components/navigation/Navbar";
import { ScrollCanvas } from "@/components/hero/ScrollCanvas";
import { CustomScrollbar } from "@/components/ui/CustomScrollbar";
import { CleanCopyHandler } from "@/components/ui/CleanCopyHandler";
import { ScrollRevealHandler } from "@/components/ui/ScrollRevealHandler";
import { ScrollEdgeEffects } from "@/components/ui/ScrollEdgeEffects";
import { BirthdayCelebration } from "@/components/ui/BirthdayCelebration";
import { ClientThemeSync } from "@/components/ui/ClientThemeSync";
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
      {
        url: `${siteUrl}/bijoy-sarkar.jpg`,
        width: 720,
        height: 720,
        alt: "Bijoy Sarkar — Software Engineer & AI Developer",
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
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
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

  // Cross-route fallback store in /tmp
  try {
    const storePath = "/tmp/settings-store.json";
    if (existsSync(storePath)) {
      const stored = JSON.parse(readFileSync(storePath, "utf-8"));
      if (stored.themeAccent) themeAccent = stored.themeAccent;
      if (stored.themeMode) themeMode = stored.themeMode;
    }
  } catch {}

  // Request cookies provide immediate sync across serverless instances
  try {
    const cookieStore = await cookies();
    const cookieAccent = cookieStore.get("portfolio_theme_accent")?.value;
    const cookieMode = cookieStore.get("portfolio_theme_mode")?.value;
    if (cookieAccent) themeAccent = cookieAccent;
    if (cookieMode) themeMode = cookieMode;
  } catch {}

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
        {/* Instant zero-flicker theme synchronization script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=document.cookie.match(/portfolio_theme_accent=([^;]+)/);var a=m?decodeURIComponent(m[1]):(localStorage.getItem('site_theme_accent')||'');if(!a){var s=localStorage.getItem('admin_site_settings');if(s){var p=JSON.parse(s);if(p.themeAccent)a=p.themeAccent;}}if(a){document.documentElement.style.setProperty('--theme-accent',a);document.documentElement.style.setProperty('--orange',a);var c=a.replace('#','');if(c.length===6){var r=parseInt(c.substring(0,2),16),g=parseInt(c.substring(2,4),16),b=parseInt(c.substring(4,6),16);document.documentElement.style.setProperty('--orange-rgb',r+','+g+','+b);document.documentElement.style.setProperty('--orange-glow','rgba('+r+','+g+','+b+',0.45)');document.documentElement.style.setProperty('--orange-soft','rgba('+r+','+g+','+b+',0.15)');}}var modeM=document.cookie.match(/portfolio_theme_mode=([^;]+)/);var mode=modeM?decodeURIComponent(modeM[1]):(localStorage.getItem('site_theme_mode')||'');if(mode==='light'){document.documentElement.classList.add('light-mode');document.documentElement.setAttribute('data-theme','light');}}catch(e){}})()`,
          }}
        />

        {/* OpenSearch Auto-Discovery for Chrome, Firefox, Opera, Edge search suggestions */}
        <link rel="search" type="application/opensearchdescription+xml" href="/opensearch.xml" title="Bijoy Sarkar Portfolio" />

        {/* Microsoft Edge & Windows Tile Metadata */}
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#ff5e2c" />
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
                    "Bijoy Sarkar",
                    "bijoy sarkar portfolio",
                    "bijoy sarkar portfolio .vercel.app",
                    "bijoy-sarkar-portfolio.vercel.app",
                    "Bijoy Sarkar Official Website",
                    "Bijoy Sarkar Developer Portfolio",
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
                  givenName: "Bijoy",
                  familyName: "Sarkar",
                  alternateName: ["Bijoy Sarkar", "BijoySarkar19", "Bijoy Sarkar Portfolio"],
                  url: siteUrl,
                  image: `${siteUrl}/bijoy-sarkar.jpg`,
                  jobTitle: "Software Engineer & AI Developer",
                  description:
                    "Official portfolio and personal website of Bijoy Sarkar, Software Engineer and AI Developer based in Agartala, Tripura, India.",
                  disambiguatingDescription:
                    "Bijoy Sarkar is an Indian Software Engineer, AI Developer, and Full-Stack Developer based in Agartala, Tripura, India, pursuing a B.Tech in Computer Science and Engineering at ICFAI University Tripura (GitHub: BijoySarkar19). This is the official portfolio of Bijoy Sarkar (https://bijoy-sarkar-portfolio.vercel.app), distinct from Bengali folk saint/singer Bijoy Sarkar (1903–1985) and distinct from Quality Analyst Bijoy Kumar Sarkar.",
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
                    "https://sites.google.com/view/bijoysarkar/home",
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
                {
                  "@type": "FAQPage",
                  "@id": `${siteUrl}/#faq`,
                  mainEntity: [
                    {
                      "@type": "Question",
                      name: "What is the official portfolio website of Bijoy Sarkar?",
                      acceptedAnswer: {
                        "@type": "Answer",
                        text: "The official portfolio website of Bijoy Sarkar is https://bijoy-sarkar-portfolio.vercel.app. It features his software engineering projects (including CivicLens Core and Rakshak-AI), education at ICFAI University Tripura, work experience, interactive intermission builds, and verified curriculum vitae.",
                      },
                    },
                    {
                      "@type": "Question",
                      name: "Who is Bijoy Sarkar?",
                      acceptedAnswer: {
                        "@type": "Answer",
                        text: "Bijoy Sarkar is a Software Engineer and AI Developer based in Agartala, Tripura, India, pursuing a B.Tech in Computer Science and Engineering at ICFAI University Tripura. He specializes in full-stack engineering, machine learning systems, Next.js, TypeScript, and Python. His official portfolio is accessible at https://bijoy-sarkar-portfolio.vercel.app.",
                      },
                    },
                    {
                      "@type": "Question",
                      name: "Is Bijoy Sarkar the same as Bijoy Kumar Sarkar?",
                      acceptedAnswer: {
                        "@type": "Answer",
                        text: "No. Bijoy Sarkar is a Software Engineer and AI Developer based in Agartala, Tripura, India studying at ICFAI University Tripura (GitHub: BijoySarkar19). His official portfolio is https://bijoy-sarkar-portfolio.vercel.app, which is completely distinct from any person named Bijoy Kumar Sarkar.",
                      },
                    },
                    {
                      "@type": "Question",
                      name: "Where can I view Bijoy Sarkar's projects and resume?",
                      acceptedAnswer: {
                        "@type": "Answer",
                        text: "You can explore Bijoy Sarkar's projects (CivicLens Core, Aether, Expense Tracker, Rakshak-AI) and verified curriculum vitae directly at https://bijoy-sarkar-portfolio.vercel.app.",
                      },
                    },
                  ],
                },
              ],
            }),
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <ClientThemeSync initialAccent={themeAccent} initialMode={themeMode} />
        <ScrollCanvas />
        <div className="canvas-atmosphere" aria-hidden="true" />
        <ScrollEdgeEffects />
        <CustomScrollbar />
        <CleanCopyHandler />
        <ScrollRevealHandler />
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
