import { prisma } from "@/lib/prisma";
import { AdminNavigation } from "@/components/admin/AdminNavigation";
import { SettingsManager } from "@/components/admin/SettingsManager";
import { existsSync, readFileSync } from "node:fs";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settingsMap: Record<string, string> = {
    heroTitle: "Software Engineer & AI Developer",
    heroSubhead: "Building intelligent systems and full-stack solutions.",
    heroBio: "Computer Science undergraduate focused on AI/ML, secure software, and useful digital products.",
    contactEmail: "bijoysarkar7252@gmail.com",
    contactRecipientEmail: "bijoysarkar7252@gmail.com",
    location: "Agartala, Tripura, India",
    locationMapUrl: "https://maps.google.com/?q=Agartala,+Tripura,+India",
    currentLocation: "",
    currentLocationMapUrl: "",
    displayAddressMode: "primary",
    status: "Open to opportunities",
    githubUrl: "https://github.com/BijoySarkar19",
    linkedinUrl: "https://www.linkedin.com/in/bijoysarkar19",
    twitterUrl: "https://x.com/bijoyy_19",
    instagramUrl: "https://www.instagram.com/bijoysarkarr?obrf=dW1zenpraHRsN3Zw",
    facebookUrl: "https://www.facebook.com/share/1Cs44JBwnk/",
    youtubeUrl: "",
    discordUrl: "",
    googleSheetsWebhookUrl: "https://script.google.com/macros/s/AKfycbxtE4fuHg9Mpp-DuLBfF2ve2cpeWiwKk8IE7Nkw_xO2gOjlYniUzAI3Vw8D4Hy0JrPzNw/exec",
    themeAccent: "#ff5e2c",
    themeMode: "dark",
    heroEnabled: "true",
    aboutEnabled: "true",
    skillsEnabled: "true",
    projectsEnabled: "true",
    resumeEnabled: "true",
    gamesEnabled: "true",
    contactEnabled: "true",
    aboutTitle: "Engineering with purpose and precision.",
    aboutLead: "Computer Science undergraduate with a foundation in artificial intelligence, cybersecurity, full-stack development, and system architecture.",
    aboutBio: "I design and build software that balances technical depth with real-world utility—from local AI security tooling and computer vision segmentation to high-performance web applications and cross-platform mobile apps.",
    skillsTitle: "Skills, languages, and technical disciplines.",
    skillsSubtitle: "A snapshot of the languages, frameworks, developer tools, and domain areas I rely on to build and deploy software.",
    projectsTitle: "Featured engineering & research projects.",
    projectsSubtitle: "Selected software and systems across applied artificial intelligence, computer vision, web engineering, mobile development, and security tooling.",
    ongoingTitle: "Currently Working On",
    ongoingSubtitle: "Active engineering efforts and architectural prototypes in active development.",
    resumeTitle: "Experience in the details.",
    resumeSubtitle: "Education, internships, technical work, and the projects behind this portfolio—all in one place.",
    gamesTitle: "Take a break.",
    gamesSubtitle: "Two fast arcade mini-games built for keyboard and touch. Jump in anytime.",
    contactTitle: "Have a project or opportunity in mind?",
    contactSubtitle: "Drop a note below or reach out directly—I typically respond within 24 hours.",
    degreesList: JSON.stringify([
      {
        id: "btech-degree",
        degree: "B.Tech · Computer Science & Engineering",
        institution: "ICFAI University Tripura",
        link: "https://www.iutripura.edu.in/",
        period: "2023 - 2027",
        showOnHome: true,
      },
    ]),
  };

  try {
    const settingsRecords = await prisma.siteSetting.findMany();
    for (const s of settingsRecords) {
      settingsMap[s.key] = s.value;
    }
  } catch (err) {
    console.warn("Prisma error caught on AdminSettingsPage:", err);
  }

  // Cross-route fallback store in /tmp
  try {
    const storePath = "/tmp/settings-store.json";
    if (existsSync(storePath)) {
      const stored = JSON.parse(readFileSync(storePath, "utf-8"));
      for (const [k, v] of Object.entries(stored)) {
        if (typeof v === "string") settingsMap[k] = v;
      }
    }
  } catch (err) {
    console.warn("Could not read /tmp/settings-store.json:", err);
  }

  return (
    <main>
      <div className="admin-topline">
        <div>
          <p className="section-kicker">Configuration</p>
          <h1>Site Settings</h1>
        </div>
      </div>
      <AdminNavigation active="settings" />
      <SettingsManager initialSettings={settingsMap} />
    </main>
  );
}
