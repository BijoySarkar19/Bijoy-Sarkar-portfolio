import type { Project } from "@/generated/prisma/client";

export interface PortfolioProject extends Omit<Project, "techStack" | "features"> {
  techStack: string[];
  features: string[];
  images: string[];
}

function parseStringList(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function toPortfolioProject(project: Project): PortfolioProject {
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
}

export function externalUrl(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.toString() : undefined;
  } catch {
    return undefined;
  }
}
