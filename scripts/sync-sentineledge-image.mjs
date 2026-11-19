import Database from "better-sqlite3";
import { readFileSync, writeFileSync } from "fs";

// ── 1. Update dev.db ─────────────────────────────────────
const db = new Database("dev.db");

// Update SentinelEdge (currently doing project) to use the 1 single orange coder artwork
db.prepare(`
  UPDATE Project
  SET image1 = '/images/ongoing-project-cover.webp',
      image2 = '',
      image3 = '',
      isOngoing = 1,
      featuredOnHome = 1,
      updatedAt = CURRENT_TIMESTAMP
  WHERE slug = 'sentineledge'
`).run();

// Record audit log
const auditId = "audit_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 7);
const sentinelRow = db.prepare("SELECT * FROM Project WHERE slug = 'sentineledge'").get();
const auditSummary = `Updated "SentinelEdge" to use 1-Image Active Development Orange Coder artwork (/images/ongoing-project-cover.webp)`;
db.prepare(`
  INSERT INTO AuditLog (id, entity, entityId, action, changes, adminId, adminName, timestamp)
  VALUES (?, 'PROJECT', ?, 'UPDATE', ?, 'admin-system', 'Bijoy Sarkar', CURRENT_TIMESTAMP)
`).run(auditId, sentinelRow.id, JSON.stringify({ summary: auditSummary, current: sentinelRow }));

console.log("Updated SentinelEdge in dev.db and logged audit entry:", auditId);
db.close();

// ── 2. Update scripts/ensure-db.mjs ───────────────────────
let ensureDb = readFileSync("scripts/ensure-db.mjs", "utf8");
ensureDb = ensureDb.replace(
  `image1 = '/projects/sentineledge/01.webp',
            image2 = '/projects/sentineledge/02.webp',
            image3 = '/projects/sentineledge/03.webp'`,
  `image1 = '/images/ongoing-project-cover.webp',
            image2 = '',
            image3 = ''`
);
writeFileSync("scripts/ensure-db.mjs", ensureDb, "utf8");
console.log("Updated scripts/ensure-db.mjs");

// ── 3. Update prisma/seed.ts ──────────────────────────────
let seed = readFileSync("prisma/seed.ts", "utf8");
seed = seed.replace(
  `slug: "sentineledge",
    title: "SentinelEdge",
    description: "Privacy-First Edge-to-Cloud Video & Incident Intelligence Platform",
    longDescription: "A high-performance edge-to-cloud intelligence platform engineered for real-time video stream ingestion, on-device neural incident detection, privacy-preserving redaction at the edge, and secure telemetry synchronization to distributed cloud clusters. Built for mission-critical situational awareness with sub-second alerting and zero-trust data protection.",
    image1: "/projects/sentineledge/01.webp",
    image2: "/projects/sentineledge/02.webp",
    image3: "/projects/sentineledge/03.webp",`,
  `slug: "sentineledge",
    title: "SentinelEdge",
    description: "Privacy-First Edge-to-Cloud Video & Incident Intelligence Platform",
    longDescription: "A high-performance edge-to-cloud intelligence platform engineered for real-time video stream ingestion, on-device neural incident detection, privacy-preserving redaction at the edge, and secure telemetry synchronization to distributed cloud clusters. Built for mission-critical situational awareness with sub-second alerting and zero-trust data protection.",
    image1: "/images/ongoing-project-cover.webp",
    image2: "",
    image3: "",`
);
writeFileSync("prisma/seed.ts", seed, "utf8");
console.log("Updated prisma/seed.ts");

// ── 4. Update lib/fallback-data.ts ────────────────────────
let fallback = readFileSync("lib/fallback-data.ts", "utf8");
fallback = fallback.replace(
  `slug: "sentineledge",
    title: "SentinelEdge",
    description: "Privacy-First Edge-to-Cloud Video & Incident Intelligence Platform",
    longDescription: "A high-performance edge-to-cloud intelligence platform engineered for real-time video stream ingestion, on-device neural incident detection, privacy-preserving redaction at the edge, and secure telemetry synchronization to distributed cloud clusters. Built for mission-critical situational awareness with sub-second alerting and zero-trust data protection.",
    image1: "/projects/sentineledge/01.webp",
    image2: "/projects/sentineledge/02.webp",
    image3: "/projects/sentineledge/03.webp",`,
  `slug: "sentineledge",
    title: "SentinelEdge",
    description: "Privacy-First Edge-to-Cloud Video & Incident Intelligence Platform",
    longDescription: "A high-performance edge-to-cloud intelligence platform engineered for real-time video stream ingestion, on-device neural incident detection, privacy-preserving redaction at the edge, and secure telemetry synchronization to distributed cloud clusters. Built for mission-critical situational awareness with sub-second alerting and zero-trust data protection.",
    image1: "/images/ongoing-project-cover.webp",
    image2: "",
    image3: "",`
);
writeFileSync("lib/fallback-data.ts", fallback, "utf8");
console.log("Updated lib/fallback-data.ts");
