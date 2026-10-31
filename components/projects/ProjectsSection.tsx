import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import type { PortfolioProject } from "@/lib/projects";
import { ProjectGrid } from "@/components/projects/ProjectGrid";
import { UpcomingNotice } from "@/components/ui/UpcomingNotice";

export interface ProjectsSectionProps {
  projects: PortfolioProject[];
  ongoingProjects?: PortfolioProject[];
  totalCount: number;
  projectsTitle?: string;
  projectsSubtitle?: string;
  ongoingTitle?: string;
  ongoingSubtitle?: string;
}

export function ProjectsSection({
  projects,
  ongoingProjects = [],
  totalCount,
  projectsTitle = "Real problems. Useful software.",
  projectsSubtitle = "A curated cross-section of AI, cybersecurity, systems, and full-stack engineering.",
  ongoingTitle = "Currently working on. Next-generation builds.",
  ongoingSubtitle = "Projects undergoing active engineering and architectural iteration. Once completed, they are deployed directly to the main portfolio section.",
}: ProjectsSectionProps) {
  // Format main projects title
  const mainParts = projectsTitle.split(/\.\s+/);
  const mainLine1 = mainParts[0] ? `${mainParts[0]}.` : projectsTitle;
  const mainLine2 = mainParts.slice(1).join(". ");

  // Format ongoing projects title
  const ongoingParts = ongoingTitle.split(/\.\s+/);
  const ongoingLine1 = ongoingParts[0] ? `${ongoingParts[0]}.` : ongoingTitle;
  const ongoingLine2 = ongoingParts.slice(1).join(". ");

  return (
    <section className="section projects-section" id="projects" aria-labelledby="projects-title">
      <div className="section-wrap">
        {/* Main Projects Showcase */}
        <div className="project-toolbar" data-reveal>
          <div>
            <p className="section-kicker">Featured work</p>
            <h2 className="section-title" id="projects-title">
              {mainLine1}
              {mainLine2 && (
                <>
                  <br />
                  <span className="accent">{mainLine2}</span>
                </>
              )}
            </h2>
          </div>
          <div>
            <p className="project-count">
              {String(projects.length).padStart(2, "0")} featured on main page · Rest in index
            </p>
            <p className="section-heading-aside">{projectsSubtitle}</p>
          </div>
        </div>

        {projects.length > 0 ? (
          <ProjectGrid projects={projects} />
        ) : (
          <UpcomingNotice area="featured projects" />
        )}

        {/* Subsection: Currently Working Projects */}
        <div
          className="projects-subsection ongoing-projects-subsection"
          style={{ marginTop: "70px", paddingTop: "50px", borderTop: "1px solid var(--line)" }}
          data-reveal
        >
          <div className="project-toolbar" style={{ marginBottom: "26px" }}>
            <div>
              <p
                className="section-kicker"
                style={{ display: "inline-flex", alignItems: "center", gap: 6, opacity: 0.9 }}
              >
                <Sparkles size={12} /> Active development
              </p>
              <h3
                className="section-title"
                style={{ fontSize: "clamp(22px, 3.2vw, 30px)", margin: "4px 0 0", color: "var(--white)" }}
              >
                {ongoingLine1}
                {ongoingLine2 && (
                  <>
                    <br />
                    <span className="accent" style={{ opacity: 0.92 }}>
                      {ongoingLine2}
                    </span>
                  </>
                )}
              </h3>
            </div>
            <div>
              <p className="section-heading-aside" style={{ maxWidth: "420px" }}>
                {ongoingSubtitle}
              </p>
            </div>
          </div>

          {ongoingProjects.length > 0 ? (
            <ProjectGrid projects={ongoingProjects} />
          ) : (
            <UpcomingNotice area="currently working projects" />
          )}
        </div>

        <div className="project-footer" data-reveal style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%", marginTop: "3rem" }}>
          <Link className="button button-secondary" href="/projects">
            Browse all projects in directory <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}
