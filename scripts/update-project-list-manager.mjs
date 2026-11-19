import { readFileSync, writeFileSync } from "fs";

let content = readFileSync("components/admin/ProjectListManager.tsx", "utf8");

// 1. Update AdminProjectItem interface to include image1
if (!content.includes("image1?: string;")) {
  content = content.replace(
    '  updatedAt: string;\n}',
    '  updatedAt: string;\n  image1?: string;\n}'
  );
}

// 2. Update action type in handleToggle
content = content.replace(
  'action: "toggle_ongoing" | "toggle_featured_home" | "toggle_published"',
  'action: "toggle_ongoing" | "toggle_featured_home" | "toggle_published" | "apply_ongoing_artwork"'
);

// 3. Update state in handleToggle
if (!content.includes('action === "apply_ongoing_artwork"')) {
  content = content.replace(
    'if (action === "toggle_published") return { ...p, published: !p.published };',
    `if (action === "toggle_published") return { ...p, published: !p.published };\n          if (action === "apply_ongoing_artwork") return { ...p, image1: "/images/ongoing-project-cover.webp" };`
  );
}

// 4. Add the button to Ongoing column
if (!content.includes("Apply 1-Image Artwork")) {
  const target = `</button>
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 5, alignItems: "flex-start" }}>`;

  const replacement = `</button>
                          <button
                            type="button"
                            className="admin-set-ongoing-btn"
                            disabled={isLoading}
                            onClick={() => handleToggle(project.id, "apply_ongoing_artwork")}
                            title="Set Active Development Orange Coder artwork (1 image)"
                            style={{ fontSize: "11px", borderColor: "rgba(255, 94, 44, 0.4)", color: "var(--orange)" }}
                          >
                            <Sparkles size={11} /> Apply 1-Image Artwork
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 5, alignItems: "flex-start" }}>`;

  content = content.replace(target, replacement);
}

writeFileSync("components/admin/ProjectListManager.tsx", content, "utf8");
console.log("Updated components/admin/ProjectListManager.tsx successfully!");
