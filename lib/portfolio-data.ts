import type { LucideIcon } from "lucide-react";
import { BrainCircuit, Code2, Database, Fingerprint, Languages, Smartphone, Terminal } from "lucide-react";

export const experiences = [
  {
    period: "Jun — Jul 2026",
    role: "Cybersecurity Intern",
    organization: "ETDC · STQC Directorate, MeitY",
    summary: "Reviewed cybersecurity frameworks and Generative AI security, using OWASP guidance to assess risks in LLM applications.",
    tags: ["AI Security", "OWASP", "Risk Assessment"],
  },
  {
    period: "Jan — Mar 2026",
    role: "AI/ML Intern",
    organization: "National Institute of Technology Silchar",
    summary: "Worked on road segmentation from satellite imagery, covering preprocessing, dataset preparation, feature extraction, and model evaluation.",
    tags: ["Python", "Computer Vision", "Segmentation"],
  },
  {
    period: "Jun — Jul 2025",
    role: "App Developer Intern",
    organization: "TalkEng · Agartala",
    summary: "Built an expense-tracking mobile app in Flutter and Dart, integrating Firebase Authentication and real-time Firestore data.",
    tags: ["Flutter", "Dart", "Firebase"],
  },
  {
    period: "Jun — Aug 2024",
    role: "Full-Stack Development Intern",
    organization: "Apni Vidya · Agartala",
    summary: "Contributed to frontend and backend features across web application design, implementation, debugging, and delivery.",
    tags: ["Web Development", "Frontend", "Backend"],
  },
  {
    period: "Mar — Aug 2022",
    role: "Computer Tutor",
    organization: "Novel Computer · Agartala",
    summary: "Taught computer fundamentals, programming basics, MS Office, and practical IT skills through hands-on learning.",
    tags: ["Teaching", "Computer Fundamentals", "MS Office"],
  },
];

export const skillGroups: { title: string; note: string; icon: LucideIcon; skills: string[] }[] = [
  { title: "Programming", note: "Languages & fundamentals", icon: Code2, skills: ["Python", "C++", "C", "Java", "JavaScript", "Dart", "SQL"] },
  { title: "AI / Machine Learning", note: "Models, vision & language", icon: BrainCircuit, skills: ["Machine Learning", "Deep Learning", "Computer Vision", "NLP", "OpenCV", "NLTK"] },
  { title: "Web Engineering", note: "Interfaces & application logic", icon: Terminal, skills: ["Next.js", "React", "Flask", "Streamlit", "HTML", "CSS"] },
  { title: "Mobile Development", note: "Cross-platform applications", icon: Smartphone, skills: ["Flutter", "Firebase", "Firestore", "Android Studio"] },
  { title: "Data & Storage", note: "Relational and document stores", icon: Database, skills: ["SQLite", "MySQL", "PostgreSQL", "PostGIS", "Redis"] },
  { title: "Security & Delivery", note: "Secure, reproducible software", icon: Fingerprint, skills: ["OWASP", "LLM Security", "Docker", "Git", "GitHub"] },
  { title: "Languages", note: "Spoken languages", icon: Languages, skills: ["English", "Hindi", "Bengali"] },
];

export const socialLinks: { label: string; href: string; icon: "github" | "linkedin" | "instagram" | "facebook" | "x" }[] = [
  { label: "GitHub", href: "https://github.com/BijoySarkar19", icon: "github" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/bijoysarkar19", icon: "linkedin" },
  { label: "Instagram", href: "https://www.instagram.com/bijoyysarkarr?obrf=dW1zenpraWt3eGI=", icon: "instagram" },
  { label: "Facebook", href: "https://www.facebook.com/share/1Cs44JBwnk/", icon: "facebook" },
  { label: "X", href: "https://x.com/bijoyy_19", icon: "x" },
];
