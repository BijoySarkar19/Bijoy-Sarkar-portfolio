"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Save } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export interface ProjectFormInitial {
  id?: string;
  title: string;
  slug: string;
  description: string;
  longDescription: string;
  image1: string;
  image2: string;
  image3: string;
  techStack: string[];
  features: string[];
  githubUrl: string | null;
  liveUrl: string | null;
  published: boolean;
  isOngoing?: boolean;
  featuredOnHome?: boolean;
  sortOrder: number;
}

const emptyProject: ProjectFormInitial = {
  title: "", slug: "", description: "", longDescription: "",
  image1: "", image2: "", image3: "", techStack: [], features: [],
  githubUrl: null, liveUrl: null, published: true, isOngoing: false, featuredOnHome: false, sortOrder: 0,
};

function slugify(value: string) {
  return value.normalize("NFKD").toLowerCase().replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 120);
}

export function ProjectForm({ initial }: { initial?: ProjectFormInitial }) {
  const router = useRouter();
  const project = initial ?? emptyProject;
  const [title, setTitle] = useState(project.title);
  const [slug, setSlug] = useState(project.slug);
  const [slugEdited, setSlugEdited] = useState(Boolean(project.slug));
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("error");
  const [description, setDescription] = useState(project.description);
  const [previewPaths, setPreviewPaths] = useState([project.image1, project.image2, project.image3]);
  const isEditing = Boolean(project.id);
  const techValue = useMemo(() => project.techStack.join(", "), [project.techStack]);
  const featureValue = useMemo(() => project.features.join("\n"), [project.features]);

  function handleTitle(value: string) {
    setTitle(value);
    if (!slugEdited) setSlug(slugify(value));
  }

  function updatePreview(index: number, value: string) {
    setPreviewPaths((previous) => previous.map((path, itemIndex) => itemIndex === index ? value : path));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const parseList = (value: FormDataEntryValue | null) => String(value ?? "").split(",").map((part) => part.trim()).filter(Boolean);
    const payload = {
      title: String(form.get("title") ?? ""),
      slug: String(form.get("slug") ?? ""),
      description: String(form.get("description") ?? ""),
      longDescription: String(form.get("longDescription") ?? ""),
      image1: String(form.get("image1") ?? ""),
      image2: String(form.get("image2") ?? ""),
      image3: String(form.get("image3") ?? ""),
      techStack: parseList(form.get("techStack")),
      features: String(form.get("features") ?? "").split("\n").map((part) => part.trim()).filter(Boolean),
      githubUrl: String(form.get("githubUrl") ?? "").trim(),
      liveUrl: String(form.get("liveUrl") ?? "").trim(),
      published: form.get("published") === "on",
      isOngoing: form.get("isOngoing") === "on",
      featuredOnHome: form.get("featuredOnHome") === "on",
      sortOrder: Number(form.get("sortOrder") ?? 0),
    };

    try {
      const response = await fetch(isEditing ? `/api/projects/${encodeURIComponent(project.id ?? "")}` : "/api/projects", {
        method: isEditing ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { error?: string; fields?: Record<string, string[]> };
      if (!response.ok) {
        const fieldMessage = result.fields ? Object.values(result.fields).flat()[0] : undefined;
        throw new Error(fieldMessage ?? result.error ?? "Project could not be saved.");
      }
      setMessageType("success");
      setMessage("Project saved successfully.");
      router.push("/admin-admin/dashboard/projects");
      router.refresh();
    } catch (error) {
      setMessageType("error");
      setMessage(error instanceof Error ? error.message : "Project could not be saved.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="admin-form" onSubmit={submit}>
      {message ? <p className={messageType === "success" ? "admin-success" : "admin-alert"} role="status">{message}</p> : null}
      <div className="admin-form-grid">
        <div className="field"><label htmlFor="project-title">Project title</label><input id="project-title" name="title" value={title} onChange={(event) => handleTitle(event.currentTarget.value)} required minLength={2} maxLength={100} /></div>
        <div className="field"><label htmlFor="project-slug">Slug</label><input id="project-slug" name="slug" value={slug} onChange={(event) => { setSlugEdited(true); setSlug(slugify(event.currentTarget.value)); }} required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={120} /><span className="field-counter">/projects/{slug || "project-name"}</span></div>
        <div className="field full-width"><label htmlFor="project-description">Short description</label><textarea id="project-description" name="description" value={description} onChange={(event) => setDescription(event.currentTarget.value)} required minLength={10} maxLength={320} rows={3} /><span className="field-counter">{description.length}/320 characters</span></div>
        <div className="field full-width"><label htmlFor="project-long-description">Detailed description</label><textarea id="project-long-description" name="longDescription" defaultValue={project.longDescription} required minLength={20} maxLength={5000} rows={6} /></div>
        <div className="field full-width"><label htmlFor="project-tech">Technology stack</label><input id="project-tech" name="techStack" defaultValue={techValue} placeholder="Python, Flask, SQLite" required /><span className="field-counter">Separate technologies with commas.</span></div>
        <div className="field full-width"><label htmlFor="project-features">Key features</label><textarea id="project-features" name="features" defaultValue={featureValue} rows={4} placeholder="One feature per line" /><span className="field-counter">One feature per line. Up to 12 features.</span></div>
        {[0, 1, 2].map((index) => {
          const fieldName = `image${index + 1}` as "image1" | "image2" | "image3";
          return <div className="field full-width" key={fieldName}><label htmlFor={fieldName}>{index === 0 ? "Hero image" : `Supporting image ${index}`}</label><input id={fieldName} name={fieldName} defaultValue={project[fieldName]} onChange={(event) => updatePreview(index, event.currentTarget.value)} required maxLength={500} placeholder="/projects/your-project/hero.webp" /><span className="field-counter">Use a local path to an image inside public/.</span></div>;
        })}
        <div className="field"><label htmlFor="project-github">GitHub URL</label><input id="project-github" name="githubUrl" type="url" defaultValue={project.githubUrl ?? ""} placeholder="https://github.com/…" /></div>
        <div className="field"><label htmlFor="project-live">Live demo URL</label><input id="project-live" name="liveUrl" type="url" defaultValue={project.liveUrl ?? ""} placeholder="https://…" /></div>
        <div className="field"><label htmlFor="project-order">Display order</label><input id="project-order" name="sortOrder" type="number" min="0" max="999" defaultValue={project.sortOrder} /></div>
        <div className="field full-width" style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginTop: "8px" }}>
          <label className="publish-field">
            <input name="published" type="checkbox" defaultChecked={project.published} />
            <span>Published on portfolio</span>
          </label>
          <label className="publish-field">
            <input name="featuredOnHome" type="checkbox" defaultChecked={project.featuredOnHome} />
            <span>★ Feature in Main Page Top 5</span>
          </label>
          <label className="publish-field">
            <input name="isOngoing" type="checkbox" defaultChecked={project.isOngoing} />
            <span>⚡ Currently Working (In Active Development)</span>
          </label>
        </div>
      </div>
      <div className="image-previews" aria-label="Image previews">
        {previewPaths.map((path, index) => <div className="image-preview" key={`${index}-${path}`}><Image src={path || "/favicon.svg"} alt={`${index === 0 ? "Hero" : `Supporting ${index}`} preview`} width={400} height={300} unoptimized onError={(event) => { event.currentTarget.src = "/favicon.svg"; }} /></div>)}
      </div>
      <p className="admin-form-help">The three image files are stored with each project. Use relative paths for images placed in the public folder.</p>
      <div className="form-bottom">
        <Link className="admin-small-button" href="/admin-admin/dashboard/projects"><ArrowLeft size={13} /> Cancel</Link>
        <button className="button" type="submit" disabled={pending}>{pending ? "Saving…" : isEditing ? "Save changes" : "Create project"} {pending ? <Check size={14} /> : <Save size={14} />}</button>
      </div>
    </form>
  );
}
