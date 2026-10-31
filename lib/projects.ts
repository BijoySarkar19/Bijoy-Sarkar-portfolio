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
  return {
    ...project,
    techStack: parseStringList(project.techStack),
    features: parseStringList(project.features),
    images: [project.image1, project.image2, project.image3],
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
