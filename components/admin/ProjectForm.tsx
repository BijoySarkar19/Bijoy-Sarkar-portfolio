"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Save, Sparkles, Image as ImageIcon } from "lucide-react";
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
  title: "",
  slug: "",
  description: "",
  longDescription: "",
  image1: "/images/ongoing-project-cover.webp",
  image2: "",
  image3: "",
  techStack: [],
  features: [],
  githubUrl: null,
  liveUrl: null,
  published: true,
  isOngoing: false,
  featuredOnHome: false,
  sortOrder: 0,
};

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

export function ProjectForm({ initial }: { initial?: ProjectFormInitial }) {
  const router = useRouter();
  const project = initial ?? emptyProject;
  const [title, setTitle] = useState(project.title);
  const [slug, setSlug] = useState(project.slug);
  const [slugEdited, setSlugEdited] = useState(Boolean(project.slug));
  const [isOngoing, setIsOngoing] = useState(Boolean(project.isOngoing));
  const [featuredOnHome, setFeaturedOnHome] = useState(Boolean(project.featuredOnHome));
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("error");
  const [description, setDescription] = useState(project.description);

  // Default images for ongoing vs finished projects
  const [image1, setImage1] = useState(project.image1 || (project.isOngoing ? "/images/ongoing-project-cover.webp" : ""));
  const [image2, setImage2] = useState(project.isOngoing ? "" : project.image2 || "");
  const [image3, setImage3] = useState(project.isOngoing ? "" : project.image3 || "");

  const isEditing = Boolean(project.id);
  const techValue = useMemo(() => project.techStack.join(", "), [project.techStack]);
  const featureValue = useMemo(() => project.features.join("\n"), [project.features]);

  function handleTitle(value: string) {
    setTitle(value);
    if (!slugEdited) setSlug(slugify(value));
  }

  function handleOngoingToggle(checked: boolean) {
    setIsOngoing(checked);
    if (checked) {
      // Currently doing projects rule: strictly 1 image (Active Development Orange Coder)
      setFeaturedOnHome(true);
      if (!image1 || (image1.startsWith("/projects/") && !image1.includes("sentineledge") && !image1.includes("ongoing"))) {
        setImage1("/images/ongoing-project-cover.webp");
      }
      setImage2("");
      setImage3("");
    }
  }

  function applyOngoingPreset() {
    setImage1("/images/ongoing-project-cover.webp");
    setImage2("");
    setImage3("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");

    const form = new FormData(event.currentTarget);
    const parseList = (value: FormDataEntryValue | null) =>
      String(value ?? "")
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);

    const isOngoingVal = form.get("isOngoing") === "on";
    const img1 = String(form.get("image1") ?? image1).trim();
    const img2 = isOngoingVal ? "" : String(form.get("image2") ?? image2).trim();
    const img3 = isOngoingVal ? "" : String(form.get("image3") ?? image3).trim();

    // Validation rules:
    // 1. Finished projects (Real Life Problems): 1 to 3 images, cannot be 0.
    // 2. Currently doing projects: strictly 1 image (the active development artwork).
    if (!img1) {
      setMessageType("error");
      setMessage(
        isOngoingVal
          ? "Currently doing projects require the Active Development image (/images/ongoing-project-cover.webp)."
          : "Finished projects must have at least 1 hero image (and up to 3 images max)."
      );
      setPending(false);
      return;
    }

    const payload = {
      title: String(form.get("title") ?? ""),
      slug: String(form.get("slug") ?? ""),
      description: String(form.get("description") ?? ""),
      longDescription: String(form.get("longDescription") ?? ""),
      image1: img1,
      image2: img2,
      image3: img3,
      techStack: parseList(form.get("techStack")),
      features: String(form.get("features") ?? "")
        .split("\n")
        .map((part) => part.trim())
        .filter(Boolean),
      githubUrl: String(form.get("githubUrl") ?? "").trim(),
      liveUrl: String(form.get("liveUrl") ?? "").trim(),
      published: form.get("published") === "on",
      isOngoing: isOngoingVal,
      featuredOnHome: form.get("featuredOnHome") === "on",
      sortOrder: Number(form.get("sortOrder") ?? 0),
    };

    try {
      const response = await fetch(
        isEditing ? `/api/projects/${encodeURIComponent(project.id ?? "")}` : "/api/projects",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
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

  // Determine active preview images
  const activePreviews = isOngoing
    ? [image1 || "/images/ongoing-project-cover.webp"]
    : [image1, image2, image3].filter(Boolean);

  return (
    <form className="admin-form" onSubmit={submit}>
      {message ? (
        <p className={messageType === "success" ? "admin-success" : "admin-alert"} role="status">
          {message}
        </p>
      ) : null}

      <div className="admin-form-grid">
        <div className="field">
          <label htmlFor="project-title">Project title</label>
          <input
            id="project-title"
            name="title"
            value={title}
            onChange={(event) => handleTitle(event.currentTarget.value)}
            required
            minLength={2}
            maxLength={100}
          />
        </div>
        <div className="field">
          <label htmlFor="project-slug">Slug</label>
          <input
            id="project-slug"
            name="slug"
            value={slug}
            onChange={(event) => {
              setSlugEdited(true);
              setSlug(slugify(event.currentTarget.value));
            }}
            required
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            maxLength={120}
          />
          <span className="field-counter">/projects/{slug || "project-name"}</span>
        </div>

        <div className="field full-width">
          <label htmlFor="project-description">Short description</label>
          <textarea
            id="project-description"
            name="description"
            value={description}
            onChange={(event) => setDescription(event.currentTarget.value)}
            required
            minLength={10}
            maxLength={320}
            rows={3}
          />
          <span className="field-counter">{description.length}/320 characters</span>
        </div>

        <div className="field full-width">
          <label htmlFor="project-long-description">Detailed description</label>
          <textarea
            id="project-long-description"
            name="longDescription"
            defaultValue={project.longDescription}
            required
            minLength={20}
            maxLength={5000}
            rows={6}
          />
        </div>

        <div className="field full-width">
          <label htmlFor="project-tech">Technology stack</label>
          <input
            id="project-tech"
            name="techStack"
            defaultValue={techValue}
            placeholder="Python, Flask, SQLite"
            required
          />
          <span className="field-counter">Separate technologies with commas.</span>
        </div>

        <div className="field full-width">
          <label htmlFor="project-features">Key features</label>
          <textarea
            id="project-features"
            name="features"
            defaultValue={featureValue}
            rows={4}
            placeholder="One feature per line"
          />
          <span className="field-counter">One feature per line. Up to 12 features.</span>
        </div>

        {/* Subsection / Stage Configuration */}
        <div
          className="field full-width"
          style={{
            display: "flex",
            gap: "20px",
            flexWrap: "wrap",
            margin: "8px 0 16px",
            padding: "16px",
            background: "rgba(15, 23, 42, 0.6)",
            borderRadius: "10px",
            border: "1px solid var(--line)",
          }}
        >
          <label className="publish-field">
            <input name="published" type="checkbox" defaultChecked={project.published} />
            <span>Published on portfolio</span>
          </label>
          <label className="publish-field">
            <input
              name="isOngoing"
              type="checkbox"
              checked={isOngoing}
              onChange={(e) => handleOngoingToggle(e.target.checked)}
            />
            <span
              style={{
                color: isOngoing ? "var(--orange)" : "inherit",
                fontWeight: isOngoing ? 700 : 400,
              }}
            >
              ⚡ Currently Doing Project (Active Development)
            </span>
          </label>
          <label className="publish-field">
            <input
              name="featuredOnHome"
              type="checkbox"
              checked={featuredOnHome}
              onChange={(e) => setFeaturedOnHome(e.target.checked)}
            />
            <span>
              {isOngoing
                ? "⭐ Showcase in Currently Working on Main Page (Top 2 limit)"
                : "★ Feature in Main Page Top 5 (Real Problems limit)"}
            </span>
          </label>
        </div>

        {/* Artwork & Image Section */}
        {isOngoing ? (
          /* Currently Doing Project: Strictly ONE Image (Active Development Orange Coder Artwork) */
          <div
            className="field full-width"
            style={{
              background: "linear-gradient(135deg, rgba(255, 94, 44, 0.1) 0%, rgba(15, 23, 38, 0.85) 100%)",
              border: "1px solid rgba(255, 94, 44, 0.35)",
              borderRadius: "10px",
              padding: "18px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 12,
                marginBottom: 14,
              }}
            >
              <div>
                <span
                  style={{
                    color: "var(--orange)",
                    fontWeight: 700,
                    fontSize: "12px",
                    letterSpacing: "0.08em",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Sparkles size={13} /> CURRENTLY DOING PROJECT · STRICTLY 1 IMAGE
                </span>
                <h4 style={{ margin: "4px 0 2px", fontSize: "15px", color: "var(--white)" }}>
                  Active Development Cyber Coder Artwork
                </h4>
                <p style={{ margin: 0, fontSize: "12px", color: "var(--muted)" }}>
                  All currently doing projects strictly feature 1 single image using this glowing orange coder artwork.
                </p>
              </div>

              <button
                type="button"
                className="button button-secondary"
                style={{
                  borderColor: "var(--orange)",
                  color: "var(--white)",
                  fontSize: "12px",
                  padding: "6px 12px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
                onClick={applyOngoingPreset}
              >
                <Sparkles size={12} style={{ color: "var(--orange)" }} /> Reset to Default Artwork
              </button>
            </div>

            <label htmlFor="image1" style={{ fontSize: "13px", color: "var(--white)", fontWeight: 600 }}>
              Primary Image Path (1 of 1)
            </label>
            <input
              id="image1"
              name="image1"
              value={image1}
              onChange={(e) => setImage1(e.target.value)}
              required
              maxLength={500}
              placeholder="/images/ongoing-project-cover.webp"
              style={{ borderColor: "rgba(255, 94, 44, 0.4)", fontFamily: "monospace", fontSize: "13px" }}
            />
            <span className="field-counter" style={{ color: "var(--orange)" }}>
              ✓ Exactly 1 image active for this project. Supporting images 2 & 3 are omitted.
            </span>
          </div>
        ) : (
          /* Finished Projects (Real Life Problems): 1 to 3 Images (never 0, max 3) */
          <div className="field full-width" style={{ marginTop: 6 }}>
            <div style={{ marginBottom: 10 }}>
              <span
                style={{
                  color: "var(--accent)",
                  fontWeight: 700,
                  fontSize: "12px",
                  letterSpacing: "0.08em",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <ImageIcon size={13} /> REAL PROBLEMS / FINISHED PROJECT · 1 TO 3 IMAGES
              </span>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--muted)" }}>
                Permanent finished projects must have at least 1 image and at most 3 images (1 hero + up to 2 supporting detail captures).
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label htmlFor="image1">Hero image (Required — Image 1 of up to 3)</label>
                <input
                  id="image1"
                  name="image1"
                  value={image1}
                  onChange={(e) => setImage1(e.target.value)}
                  required
                  maxLength={500}
                  placeholder="/projects/your-project/01.webp"
                />
                <span className="field-counter">Mandatory overview screenshot inside public/.</span>
              </div>

              <div>
                <label htmlFor="image2">Supporting image 1 (Optional — Image 2 of 3)</label>
                <input
                  id="image2"
                  name="image2"
                  value={image2}
                  onChange={(e) => setImage2(e.target.value)}
                  maxLength={500}
                  placeholder="/projects/your-project/02.webp (leave empty if only 1 image)"
                />
                <span className="field-counter">Optional architectural or detail capture.</span>
              </div>

              <div>
                <label htmlFor="image3">Supporting image 2 (Optional — Image 3 of 3)</label>
                <input
                  id="image3"
                  name="image3"
                  value={image3}
                  onChange={(e) => setImage3(e.target.value)}
                  maxLength={500}
                  placeholder="/projects/your-project/03.webp (leave empty if only 1 or 2 images)"
                />
                <span className="field-counter">Optional telemetry or secondary screen. Maximum 3 images total.</span>
              </div>
            </div>
          </div>
        )}

        <div className="field">
          <label htmlFor="project-github">GitHub URL</label>
          <input
            id="project-github"
            name="githubUrl"
            type="url"
            defaultValue={project.githubUrl ?? ""}
            placeholder="https://github.com/…"
          />
        </div>
        <div className="field">
          <label htmlFor="project-live">Live demo URL</label>
          <input
            id="project-live"
            name="liveUrl"
            type="url"
            defaultValue={project.liveUrl ?? ""}
            placeholder="https://…"
          />
        </div>
        <div className="field">
          <label htmlFor="project-order">Display order</label>
          <input
            id="project-order"
            name="sortOrder"
            type="number"
            min="0"
            max="999"
            defaultValue={project.sortOrder}
          />
        </div>
      </div>

      {/* Image Preview Area */}
      <div style={{ marginTop: 20 }}>
        <p style={{ fontSize: "12px", color: "var(--muted)", marginBottom: 8, fontWeight: 600 }}>
          {isOngoing ? "ACTIVE DEVELOPMENT PREVIEW (1 IMAGE)" : `GALLERY PREVIEWS (${activePreviews.length} OF MAX 3 IMAGES)`}
        </p>
        <div className="image-previews" aria-label="Image previews">
          {activePreviews.map((path, index) => (
            <div className="image-preview" key={`${index}-${path}`}>
              <Image
                src={path || "/images/ongoing-project-cover.webp"}
                alt={`${index === 0 ? "Hero" : `Supporting ${index}`} preview`}
                width={400}
                height={300}
                unoptimized
                onError={(event) => {
                  event.currentTarget.src = "/images/ongoing-project-cover.webp";
                }}
              />
              <span
                style={{
                  position: "absolute",
                  bottom: 6,
                  left: 6,
                  background: "rgba(0,0,0,0.75)",
                  color: isOngoing ? "var(--orange)" : "var(--white)",
                  fontSize: "10px",
                  padding: "2px 6px",
                  borderRadius: 4,
                  fontWeight: 600,
                  fontFamily: "monospace",
                }}
              >
                {isOngoing ? "01/01 · ONGOING ARTWORK" : `0${index + 1}/0${activePreviews.length}`}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="form-bottom">
        <Link className="admin-small-button" href="/admin-admin/dashboard/projects">
          <ArrowLeft size={13} /> Cancel
        </Link>
        <button className="button" type="submit" disabled={pending}>
          {pending ? "Saving…" : isEditing ? "Save changes" : "Create project"} {pending ? <Check size={14} /> : <Save size={14} />}
        </button>
      </div>
    </form>
  );
}
