import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Footer } from "@/components/Footer";
import { ProjectGrid } from "@/components/projects/ProjectGrid";
import { prisma } from "@/lib/prisma";
import { toPortfolioProject, type PortfolioProject } from "@/lib/projects";
import { FALLBACK_PROJECTS } from "@/lib/fallback-data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Projects — Bijoy Sarkar",
  description: "Selected engineering, AI/ML, cybersecurity, full-stack, and mobile projects by Bijoy Sarkar.",
};

export default async function ProjectsPage() {
  let projects: PortfolioProject[] = [];
  try {
    const records = await prisma.project.findMany({
      where: { published: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
    projects = records.map(toPortfolioProject);
  } catch (err) {
    console.warn("Database fallback in ProjectsPage:", err);
  }

  if (projects.length === 0) {
    projects = FALLBACK_PROJECTS.filter((p) => p.published).map((p) => ({
      ...p,
      images: [p.image1, p.image2, p.image3],
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  }

  // Strictly partition: Finished Projects (Real Life Problems, strictly 01 to 15) vs Currently Working / Ongoing Builds
  const finishedProjects = projects.filter((p) => !p.isOngoing);
  const ongoingProjects = projects.filter((p) => p.isOngoing);

  return (
    <div className="site-shell">
      <main className="section projects-section project-index">
        <div className="section-wrap">
          <Link className="back-link" href="/#projects">
            <ArrowLeft size={14} /> Back to portfolio
          </Link>

          {/* Main Directory: Finished Projects (Strictly 01 to 15) */}
          <div className="project-toolbar" data-reveal>
            <div>
              <p className="section-kicker">Project directory · Completed Systems</p>
              <h1 className="section-title">
                Building ideas<br />
                <span className="accent">into systems.</span>
              </h1>
            </div>
            <div>
              <p className="project-count">
                {String(finishedProjects.length).padStart(2, "0")} completed projects in directory
              </p>
              <p className="section-heading-aside">
                A collection of work across applied AI, secure software, web platforms, and mobile development.
              </p>
            </div>
          </div>

          <ProjectGrid projects={finishedProjects} emptyArea="finished projects" />

          {/* In Last: Currently Working Projects (Kept separate from final projects) */}
          {ongoingProjects.length > 0 && (
            <div
              className="projects-subsection ongoing-projects-subsection"
              style={{ marginTop: "70px", paddingTop: "50px", borderTop: "1px solid var(--line)" }}
              data-reveal
            >
              <div className="project-toolbar" style={{ marginBottom: "26px" }}>
                <div>
                  <p
                    className="section-kicker"
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, opacity: 0.9, color: "var(--orange)" }}
                  >
                    <Sparkles size={12} /> Active development
                  </p>
                  <h2
                    className="section-title"
                    style={{ fontSize: "clamp(24px, 3.5vw, 34px)", margin: "4px 0 0", color: "var(--white)" }}
                  >
                    Currently working on.<br />
                    <span className="accent" style={{ opacity: 0.95 }}>
                      Next-generation builds.
                    </span>
                  </h2>
                </div>
                <div>
                  <p className="project-count" style={{ color: "var(--orange)" }}>
                    {String(ongoingProjects.length).padStart(2, "0")} active build{ongoingProjects.length > 1 ? "s" : ""} · In progress
                  </p>
                  <p className="section-heading-aside" style={{ maxWidth: "440px" }}>
                    Software and intelligence platforms undergoing active engineering and architectural iteration. Kept cleanly separated from the completed systems directory.
                  </p>
                </div>
              </div>

              <ProjectGrid projects={ongoingProjects} emptyArea="currently working projects" />
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
