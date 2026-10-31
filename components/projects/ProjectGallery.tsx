import Image from "next/image";
import type { PortfolioProject } from "@/lib/projects";

export function ProjectGallery({ project }: { project: PortfolioProject }) {
  return (
    <div className="gallery-grid" aria-label={`${project.title} image gallery`}>
      {project.images.map((src, index) => (
        <figure className={index === 0 ? "gallery-hero" : "gallery-support"} key={`${src}-${index}`}>
          <Image className="gallery-image" src={src} alt={`${project.title} — project image ${index + 1}`} fill sizes={index === 0 ? "(max-width: 700px) 92vw, 66vw" : "(max-width: 700px) 92vw, 42vw"} priority={index === 0} />
          <figcaption className="gallery-caption">{String(index + 1).padStart(2, "0")} / {index === 0 ? "OVERVIEW" : "DETAIL"}</figcaption>
        </figure>
      ))}
    </div>
  );
}
