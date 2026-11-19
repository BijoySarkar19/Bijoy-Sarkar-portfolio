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
      {project.images.map((src, index) => {
        const isOngoingCover =
          project.isOngoing &&
          (!src ||
            src.includes("ongoing-project-cover") ||
            src.includes("ongoing-coder"));

        return (
          <figure
            className={isSingle ? "gallery-hero gallery-single-hero" : index === 0 ? "gallery-hero" : "gallery-support"}
            key={`${src}-${index}`}
            style={isOngoingCover ? { background: "#ffffff", overflow: "hidden" } : undefined}
          >
            {isOngoingCover ? (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  backgroundColor: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    backgroundColor: "var(--orange)",
                    WebkitMaskImage: "url('/images/ongoing-coder-silhouette.png')",
                    maskImage: "url('/images/ongoing-coder-silhouette.png')",
                    WebkitMaskSize: "contain",
                    maskSize: "contain",
                    WebkitMaskPosition: "center",
                    maskPosition: "center",
                    WebkitMaskRepeat: "no-repeat",
                    maskRepeat: "no-repeat",
                  }}
                />
              </div>
            ) : (
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
            )}
            <figcaption className="gallery-caption">
              {project.isOngoing
                ? "⚡ ACTIVE DEVELOPMENT · 01 / 01"
                : `${String(index + 1).padStart(2, "0")} / ${index === 0 ? "OVERVIEW" : "DETAIL"}`}
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}
