import Image from "next/image";
import type { PortfolioProject } from "@/lib/projects";

export function ProjectGallery({ project }: { project: PortfolioProject }) {
  // If ongoing (currently doing) or only 1 image provided, render single high-impact hero
  const isSingle = project.isOngoing || project.images.length === 1;

  return (
    <div
      className={`gallery-grid ${isSingle ? "gallery-single-grid" : ""}`}
      aria-label={`${project.title} image gallery`}
    >
      {project.images.map((src, index) => (
        <figure
          className={isSingle ? "gallery-hero gallery-single-hero" : index === 0 ? "gallery-hero" : "gallery-support"}
          key={`${src}-${index}`}
        >
          <Image
            className="gallery-image"
            src={src}
            alt={`${project.title} — project image ${index + 1}`}
            fill
            sizes={
              isSingle
                ? "(max-width: 900px) 96vw, 1200px"
                : index === 0
                ? "(max-width: 700px) 92vw, 66vw"
                : "(max-width: 700px) 92vw, 42vw"
            }
            priority={index === 0}
          />
          <figcaption className="gallery-caption">
            {project.isOngoing
              ? "⚡ ACTIVE DEVELOPMENT · 01 / 01"
              : `${String(index + 1).padStart(2, "0")} / ${index === 0 ? "OVERVIEW" : "DETAIL"}`}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
