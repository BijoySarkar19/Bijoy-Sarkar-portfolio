import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import type { PortfolioProject } from "@/lib/projects";
import { ProjectGrid } from "@/components/projects/ProjectGrid";
import { UpcomingNotice } from "@/components/ui/UpcomingNotice";

export function ProjectsSection({
  projects,
  ongoingProjects = [],
  totalCount,
}: {
  projects: PortfolioProject[];
  ongoingProjects?: PortfolioProject[];
  totalCount: number;
}) {
  return (
    <section className="section projects-section" id="projects" aria-labelledby="projects-title">
      <div className="section-wrap">
        {/* Main Projects Showcase */}
        <div className="project-toolbar" data-reveal>
          <div>
            <p className="section-kicker">Featured work</p>
            <h2 className="section-title" id="projects-title">
              Real problems.<br /><span className="accent">Useful software.</span>
            </h2>
          </div>
          <div>
            <p className="project-count">
              {String(projects.length).padStart(2, "0")} featured on main page · Rest in index
            </p>
            <p className="section-heading-aside">
              A curated cross-section of AI, cybersecurity, systems, and full-stack engineering.
            </p>
          </div>
        </div>

        {projects.length > 0 ? (
          <ProjectGrid projects={projects} />
        ) : (
          <UpcomingNotice area="featured projects" />
        )}

        {/* Subsection: Currently Working Projects */}
        <div className="projects-subsection ongoing-projects-subsection" style={{ marginTop: "70px", paddingTop: "50px", borderTop: "1px solid var(--line)" }} data-reveal>
          <div className="project-toolbar" style={{ marginBottom: "26px" }}>
            <div>
              <p className="section-kicker" style={{ display: "inline-flex", alignItems: "center", gap: 6, opacity: 0.9 }}>
                <Sparkles size={12} /> Active development
              </p>
              <h3 className="section-title" style={{ fontSize: "clamp(22px, 3.2vw, 30px)", margin: "4px 0 0", color: "var(--white)" }}>
                Currently working on.<br />
                <span className="accent" style={{ opacity: 0.92 }}>Next-generation builds.</span>
              </h3>
            </div>
            <div>
              <p className="section-heading-aside" style={{ maxWidth: "420px" }}>
                Projects undergoing active engineering and architectural iteration. Once completed, they are deployed directly to the main portfolio section.
              </p>
            </div>
          </div>

          {ongoingProjects.length > 0 ? (
            <ProjectGrid projects={ongoingProjects} />
          ) : (
            <UpcomingNotice area="currently working projects" />
          )}
        </div>

        {/* Footer Browse Button */}
        <div className="projects-footer" style={{ marginTop: "50px" }}>
          <Link className="button button-secondary" href="/projects">
            Browse full project index <span className="button-icon"><ArrowRight size={14} /></span>
          </Link>
        </div>
      </div>
    </section>
  );
}
