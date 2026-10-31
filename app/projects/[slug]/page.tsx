import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Check, Globe2 } from "lucide-react";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { ProjectGallery } from "@/components/projects/ProjectGallery";
import { prisma } from "@/lib/prisma";
import { externalUrl, toPortfolioProject, type PortfolioProject } from "@/lib/projects";
import { FALLBACK_PROJECTS } from "@/lib/fallback-data";
import { SocialIcon } from "@/components/ui/SocialIcon";

export const dynamic = "force-dynamic";

interface ProjectPageProps { params: Promise<{ slug: string }> }

async function getProject(slug: string): Promise<PortfolioProject | null> {
  try {
    const project = await prisma.project.findUnique({ where: { slug } });
    if (project?.published) return toPortfolioProject(project);
  } catch (err) {
    console.warn("Database fallback in getProject:", err);
  }

  const fallback = FALLBACK_PROJECTS.find((p) => p.slug === slug && p.published);
  if (!fallback) return null;
  return {
    ...fallback,
    images: [fallback.image1, fallback.image2, fallback.image3],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) return { title: "Project not found — Bijoy Sarkar" };
  return {
    title: `${project.title} — Bijoy Sarkar`,
    description: project.description,
    openGraph: { title: `${project.title} — Bijoy Sarkar`, description: project.description, images: [{ url: project.image1, alt: `${project.title} project preview` }] },
  };
}

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) notFound();

  const github = externalUrl(project.githubUrl);
  const live = externalUrl(project.liveUrl);

  return (
    <div className="site-shell">
      <main className="section project-detail">
        <div className="section-wrap">
          <Link className="back-link" href="/#projects"><ArrowLeft size={14} /> Back to projects</Link>
          <header className="detail-hero" data-reveal>
            <p className="section-kicker">Selected work · {String(project.sortOrder).padStart(2, "0")}</p>
            <h1 className="section-title">{project.title}</h1>
            <p className="section-lede">{project.description}</p>
            <div className="detail-tech">{project.techStack.map((technology) => <span className="tag" key={technology}>{technology}</span>)}</div>
            <div className="detail-actions">
              {github ? <a className="button" href={github} target="_blank" rel="noopener noreferrer"><SocialIcon name="github" size={14} /> GitHub <ArrowUpRight size={13} /></a> : null}
              {live ? <a className="button button-secondary" href={live} target="_blank" rel="noopener noreferrer"><Globe2 size={14} /> Live demo <ArrowUpRight size={13} /></a> : null}
            </div>
          </header>
          <ProjectGallery project={project} />
          <div className="detail-body">
            <article>
              <p className="section-kicker">Overview</p>
              <p className="detail-copy">{project.longDescription}</p>
              <div className="detail-tech detail-tech-bottom">{project.techStack.map((technology) => <span className="tag" key={technology}>{technology}</span>)}</div>
            </article>
            <aside className="detail-aside">
              <p className="section-kicker">What it does</p>
              <ul className="feature-list">{project.features.map((feature) => <li key={feature}><Check size={14} />{feature}</li>)}</ul>
              {github || live ? <div className="detail-aside-links">{github ? <a href={github} target="_blank" rel="noopener noreferrer">Source code <ArrowUpRight size={13} /></a> : null}{live ? <a href={live} target="_blank" rel="noopener noreferrer">Live project <ArrowUpRight size={13} /></a> : null}</div> : <p className="detail-private-note">Project links are being prepared.</p>}
            </aside>
          </div>
          <div className="detail-back"><Link className="button button-secondary" href="/#projects"><ArrowLeft size={14} /> Back to projects</Link></div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
