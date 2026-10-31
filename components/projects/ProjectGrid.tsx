import type { PortfolioProject } from "@/lib/projects";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { UpcomingNotice } from "@/components/ui/UpcomingNotice";

export function ProjectGrid({ projects }: { projects: PortfolioProject[] }) {
  if (projects.length === 0) {
    return <UpcomingNotice area="projects & case studies" />;
  }
  return (
    <div className="project-grid">
      {projects.map((project, index) => (
        <ProjectCard key={project.id} project={project} index={index} />
      ))}
    </div>
  );
}
