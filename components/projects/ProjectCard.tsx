import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { PortfolioProject } from "@/lib/projects";
import { externalUrl } from "@/lib/projects";
import { SocialIcon } from "@/components/ui/SocialIcon";

export function ProjectCard({ project, index }: { project: PortfolioProject; index: number }) {
  const github = externalUrl(project.githubUrl);
  const isOngoingCover =
    project.isOngoing &&
    (!project.image1 ||
      project.image1.includes("ongoing-project-cover") ||
      project.image1.includes("ongoing-coder"));

  return (
    <article className="project-card" data-reveal>
      <Link href={`/projects/${project.slug}`} aria-label={`View ${project.title}`}>
        <div className="project-image-frame" style={isOngoingCover ? { background: "#ffffff" } : undefined}>
          {isOngoingCover ? (
            <div
              className="ongoing-dynamic-coder"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                backgroundColor: "#ffffff",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  backgroundColor: "var(--orange)",
                  WebkitMaskImage: "url('/images/ongoing-coder-silhouette.png')",
                  maskImage: "url('/images/ongoing-coder-silhouette.png')",
                  WebkitMaskSize: "cover",
                  maskSize: "cover",
                  WebkitMaskPosition: "center",
                  maskPosition: "center",
                  WebkitMaskRepeat: "no-repeat",
                  maskRepeat: "no-repeat",
                }}
              />
            </div>
          ) : (
            <Image
              className="project-image"
              src={project.image1}
              alt={`${project.title} project preview`}
              fill
              priority={index === 0}
              unoptimized
              sizes="(max-width: 440px) 90vw, (max-width: 700px) 45vw, (max-width: 1100px) 30vw, 380px"
            />
          )}
          <span className="project-image-label">Project preview · {String(index + 1).padStart(2, "0")}</span>
        </div>
      </Link>
      <div className="project-info">
        <div className="project-topline">
          {project.isOngoing ? (
            <span className="project-ongoing-pill" style={{ color: "var(--orange)", fontWeight: 700, letterSpacing: "0.1em", display: "inline-flex", alignItems: "center", gap: 5 }}>
              ⚡ CURRENTLY WORKING
            </span>
          ) : (
            <span>{String(index + 1).padStart(2, "0")} / FEATURED PROJECT</span>
          )}
        </div>
        <h3>{project.title}</h3>
        <p>{project.description}</p>
        <div className="project-tech">{project.techStack.slice(0, 4).map((tech) => <span className="tag" key={tech}>{tech}</span>)}</div>
        <div className="project-card-links">
          <Link className="project-link" href={`/projects/${project.slug}`}>Explore project <ArrowUpRight className="project-arrow" size={13} /></Link>
          {github ? <a className="project-link project-github" href={github} target="_blank" rel="noreferrer" aria-label={`Open ${project.title} on GitHub`}><SocialIcon name="github" size={13} /></a> : null}
        </div>
      </div>
    </article>
  );
}
