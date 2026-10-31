import { z } from "zod";

export const adminLoginSchema = z.object({
  username: z.string().trim().min(2).max(64),
  email: z.email().trim().max(254),
  password: z.string().min(1).max(128),
});

const imageReference = z.string().trim().min(1).max(500).refine(
  (value) => value.startsWith("/") && !value.startsWith("//") && !value.split("/").includes(".."),
  "Use a local image path inside the public folder.",
);
const externalWebUrl = z.union([
  z.literal(""),
  z.url().refine((value) => value.startsWith("https://") || value.startsWith("http://"), "Use an HTTP or HTTPS URL."),
]);

export const projectInputSchema = z.object({
  title: z.string().trim().min(2).max(100),
  slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().min(10).max(320),
  longDescription: z.string().trim().min(20).max(5000),
  image1: imageReference,
  image2: imageReference,
  image3: imageReference,
  techStack: z.array(z.string().trim().min(1).max(40)).min(1).max(16),
  features: z.array(z.string().trim().min(1).max(220)).max(12),
  githubUrl: externalWebUrl.nullable().optional(),
  liveUrl: externalWebUrl.nullable().optional(),
  published: z.boolean().default(true),
  isOngoing: z.boolean().default(false),
  featuredOnHome: z.boolean().default(false),
  sortOrder: z.number().int().min(0).max(999).default(0),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().trim().max(254).refine((value) => /\.com$/i.test(value), "Use an email address ending in .com."),
  phone: z.string().trim().max(24).regex(/^\+?[0-9 ]*$/, "Phone numbers may contain digits only.").optional().default(""),
  message: z.string().trim().min(1).max(100000).refine((value) => {
    const words = value.split(/\s+/u).filter(Boolean).length;
    return words >= 5 && words <= 5000;
  }, "Message must be between 5 and 5000 words."),
  captchaToken: z.string().max(4096).optional().default(""),
});

export const workExperienceSchema = z.object({
  period: z.string().trim().min(2).max(100),
  role: z.string().trim().min(2).max(120),
  organization: z.string().trim().min(2).max(150),
  summary: z.string().trim().min(5).max(1500),
  tags: z.array(z.string().trim().min(1).max(50)).max(15).default([]),
  sortOrder: z.number().int().min(0).max(999).default(0),
});

export const skillGroupSchema = z.object({
  title: z.string().trim().min(2).max(80),
  note: z.string().trim().min(2).max(180),
  icon: z.string().trim().min(2).max(50).default("Terminal"),
  skills: z.array(z.string().trim().min(1).max(50)).min(1).max(30),
  sortOrder: z.number().int().min(0).max(999).default(0),
});

export const resumeSchema = z.object({
  filename: z.string().trim().min(2).max(120),
  path: z.string().trim().min(1).max(250).refine((val) => val.startsWith("/") && val.endsWith(".pdf"), "Resume path must be a local PDF inside public/"),
  active: z.boolean().default(true),
});

export type WorkExperienceInput = z.infer<typeof workExperienceSchema>;
export type SkillGroupInput = z.infer<typeof skillGroupSchema>;
export type ResumeInput = z.infer<typeof resumeSchema>;

export type ProjectInput = z.infer<typeof projectInputSchema>;
export type ContactInput = z.infer<typeof contactSchema>;

export function cleanText(value: string) {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim();
}
