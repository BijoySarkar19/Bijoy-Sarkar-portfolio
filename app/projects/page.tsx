import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Footer } from "@/components/Footer";
import { ProjectGrid } from "@/components/projects/ProjectGrid";
import { prisma } from "@/lib/prisma";
import { toPortfolioProject, type PortfolioProject } from "@/lib/projects";
import { FALLBACK_PROJECTS } from "@/lib/fallback-data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Projects — Bijoy Sarkar", description: "Selected engineering, AI/ML, cybersecurity, full-stack, and mobile projects by Bijoy Sarkar." };

export default async function ProjectsPage() {
  let projects: PortfolioProject[] = [];
  try {
    const records = await prisma.project.findMany({ where: { published: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] });
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
  return (
    <div className="site-shell">
      <main className="section projects-section project-index">
        <div className="section-wrap">
          <Link className="back-link" href="/#projects"><ArrowLeft size={14} /> Back to portfolio</Link>
          <div className="project-toolbar" data-reveal>
            <div><p className="section-kicker">Project index</p><h1 className="section-title">Building ideas<br /><span className="accent">into systems.</span></h1></div>
            <p className="section-heading-aside">A collection of work across applied AI, secure software, web platforms, and mobile development.</p>
          </div>
          <ProjectGrid projects={projects} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
