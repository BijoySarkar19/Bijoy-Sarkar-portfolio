export interface AuditFieldDiff {
  field: string;
  label: string;
  from: string;
  to: string;
}

export interface ParsedAudit {
  summary: string;
  diffs: AuditFieldDiff[];
  rawText?: string;
  hasDiff: boolean;
}

function formatValue(val: unknown): string {
  if (val === null || val === undefined) return "(none)";
  if (typeof val === "boolean") return val ? "True / Active" : "False / Inactive";
  if (typeof val === "number") return String(val);
  if (typeof val === "string") {
    if (!val.trim()) return "(empty)";
    if (val.length > 80) return val.slice(0, 77) + "...";
    return val;
  }
  if (Array.isArray(val)) {
    if (val.length === 0) return "(empty list)";
    return val.map((v) => (typeof v === "object" ? JSON.stringify(v) : String(v))).join(", ");
  }
  if (typeof val === "object") {
    try {
      const keys = Object.keys(val as Record<string, unknown>);
      if (keys.length === 0) return "(empty object)";
      return keys.join(", ");
    } catch {
      return "[Object]";
    }
  }
  return String(val);
}

function fieldToLabel(field: string): string {
  const map: Record<string, string> = {
    title: "Title",
    slug: "URL Slug",
    description: "Description",
    longDescription: "Detailed Overview",
    published: "Publication Status",
    isOngoing: "Stage / Currently Working",
    featuredOnHome: "Showcase on Home",
    sortOrder: "Display Order",
    techStack: "Tech Stack",
    features: "Key Features",
    githubUrl: "GitHub Link",
    liveUrl: "Live URL",
    role: "Job / Role Title",
    organization: "Company / Organization",
    period: "Time Period",
    summary: "Role Summary",
    category: "Category Name",
    skills: "Skills / Tools List",
    filename: "Document Filename",
    active: "Active Status",
    aboutTitle: "About Section Heading",
    aboutBio: "About Bio Summary",
    aboutLead: "Engineering Philosophy",
    skillsTitle: "Skills Heading",
    projectsTitle: "Projects Heading",
    ongoingTitle: "Currently Working Heading",
    heroTitle: "Primary Hero Title",
    status: "Status Pill",
    location: "Permanent Address",
    themeAccent: "Color Accent",
    themeMode: "Display Mode",
  };
  return map[field] || field.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
}

export function parseAuditChanges(
  rawChanges: unknown,
  action: string,
  entity: string
): ParsedAudit {
  let parsed: any = null;

  if (typeof rawChanges === "string") {
    try {
      parsed = JSON.parse(rawChanges);
    } catch {
      parsed = rawChanges;
    }
  } else {
    parsed = rawChanges;
  }

  // Handle simple string change or empty
  if (!parsed || typeof parsed !== "object") {
    const text = String(parsed || "");
    return {
      summary: text || `${action} on ${entity}`,
      diffs: [],
      rawText: text,
      hasDiff: false,
    };
  }

  const summary =
    parsed.summary ||
    (action === "INITIAL_SEED"
      ? "Initial system setup & seed data loaded"
      : `${action} on ${entity}`);

  const diffs: AuditFieldDiff[] = [];

  const prev = parsed.previous;
  const curr = parsed.current;

  if (prev && curr && typeof prev === "object" && typeof curr === "object") {
    const allKeys = Array.from(new Set([...Object.keys(prev), ...Object.keys(curr)]));
    for (const key of allKeys) {
      if (
        key === "id" ||
        key === "createdAt" ||
        key === "updatedAt" ||
        key === "passwordHash" ||
        key === "userId"
      ) {
        continue;
      }
      const prevVal = prev[key];
      const currVal = curr[key];
      const prevStr = JSON.stringify(prevVal ?? null);
      const currStr = JSON.stringify(currVal ?? null);

      if (prevStr !== currStr) {
        diffs.push({
          field: key,
          label: fieldToLabel(key),
          from: formatValue(prevVal),
          to: formatValue(currVal),
        });
      }
    }
  } else if (!prev && curr && typeof curr === "object") {
    // Record created
    const keys = ["title", "role", "category", "filename", "isOngoing", "featuredOnHome", "published"];
    for (const key of keys) {
      if (key in curr) {
        diffs.push({
          field: key,
          label: fieldToLabel(key),
          from: "(created)",
          to: formatValue(curr[key]),
        });
      }
    }
  } else if (prev && !curr && typeof prev === "object") {
    // Record deleted
    const keys = ["title", "role", "category", "filename"];
    for (const key of keys) {
      if (key in prev) {
        diffs.push({
          field: key,
          label: fieldToLabel(key),
          from: formatValue(prev[key]),
          to: "(removed)",
        });
      }
    }
  }

  return {
    summary,
    diffs,
    rawText: JSON.stringify(parsed, null, 2),
    hasDiff: diffs.length > 0,
  };
}
