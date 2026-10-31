import { About } from "@/components/about/About";
import { Skills } from "@/components/about/Skills";
import { Contact } from "@/components/contact/Contact";
import { Hero } from "@/components/hero/Hero";
import { Footer } from "@/components/Footer";
import { ProjectsSection } from "@/components/projects/ProjectsSection";
import { ResumeViewer } from "@/components/resume/ResumeViewer";
import { GamesSection } from "@/components/games/GamesSection";
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

  // Fallback to published ongoing projects (max 2) if none are explicitly marked
  let finalOngoingRecords = ongoingRecords;
  if (finalOngoingRecords.length === 0) {
    finalOngoingRecords = await prisma.project.findMany({
      where: { published: true, isOngoing: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      take: 2,
    });
  }

  const featuredProjects = homeRecords.map(toPortfolioProject);
  const ongoingProjects = finalOngoingRecords.map(toPortfolioProject);

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

  const gamesEnabled = settingsMap.gamesEnabled !== "false";

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

  return (
    <div className="site-shell">
      <main>
        <Hero
          subhead={settingsMap.heroSubhead}
          bio={settingsMap.heroBio}
          location={settingsMap.location}
          status={settingsMap.status}
          githubUrl={settingsMap.githubUrl}
        />
        <About experiences={experiences} />
        <Skills skillGroups={skillGroups} />
        <ProjectsSection
          projects={featuredProjects}
          ongoingProjects={ongoingProjects}
          totalCount={totalProjectCount}
        />
        <ResumeViewer
          resumePath={resumePathWithVersion}
          filename={activeResume?.filename}
          pages={cvPages}
          pageCount={cvPageCount}
        />
        {gamesEnabled && <GamesSection />}
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
