import type { PortfolioProject } from "@/lib/projects";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { UpcomingNotice } from "@/components/ui/UpcomingNotice";

export function ProjectGrid({
  projects,
  emptyArea = "projects & case studies",
}: {
  projects: PortfolioProject[];
  emptyArea?: string;
}) {
  if (projects.length === 0) {
    return <UpcomingNotice area={emptyArea} />;
  }
  return (
    <div className="project-grid">
      {projects.map((project, index) => (
        <ProjectCard key={project.id} project={project} index={index} />
      ))}
    </div>
  );
}
