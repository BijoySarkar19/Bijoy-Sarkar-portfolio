import { readFileSync, writeFileSync } from "fs";

// ── 1. Update lib/validation.ts ────────────────────────────
let validation = readFileSync("lib/validation.ts", "utf8");
if (!validation.includes("optionalImageReference")) {
  validation = validation.replace(
    'const externalWebUrl = z.union([',
    `const optionalImageReference = z.union([
  z.literal(""),
  z.string().trim().max(500).refine(
    (value) => value === "" || (value.startsWith("/") && !value.startsWith("//") && !value.split("/").includes("..")),
    "Use a local image path inside the public folder."
  ),
]).default("");

const externalWebUrl = z.union([`
  );

  validation = validation.replace(
    '  image1: imageReference,\n  image2: imageReference,\n  image3: imageReference,',
    '  image1: imageReference,\n  image2: optionalImageReference,\n  image3: optionalImageReference,'
  );

  writeFileSync("lib/validation.ts", validation, "utf8");
  console.log("Updated lib/validation.ts");
}

// ── 2. Update lib/projects.ts ──────────────────────────────
let projectsTs = readFileSync("lib/projects.ts", "utf8");
const oldToPortfolio = `export function toPortfolioProject(project: Project): PortfolioProject {
  return {
    ...project,
    techStack: parseStringList(project.techStack),
    features: parseStringList(project.features),
    images: [project.image1, project.image2, project.image3],
  };
}`;

const newToPortfolio = `export function toPortfolioProject(project: Project): PortfolioProject {
  // Currently Doing projects: strictly 1 image (Active Development orange coder artwork)
  // Finished projects (Real Life Problems): 1 to 3 images (minimum 1, maximum 3)
  const validImages = [project.image1, project.image2, project.image3]
    .map((img) => (typeof img === "string" ? img.trim() : ""))
    .filter(Boolean);

  const images = project.isOngoing
    ? [project.image1 || "/images/ongoing-project-cover.webp"]
    : validImages.length > 0
    ? validImages.slice(0, 3)
    : [project.image1];

  return {
    ...project,
    techStack: parseStringList(project.techStack),
    features: parseStringList(project.features),
    images,
  };
}`;

if (projectsTs.includes("images: [project.image1, project.image2, project.image3]")) {
  projectsTs = projectsTs.replace(oldToPortfolio, newToPortfolio);
  writeFileSync("lib/projects.ts", projectsTs, "utf8");
  console.log("Updated lib/projects.ts");
}

// ── 3. Update components/projects/ProjectGallery.tsx ────────
const newProjectGallery = `import Image from "next/image";
import type { PortfolioProject } from "@/lib/projects";

export function ProjectGallery({ project }: { project: PortfolioProject }) {
  // If ongoing (currently doing) or only 1 image provided, render single high-impact hero
  const isSingle = project.isOngoing || project.images.length === 1;

  return (
    <div
      className={\`gallery-grid \${isSingle ? "gallery-single-grid" : ""}\`}
      aria-label={\`\${project.title} image gallery\`}
    >
      {project.images.map((src, index) => (
        <figure
          className={isSingle ? "gallery-hero gallery-single-hero" : index === 0 ? "gallery-hero" : "gallery-support"}
          key={\`\${src}-\${index}\`}
        >
          <Image
            className="gallery-image"
            src={src}
            alt={\`\${project.title} — project image \${index + 1}\`}
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
              : \`\${String(index + 1).padStart(2, "0")} / \${index === 0 ? "OVERVIEW" : "DETAIL"}\`}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
`;
writeFileSync("components/projects/ProjectGallery.tsx", newProjectGallery, "utf8");
console.log("Updated components/projects/ProjectGallery.tsx");

// ── 4. Update app/globals.css for single image gallery ─────
let globalsCss = readFileSync("app/globals.css", "utf8");
if (!globalsCss.includes("gallery-single-grid")) {
  globalsCss += `\n/* Single Image Layout for Currently Doing Projects & 1-image Showcases */\n.gallery-grid.gallery-single-grid { display: block !important; margin-top: 42px; }\n.gallery-grid.gallery-single-grid .gallery-single-hero { width: 100% !important; grid-row: auto !important; aspect-ratio: 16 / 9; min-height: clamp(320px, 50vw, 640px) !important; border: 1px solid rgba(255, 94, 44, 0.35); box-shadow: 0 10px 40px rgba(255, 94, 44, 0.08); }\n`;
  writeFileSync("app/globals.css", globalsCss, "utf8");
  console.log("Updated app/globals.css with single-image grid rules");
}

console.log("Phase 1 updates complete.");
