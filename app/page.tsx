import { About } from "@/components/about/About";
import { Skills } from "@/components/about/Skills";
import { Contact } from "@/components/contact/Contact";
import { Hero } from "@/components/hero/Hero";
import { Footer } from "@/components/Footer";
import { ProjectsSection } from "@/components/projects/ProjectsSection";
import { ResumeViewer } from "@/components/resume/ResumeViewer";
import { GamesSection } from "@/components/games/GamesSection";
import { SocialIconName } from "@/components/ui/SocialIcon";
import { parseDegrees, type DegreeItem } from "@/lib/degrees";
import { prisma } from "@/lib/prisma";
import { toPortfolioProject } from "@/lib/projects";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [
    explicitFeatured,
    ongoingRecords,
    totalProjectCount,
    dbExperiences,
    dbSkillGroups,
    activeResume,
    dbSettings,
  ] = await Promise.all([
    // 1. Projects selected by admin for Main Page Top 5
    prisma.project.findMany({
      where: { published: true, isOngoing: false, featuredOnHome: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      take: 5,
    }),
    // 2. Currently Working Projects (e.g. CivicLens Core, max 2 on Main Page)
    prisma.project.findMany({
      where: { published: true, isOngoing: true, featuredOnHome: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      take: 2,
    }),
    prisma.project.count({ where: { published: true } }),
    prisma.workExperience.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] }),
    prisma.skillGroup.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
    prisma.resumeFile.findFirst({ where: { active: true } }),
    prisma.siteSetting.findMany(),
  ]);

  // If fewer than 5 explicit home projects, fill remaining up to 5 from main published projects
  let homeRecords = explicitFeatured;
  if (homeRecords.length < 5) {
    const chosenIds = explicitFeatured.map((p) => p.id);
    const filler = await prisma.project.findMany({
      where: { published: true, isOngoing: false, id: { notIn: chosenIds } },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      take: 5 - homeRecords.length,
    });
    homeRecords = [...homeRecords, ...filler];
  }

  const settingsMap: Record<string, string> = {};
  for (const s of dbSettings) {
    settingsMap[s.key] = s.value;
  }

  const featuredProjects = homeRecords.map(toPortfolioProject);
  const ongoingProjects = ongoingRecords.map(toPortfolioProject);

  const experiences = dbExperiences.map((e) => ({
    period: e.period,
    role: e.role,
    organization: e.organization,
    summary: e.summary,
    tags: typeof e.tags === "string" ? JSON.parse(e.tags || "[]") : e.tags,
  }));

  const skillGroups = dbSkillGroups.map((g) => ({
    title: g.title,
    note: g.note,
    icon: g.icon,
    skills: typeof g.skills === "string" ? JSON.parse(g.skills || "[]") : g.skills,
  }));

  // Parse degrees from settings or fallback
  const degrees: DegreeItem[] = parseDegrees(settingsMap.degreesList);

  // Section module flags (Default: all enabled)
  const heroEnabled = settingsMap.heroEnabled !== "false";
  const aboutEnabled = settingsMap.aboutEnabled !== "false";
  const skillsEnabled = settingsMap.skillsEnabled !== "false";
  const projectsEnabled = settingsMap.projectsEnabled !== "false";
  const resumeEnabled = settingsMap.resumeEnabled !== "false";
  const gamesEnabled = settingsMap.gamesEnabled !== "false";
  const contactEnabled = settingsMap.contactEnabled !== "false";

  // Prevent browser PDF caching with deterministic version timestamp
  const resumeVersion = activeResume?.updatedAt ? new Date(activeResume.updatedAt).getTime() : 1;
  const resumePathWithVersion = activeResume?.path ? `${activeResume.path}?v=${resumeVersion}` : null;

  // Read rendered CV preview pages from manifest
  let cvPages = ["/cv-pages/page-1.png", "/cv-pages/page-2.png", "/cv-pages/page-3.png"];
  let cvPageCount = 3;
  try {
    const manifestPath = join(process.cwd(), "public", "cv-pages", "manifest.json");
    if (existsSync(manifestPath)) {
      const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
      if (Array.isArray(manifest?.pages) && manifest.pages.length > 0) {
        cvPages = manifest.pages.map((p: string) => `${p}?v=${manifest.updatedAt || resumeVersion}`);
        cvPageCount = manifest.pageCount || manifest.pages.length;
      }
    }
  } catch (err) {
    console.error("Could not load CV manifest:", err);
  }

  // Construct dynamic social links from settingsMap with graceful defaults
  const dynamicSocialLinks: { label: string; href: string; icon: SocialIconName }[] = [];

  const github = settingsMap.githubUrl ?? "https://github.com/BijoySarkar19";
  if (github) dynamicSocialLinks.push({ label: "GitHub", href: github, icon: "github" });

  const linkedin = settingsMap.linkedinUrl ?? "https://www.linkedin.com/in/bijoysarkar19";
  if (linkedin) dynamicSocialLinks.push({ label: "LinkedIn", href: linkedin, icon: "linkedin" });

  const instagram = settingsMap.instagramUrl ?? "https://www.instagram.com/bijoyysarkarr?obrf=dW1zenpraWt3eGI=";
  if (instagram) dynamicSocialLinks.push({ label: "Instagram", href: instagram, icon: "instagram" });

  const facebook = settingsMap.facebookUrl ?? "https://www.facebook.com/share/1Cs44JBwnk/";
  if (facebook) dynamicSocialLinks.push({ label: "Facebook", href: facebook, icon: "facebook" });

  const twitter = settingsMap.twitterUrl ?? "https://x.com/bijoyy_19";
  if (twitter) dynamicSocialLinks.push({ label: "X", href: twitter, icon: "x" });

  const youtube = settingsMap.youtubeUrl;
  if (youtube) dynamicSocialLinks.push({ label: "YouTube", href: youtube, icon: "youtube" });

  const discord = settingsMap.discordUrl;
  if (discord) dynamicSocialLinks.push({ label: "Discord", href: discord, icon: "discord" });

  const publicEmail = settingsMap.contactEmail || "bijoysarkar7252@gmail.com";

  // Address resolution
  const primaryLoc = settingsMap.location || "Agartala, Tripura, India";
  const primaryMapUrl = settingsMap.locationMapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(primaryLoc)}`;
  const currentLoc = settingsMap.currentLocation || "";
  const currentMapUrl = settingsMap.currentLocationMapUrl || (currentLoc ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(currentLoc)}` : "");
  const addrMode = settingsMap.displayAddressMode || "primary";

  let resolvedLocation = primaryLoc;
  let resolvedMapUrl = primaryMapUrl;
  if (addrMode === "current" && currentLoc) {
    resolvedLocation = currentLoc;
    resolvedMapUrl = currentMapUrl || primaryMapUrl;
  } else if (addrMode === "both" && currentLoc) {
    resolvedLocation = `${primaryLoc} · Current: ${currentLoc}`;
    resolvedMapUrl = primaryMapUrl;
  }

  return (
    <div className="site-shell">
      <main>
        {heroEnabled && (
          <Hero
            subhead={settingsMap.heroSubhead}
            bio={settingsMap.heroBio}
            location={resolvedLocation}
            locationMapUrl={resolvedMapUrl}
            status={settingsMap.status}
            githubUrl={settingsMap.githubUrl}
            degrees={degrees}
          />
        )}
        {aboutEnabled && (
          <About
            experiences={experiences}
            degrees={degrees}
            aboutTitle={settingsMap.aboutTitle}
            aboutBio={settingsMap.aboutBio}
            aboutLead={settingsMap.aboutLead}
          />
        )}
        {skillsEnabled && (
          <Skills
            skillGroups={skillGroups}
            skillsTitle={settingsMap.skillsTitle}
            skillsSubtitle={settingsMap.skillsSubtitle}
          />
        )}
        {projectsEnabled && (
          <ProjectsSection
            projects={featuredProjects}
            ongoingProjects={ongoingProjects}
            totalCount={totalProjectCount}
            projectsTitle={settingsMap.projectsTitle}
            projectsSubtitle={settingsMap.projectsSubtitle}
            ongoingTitle={settingsMap.ongoingTitle}
            ongoingSubtitle={settingsMap.ongoingSubtitle}
          />
        )}
        {resumeEnabled && (
          <ResumeViewer
            resumePath={resumePathWithVersion}
            filename={activeResume?.filename}
            pages={cvPages}
            pageCount={cvPageCount}
            resumeTitle={settingsMap.resumeTitle}
            resumeSubtitle={settingsMap.resumeSubtitle}
          />
        )}
        {gamesEnabled && (
          <GamesSection
            gamesTitle={settingsMap.gamesTitle}
            gamesSubtitle={settingsMap.gamesSubtitle}
          />
        )}
        {contactEnabled && (
          <Contact
            email={publicEmail}
            location={resolvedLocation}
            locationMapUrl={resolvedMapUrl}
            socialLinks={dynamicSocialLinks}
            contactTitle={settingsMap.contactTitle}
            contactSubtitle={settingsMap.contactSubtitle}
          />
        )}
      </main>
      <Footer email={publicEmail} socialLinks={dynamicSocialLinks} />
    </div>
  );
}
