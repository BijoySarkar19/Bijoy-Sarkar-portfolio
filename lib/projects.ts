import type { Project } from "@/generated/prisma/client";

export interface PortfolioProject extends Omit<Project, "techStack" | "features" | "imagesJson"> {
  techStack: string[];
  features: string[];
  images: string[];
  imagesJson?: string;
}

function parseStringList(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function toPortfolioProject(project: Project & { imagesJson?: string | null }): PortfolioProject {
  let images: string[] = [];

  if (project.isOngoing) {
    // Currently Doing projects: strictly 1 image (Active Development orange coder artwork)
    images = [project.image1 || "/images/ongoing-project-cover.webp"];
  } else {
    // Finished projects (Real Life Problems): use dynamic images from imagesJson if available
    if (project.imagesJson) {
      const parsed = parseStringList(project.imagesJson);
      if (parsed.length > 0) {
        images = parsed;
      }
    }
    // Fall back to image1, image2, image3
    if (images.length === 0) {
      const validImages = [project.image1, project.image2, project.image3]
        .map((img) => (typeof img === "string" ? img.trim() : ""))
        .filter(Boolean);
      images = validImages.length > 0 ? validImages : [project.image1];
    }
  }

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
