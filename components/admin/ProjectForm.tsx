"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Save, Sparkles, Image as ImageIcon, Plus, Trash2, RotateCcw } from "lucide-react";
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
  images?: string[];
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
  images: [],
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

export function ProjectForm({
  initial,
  defaultOngoingImage = "/images/ongoing-project-cover.webp",
  defaultImageCount = 3,
}: {
  initial?: ProjectFormInitial;
  defaultOngoingImage?: string;
  defaultImageCount?: number;
}) {
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

  // Dynamic images state
  const [images, setImages] = useState<string[]>(() => {
    if (initial?.images && initial.images.length > 0) {
      return [...initial.images];
    }
    if (initial) {
      const list = [initial.image1, initial.image2, initial.image3]
        .map((s) => (typeof s === "string" ? s.trim() : ""))
        .filter(Boolean);
      return list.length > 0 ? list : ["/images/ongoing-project-cover.webp"];
    }
    // New project initialization:
    if (project.isOngoing) {
      return [defaultOngoingImage];
    }
    // Use configured defaultProjectImageCount (e.g. 3, 4, 2)
    const initialSlots: string[] = [];
    const count = Math.max(1, Math.min(10, defaultImageCount));
    for (let i = 0; i < count; i++) {
      initialSlots.push("");
    }
    return initialSlots;
  });

  const isEditing = Boolean(project.id);
  const techValue = useMemo(() => project.techStack.join(", "), [project.techStack]);
  const featureValue = useMemo(() => project.features.join("\n"), [project.features]);

  function handleTitle(value: string) {
    setTitle(value);
    if (!slugEdited) setSlug(slugify(value));
  }

  function isOngoingPlaceholder(path?: string | null): boolean {
    if (!path) return false;
    return path.includes("ongoing-project-cover") || path.includes("ongoing-coder");
  }

  function handleOngoingToggle(checked: boolean) {
    setIsOngoing(checked);
    if (checked) {
      setFeaturedOnHome(true);
      // For ongoing projects, default to 1 image using the configured default ongoing image
      setImages([defaultOngoingImage || "/images/ongoing-project-cover-violet.webp"]);
    } else {
      // When moving from ongoing to main: automatically remove default ongoing images!
      const cleaned = images.filter((img) => !isOngoingPlaceholder(img));
      const count = Math.max(1, Math.min(10, defaultImageCount));
      if (cleaned.length === 0) {
        const newSlots: string[] = [""];
        for (let i = 1; i < count; i++) {
          newSlots.push("");
        }
        setImages(newSlots);
      } else {
        const slots = [...cleaned];
        while (slots.length < count) {
          slots.push("");
        }
        setImages(slots);
      }
    }
  }

  // Dynamic Image Slots Handlers
  function updateImageAt(index: number, value: string) {
    setImages((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  function addImageSlot() {
    setImages((prev) => [...prev, ""]);
  }

  function removeImageSlot(index: number) {
    setImages((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  }

  function applyPreset(path: string) {
    setImages([path]);
  }

  function resetToDefaultCount() {
    const count = Math.max(1, Math.min(10, defaultImageCount));
    const next: string[] = [];
    for (let i = 0; i < count; i++) {
      next.push(images[i] || "");
    }
    setImages(next);
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
    const validImages = images.map((s) => s.trim()).filter(Boolean);
    const nonOngoingImages = isOngoingVal
      ? validImages
      : validImages.filter((s) => !isOngoingPlaceholder(s));

    if (nonOngoingImages.length === 0) {
      setMessageType("error");
      setMessage(
        isOngoingVal
          ? "Currently doing projects require at least 1 image (e.g. /images/ongoing-project-cover-violet.webp)."
          : "Finished projects must have at least 1 real project screenshot. Please enter an image path."
      );
      setPending(false);
      return;
    }

    const payload = {
      title: String(form.get("title") ?? ""),
      slug: String(form.get("slug") ?? ""),
      description: String(form.get("description") ?? ""),
      longDescription: String(form.get("longDescription") ?? ""),
      image1: nonOngoingImages[0] || "",
      image2: isOngoingVal ? "" : nonOngoingImages[1] || "",
      image3: isOngoingVal ? "" : nonOngoingImages[2] || "",
      images: isOngoingVal ? [nonOngoingImages[0]] : nonOngoingImages,
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

  const activePreviews = images.filter((s) => Boolean(s.trim()));

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

        {/* Dynamic Project Images Section */}
        <div
          className="field full-width"
          style={{
            background: isOngoing
              ? "linear-gradient(135deg, rgba(255, 94, 44, 0.1) 0%, rgba(15, 23, 38, 0.85) 100%)"
              : "rgba(15, 23, 42, 0.4)",
            border: isOngoing ? "1px solid rgba(255, 94, 44, 0.35)" : "1px solid var(--line)",
            borderRadius: "12px",
            padding: "20px",
            marginTop: "6px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
              marginBottom: 16,
              paddingBottom: 12,
              borderBottom: "1px solid var(--line)",
            }}
          >
            <div>
              <span
                style={{
                  color: isOngoing ? "var(--orange)" : "var(--accent)",
                  fontWeight: 700,
                  fontSize: "12px",
                  letterSpacing: "0.08em",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {isOngoing ? <Sparkles size={13} /> : <ImageIcon size={13} />}
                {isOngoing
                  ? "CURRENTLY DOING PROJECT · COVER IMAGE"
                  : `PROJECT GALLERY IMAGES · DYNAMIC (${images.length} SLOTS)`}
              </span>
              <h4 style={{ margin: "4px 0 2px", fontSize: "15px", color: "var(--white)" }}>
                {isOngoing ? "Active Development Artwork" : "Manage Project Images (Add / Remove Freely)"}
              </h4>
              <p style={{ margin: 0, fontSize: "12px", color: "var(--muted)" }}>
                {isOngoing
                  ? "Default high-contrast orange coder covers the full box with zero black edges/corners."
                  : "Add or remove image slots as needed (e.g. 2, 3, 4, 5+ images). Image 1 serves as the main card preview."}
              </p>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {isOngoing ? (
                <>
                  <button
                    type="button"
                    className="button button-secondary"
                    style={{ fontSize: "11px", padding: "5px 10px" }}
                    onClick={() => applyPreset(defaultOngoingImage)}
                  >
                    ⚡ Default Artwork
                  </button>
                  <button
                    type="button"
                    className="button button-secondary"
                    style={{ fontSize: "11px", padding: "5px 10px" }}
                    onClick={() => applyPreset("/images/ongoing-project-cover.webp")}
                  >
                    ☀️ Full-Box White BG
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="button button-secondary"
                    style={{ fontSize: "11px", padding: "5px 10px" }}
                    onClick={resetToDefaultCount}
                    title={`Reset slots to default count (${defaultImageCount})`}
                  >
                    <RotateCcw size={11} /> Reset ({defaultImageCount})
                  </button>
                  <button
                    type="button"
                    className="button"
                    style={{
                      fontSize: "11px",
                      padding: "5px 12px",
                      background: "rgba(var(--orange-rgb), 0.2)",
                      borderColor: "var(--orange)",
                      color: "#fff",
                    }}
                    onClick={addImageSlot}
                  >
                    <Plus size={12} /> Add Image Slot
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Dynamic Image Inputs List */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {images.map((imgSrc, idx) => (
              <div
                key={`slot-${idx}`}
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-end",
                  background: "rgba(0, 0, 0, 0.25)",
                  padding: "12px 14px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                }}
              >
                <div style={{ flex: 1 }}>
                  <label
                    htmlFor={`image-slot-${idx}`}
                    style={{
                      fontSize: "12px",
                      color: idx === 0 ? "var(--orange)" : "var(--soft-white)",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginBottom: 6,
                    }}
                  >
                    <span>
                      {idx === 0
                        ? "Image 1 (Main Hero / Card Cover — Required)"
                        : `Image ${idx + 1} (Supporting Gallery Capture)`}
                    </span>
                    {idx === 0 && <span style={{ color: "var(--orange)" }}>*</span>}
                  </label>
                  <input
                    id={`image-slot-${idx}`}
                    value={imgSrc}
                    onChange={(e) => updateImageAt(idx, e.target.value)}
                    required={idx === 0}
                    placeholder={
                      isOngoing
                        ? "/images/ongoing-project-cover.webp"
                        : `/projects/your-project/0${idx + 1}.webp`
                    }
                    style={{
                      fontFamily: "monospace",
                      fontSize: "13px",
                      borderColor: idx === 0 ? "rgba(255, 94, 44, 0.4)" : undefined,
                    }}
                  />
                </div>

                {!isOngoing && images.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeImageSlot(idx)}
                    className="button button-secondary"
                    style={{
                      color: "#ff6b6b",
                      borderColor: "rgba(255, 107, 107, 0.3)",
                      padding: "9px 12px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: "12px",
                      flexShrink: 0,
                    }}
                    title={`Delete image slot ${idx + 1}`}
                  >
                    <Trash2 size={13} />
                    <span>Remove</span>
                  </button>
                )}
              </div>
            ))}
          </div>

          {!isOngoing && (
            <div style={{ marginTop: 14 }}>
              <button
                type="button"
                onClick={addImageSlot}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "1px dashed rgba(255, 94, 44, 0.6)",
                  background: "rgba(var(--orange-rgb), 0.08)",
                  color: "var(--orange)",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <Plus size={14} /> Add Another Image Slot (e.g. expand to {images.length + 1} images)
              </button>
            </div>
          )}
        </div>

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

      {/* Live Image Previews Area */}
      <div style={{ marginTop: 20 }}>
        <p style={{ fontSize: "12px", color: "var(--muted)", marginBottom: 8, fontWeight: 600 }}>
          {isOngoing
            ? "ACTIVE DEVELOPMENT PREVIEW (1 IMAGE)"
            : `GALLERY PREVIEWS (${activePreviews.length} OF ${images.length} SLOTS ACTIVE)`}
        </p>
        <div className="image-previews" aria-label="Image previews">
          {activePreviews.map((path, index) => (
            <div className="image-preview" key={`${index}-${path}`} style={{ position: "relative" }}>
              <Image
                src={path || defaultOngoingImage}
                alt={`${index === 0 ? "Hero" : `Supporting ${index}`} preview`}
                width={400}
                height={300}
                unoptimized
                onError={(event) => {
                  event.currentTarget.src = defaultOngoingImage;
                }}
              />
              <span
                style={{
                  position: "absolute",
                  bottom: 6,
                  left: 6,
                  background: "rgba(0,0,0,0.85)",
                  color: isOngoing ? "var(--orange)" : "var(--white)",
                  fontSize: "10px",
                  padding: "2px 6px",
                  borderRadius: 4,
                  fontWeight: 600,
                  fontFamily: "monospace",
                  border: isOngoing ? "1px solid rgba(255, 94, 44, 0.4)" : "1px solid rgba(255,255,255,0.2)",
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
          {pending ? "Saving…" : isEditing ? "Save changes" : "Create project"}{" "}
          {pending ? <Check size={14} /> : <Save size={14} />}
        </button>
      </div>
    </form>
  );
}
