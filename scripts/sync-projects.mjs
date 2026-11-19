import Database from "better-sqlite3";
import { readFileSync, writeFileSync } from "fs";
import path from "path";

const dbPath = path.resolve(process.cwd(), "dev.db");
const db = new Database(dbPath);

console.log("--- 1. Updating dev.db ---");

// 1. Ensure CivicLens Core is configured in Main Projects (Real problems)
db.prepare(`
  UPDATE Project
  SET isOngoing = 0,
      featuredOnHome = 1,
      sortOrder = 2,
      image1 = '/projects/civiclens-core/01.webp',
      image2 = '/projects/civiclens-core/02.webp',
      image3 = '/projects/civiclens-core/03.webp',
      githubUrl = 'https://github.com/BijoySarkar19/CivicLens-Core',
      updatedAt = CURRENT_TIMESTAMP
  WHERE slug = 'civiclens-core'
`).run();

// 2. Ensure Main Top 5 projects
db.prepare("UPDATE Project SET sortOrder = 1, featuredOnHome = 1, isOngoing = 0 WHERE slug = 'owasp-ai-security-assistant'").run();
db.prepare("UPDATE Project SET sortOrder = 3, featuredOnHome = 1, isOngoing = 0 WHERE slug = 'road-segmentation'").run();
db.prepare("UPDATE Project SET sortOrder = 4, featuredOnHome = 1, isOngoing = 0 WHERE slug = 'vaultora-bank'").run();
db.prepare("UPDATE Project SET sortOrder = 5, featuredOnHome = 1, isOngoing = 0 WHERE slug = 'c-compiler-studio'").run();
db.prepare("UPDATE Project SET sortOrder = 6, featuredOnHome = 0, isOngoing = 0 WHERE slug = 'nexora-private-search'").run();

// 3. Upsert SentinelEdge in dev.db
const existingSentinel = db.prepare("SELECT * FROM Project WHERE slug = 'sentineledge'").get();

const sentinelData = {
  slug: "sentineledge",
  title: "SentinelEdge",
  description: "Privacy-First Edge-to-Cloud Video & Incident Intelligence Platform",
  longDescription: "A high-performance edge-to-cloud intelligence platform engineered for real-time video stream ingestion, on-device neural incident detection, privacy-preserving redaction at the edge, and secure telemetry synchronization to distributed cloud clusters. Built for mission-critical situational awareness with sub-second alerting and zero-trust data protection.",
  image1: "/projects/sentineledge/01.webp",
  image2: "/projects/sentineledge/02.webp",
  image3: "/projects/sentineledge/03.webp",
  techStack: JSON.stringify(["Edge AI", "Computer Vision", "FastAPI", "PyTorch", "WebRTC", "Docker", "Zero-Trust"]),
  features: JSON.stringify([
    "Real-time edge video stream ingestion and neural inference",
    "Privacy-preserving on-device facial and license plate redaction",
    "Sub-second incident detection and automated priority alerts",
    "Resilient edge-to-cloud telemetry sync with offline-first buffering",
    "Hardware-accelerated edge pipelines with end-to-end encryption"
  ]),
  githubUrl: null,
  liveUrl: null,
  published: 1,
  isOngoing: 1,
  featuredOnHome: 1,
  sortOrder: 1,
};

let sentinelId;
if (existingSentinel) {
  sentinelId = existingSentinel.id;
  db.prepare(`
    UPDATE Project
    SET title = @title,
        description = @description,
        longDescription = @longDescription,
        image1 = @image1,
        image2 = @image2,
        image3 = @image3,
        techStack = @techStack,
        features = @features,
        githubUrl = @githubUrl,
        liveUrl = @liveUrl,
        published = @published,
        isOngoing = @isOngoing,
        featuredOnHome = @featuredOnHome,
        sortOrder = @sortOrder,
        updatedAt = CURRENT_TIMESTAMP
    WHERE slug = 'sentineledge'
  `).run(sentinelData);
  console.log("Updated SentinelEdge in dev.db with ID:", sentinelId);
} else {
  sentinelId = "proj_sentineledge_" + Date.now().toString(36);
  db.prepare(`
    INSERT INTO Project (
      id, slug, title, description, longDescription, image1, image2, image3,
      techStack, features, githubUrl, liveUrl, published, isOngoing, featuredOnHome, sortOrder,
      createdAt, updatedAt
    ) VALUES (
      ?, @slug, @title, @description, @longDescription, @image1, @image2, @image3,
      @techStack, @features, @githubUrl, @liveUrl, @published, @isOngoing, @featuredOnHome, @sortOrder,
      CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )
  `).run(sentinelId, sentinelData);
  console.log("Inserted SentinelEdge into dev.db with ID:", sentinelId);
}

// 4. Audit Log Entry in dev.db
const auditId = "audit_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 7);
const currentSentinel = db.prepare("SELECT * FROM Project WHERE slug = 'sentineledge'").get();
const auditSummary = `Added "SentinelEdge" to Currently Working Projects (Privacy-First Edge-to-Cloud Video & Incident Intelligence Platform)`;
const auditPayload = JSON.stringify({
  summary: auditSummary,
  previous: existingSentinel || null,
  current: currentSentinel,
});

db.prepare(`
  INSERT INTO AuditLog (id, entity, entityId, action, changes, adminId, adminName, timestamp)
  VALUES (?, 'PROJECT', ?, ?, ?, 'admin-system', 'Bijoy Sarkar', CURRENT_TIMESTAMP)
`).run(auditId, sentinelId, existingSentinel ? "UPDATE" : "CREATE", auditPayload);
console.log("Recorded AuditLog entry:", auditId);

// Verify dev.db
const mainProjects = db.prepare("SELECT id, slug, title, sortOrder, featuredOnHome, isOngoing FROM Project WHERE published = 1 AND featuredOnHome = 1 AND isOngoing = 0 ORDER BY sortOrder ASC").all();
const ongoingProjects = db.prepare("SELECT id, slug, title, sortOrder, featuredOnHome, isOngoing FROM Project WHERE published = 1 AND featuredOnHome = 1 AND isOngoing = 1 ORDER BY sortOrder ASC").all();

console.log("\n=== VERIFICATION: dev.db Main Projects (Top 5) ===");
console.table(mainProjects);
console.log("\n=== VERIFICATION: dev.db Ongoing Projects (Top 2) ===");
console.table(ongoingProjects);

db.close();

console.log("\n--- 2. Updating scripts/ensure-db.mjs ---");
const ensureDbContent = `import "dotenv/config";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import Database from "better-sqlite3";

const url = process.env.DATABASE_URL ?? "file:./dev.db";
if (!url.startsWith("file:")) {
  throw new Error("The local setup command expects a SQLite file URL in DATABASE_URL.");
}

const fileName = decodeURIComponent(url.slice("file:".length).split("?")[0]);
const databasePath = resolve(process.cwd(), fileName);
if (!existsSync(databasePath)) {
  mkdirSync(dirname(databasePath), { recursive: true });
  const database = new Database(databasePath);
  database.close();
} else {
  try {
    const database = new Database(databasePath);
    // Ensure CivicLens Core is deployed to Main Projects (Real problems) with WebP screenshots and repository
    database.prepare(\`
      UPDATE Project
      SET isOngoing = 0,
          featuredOnHome = 1,
          sortOrder = 2,
          image1 = '/projects/civiclens-core/01.webp',
          image2 = '/projects/civiclens-core/02.webp',
          image3 = '/projects/civiclens-core/03.webp',
          githubUrl = 'https://github.com/BijoySarkar19/CivicLens-Core'
      WHERE slug = 'civiclens-core'
    \`).run();

    // Ensure SentinelEdge is active in Currently Working
    const hasSentinel = database.prepare("SELECT id FROM Project WHERE slug = 'sentineledge'").get();
    if (hasSentinel) {
      database.prepare(\`
        UPDATE Project
        SET isOngoing = 1,
            featuredOnHome = 1,
            sortOrder = 1,
            image1 = '/projects/sentineledge/01.webp',
            image2 = '/projects/sentineledge/02.webp',
            image3 = '/projects/sentineledge/03.webp'
        WHERE slug = 'sentineledge'
      \`).run();
    }
    database.close();
  } catch {}
}
`;
writeFileSync("scripts/ensure-db.mjs", ensureDbContent, "utf8");
console.log("Updated scripts/ensure-db.mjs");

console.log("\n--- 3. Updating prisma/seed.ts ---");
// Let's read and parse prisma/seed.ts
let seedContent = readFileSync("prisma/seed.ts", "utf8");

// Define full updated projects array in seed.ts
const updatedProjectsSeed = `const projects = [
  {
    slug: "owasp-ai-security-assistant",
    title: "OWASP AI Security Assistant",
    description: "Review code and endpoints against OWASP risks with local AI analysis and remediation guidance.",
    longDescription: "A cybersecurity application that reviews code snippets and URL endpoints against OWASP vulnerability categories. Local inference with Ollama supports security analysis, findings history, and remediation recommendations while keeping the assessment workflow close to the developer.",
    image1: "/projects/owasp-ai-security-assistant/01.webp",
    image2: "/projects/owasp-ai-security-assistant/02.webp",
    image3: "/projects/owasp-ai-security-assistant/03.webp",
    techStack: ["Python", "Flask", "Ollama", "Llama 3.2", "SQLite", "OWASP"],
    features: ["OWASP Top 10 guidance", "Local LLM inference", "Saved security review history", "Risk summaries and secure-code recommendations"],
    githubUrl: "https://github.com/BijoySarkar19/owasp-ai-security-assistant",
    liveUrl: null,
    featuredOnHome: true,
    isOngoing: false,
    sortOrder: 1,
  },
  {
    slug: "civiclens-core",
    title: "CivicLens Core",
    description: "A geospatial platform for mapping public infrastructure and reported civic issues.",
    longDescription: "A full-stack public-infrastructure intelligence platform designed around geospatial data. The core architecture brings together APIs, spatial storage, caching, background workers, and object storage, with a path toward AI-assisted risk prediction and maintenance planning.",
    image1: "/projects/civiclens-core/01.webp",
    image2: "/projects/civiclens-core/02.webp",
    image3: "/projects/civiclens-core/03.webp",
    techStack: ["FastAPI", "PostgreSQL", "PostGIS", "Redis", "Docker", "Next.js"],
    features: ["Geospatial infrastructure records", "Civic issue mapping and analysis", "API, database, and background-worker services", "Architecture prepared for risk prediction"],
    githubUrl: "https://github.com/BijoySarkar19/CivicLens-Core",
    liveUrl: null,
    published: true,
    isOngoing: false,
    featuredOnHome: true,
    sortOrder: 2,
  },
  {
    slug: "road-segmentation",
    title: "Road Segmentation from Satellite Imagery",
    description: "Extract road networks from satellite images with a deep-learning segmentation workflow.",
    longDescription: "A computer-vision project for pixel-wise road extraction from satellite imagery. The project brings together image preparation, U-Net training and inference, prediction masks, overlays, and evaluation views for inspecting segmentation results.",
    image1: "/projects/road-segmentation/01.webp",
    image2: "/projects/road-segmentation/02.webp",
    image3: "/projects/road-segmentation/03.webp",
    techStack: ["Python", "Deep Learning", "U-Net", "Computer Vision", "Satellite Imagery"],
    features: ["Satellite image preprocessing", "Pixel-wise road masks", "Overlay-based result inspection", "Training and evaluation views"],
    githubUrl: "https://github.com/BijoySarkar19/road-segmentation-satellite-imagery",
    liveUrl: null,
    featuredOnHome: true,
    isOngoing: false,
    sortOrder: 3,
  },
  {
    slug: "vaultora-bank",
    title: "Vaultora Bank",
    description: "A digital banking experience for account summaries, cards, payments, and financial activity.",
    longDescription: "A banking product interface concept that brings account balances, card controls, recent transactions, UPI and digital rupee payments, and security status into one responsive workspace.",
    image1: "/projects/vaultora-bank/01.webp",
    image2: "/projects/vaultora-bank/02.webp",
    image3: "/projects/vaultora-bank/03.webp",
    techStack: ["Next.js", "TypeScript", "Tailwind CSS", "Node.js", "PostgreSQL", "Razorpay"],
    features: ["Account and card overview", "Payments and transaction views", "UPI and digital rupee interface", "Security and account status panels"],
    githubUrl: "https://github.com/BijoySarkar19/Vaultora-Bank",
    liveUrl: null,
    featuredOnHome: true,
    isOngoing: false,
    sortOrder: 4,
  },
  {
    slug: "c-compiler-studio",
    title: "C Compiler Studio",
    description: "An interactive MiniC workspace for editing, compiling, and inspecting program output.",
    longDescription: "A web-based compiler learning environment that presents the MiniC workflow from source code through lexical analysis, parsing, intermediate code, and execution with GCC. The interface also surfaces diagnostics and generated artifacts.",
    image1: "/projects/c-compiler-studio/01.webp",
    image2: "/projects/c-compiler-studio/02.webp",
    image3: "/projects/c-compiler-studio/03.webp",
    techStack: ["Python", "Flask", "C", "GCC", "Docker"],
    features: ["MiniC source editor", "Lexer, parser, and AST workflow", "Intermediate code inspection", "GCC execution and diagnostics"],
    githubUrl: "https://github.com/BijoySarkar19/c-compiler-studio",
    liveUrl: null,
    featuredOnHome: true,
    isOngoing: false,
    sortOrder: 5,
  },
  {
    slug: "nexora-private-search",
    title: "Nexora",
    description: "A privacy-oriented search experience with web search, AI answers, and private sessions.",
    longDescription: "A search product concept combining web results, AI-assisted summaries, private browsing sessions, and visible privacy controls. The supplied screens show the experience across search, results, and AI-assisted research.",
    image1: "/projects/nexora-private-search/01.webp",
    image2: "/projects/nexora-private-search/02.webp",
    image3: "/projects/nexora-private-search/03.webp",
    techStack: ["Private Search", "AI Search", "Browser UX", "Privacy Controls"],
    features: ["Web and AI search views", "Private session controls", "Search result and summary layouts", "Privacy status and preferences"],
    githubUrl: "https://github.com/BijoySarkar19/nexora-private-search",
    liveUrl: null,
    featuredOnHome: false,
    isOngoing: false,
    sortOrder: 6,
  },
  {
    slug: "pixeldb-engine",
    title: "PixelDB Engine",
    description: "An educational database engine that makes query execution and storage internals visible.",
    longDescription: "A database-engine project with an educational interface for exploring SQL queries, tables, indexes, page storage, transactions, and recovery. The pixel-art presentation makes lower-level database concepts easier to inspect.",
    image1: "/projects/pixeldb-engine/01.webp",
    image2: "/projects/pixeldb-engine/02.webp",
    image3: "/projects/pixeldb-engine/03.webp",
    techStack: ["Java", "Maven", "SQL", "B+ Tree", "Storage Engine"],
    features: ["SQL execution interface", "Visual B+ tree inspector", "Page storage and buffer view", "Transaction and recovery visualizer"],
    githubUrl: "https://github.com/BijoySarkar19/pixeldb-engine",
    liveUrl: null,
    featuredOnHome: false,
    isOngoing: false,
    sortOrder: 7,
  },
  {
    slug: "javacachedb",
    title: "JavaCacheDB",
    description: "A lightweight in-memory cache system inspired by Redis with TTL and LRU eviction.",
    longDescription: "A high-performance in-memory key-value cache built in pure Java. Implements concurrent read-write locks, time-to-live expiration, LRU eviction policy, snapshot persistence, and a custom RESP-compatible protocol server.",
    image1: "/projects/javacachedb/01.webp",
    image2: "/projects/javacachedb/02.webp",
    image3: "/projects/javacachedb/03.webp",
    techStack: ["Java", "Concurrency", "Networking", "RESP Protocol", "In-Memory"],
    features: ["TTL expiration engine", "LRU memory eviction", "Snapshot persistence to disk", "Multi-client TCP server"],
    githubUrl: "https://github.com/BijoySarkar19/javacachedb",
    liveUrl: null,
    featuredOnHome: false,
    isOngoing: false,
    sortOrder: 8,
  },
  {
    slug: "rakshak-ai",
    title: "Rakshak AI",
    description: "AI-powered disaster response assistant with offline emergency routing and resource tracking.",
    longDescription: "An intelligent disaster management platform that coordinates relief efforts during severe weather and crisis events. Features offline-first routing, dynamic emergency supply tracking, SOS beacon broadcast, and bilingual voice assistant.",
    image1: "/projects/rakshak-ai/01.webp",
    image2: "/projects/rakshak-ai/02.webp",
    image3: "/projects/rakshak-ai/03.webp",
    techStack: ["Next.js", "FastAPI", "PyTorch", "OpenStreetMap", "WebRTC"],
    features: ["Offline emergency routing", "Real-time supply telemetry", "Multimodal SOS detection", "Disaster zone damage heatmaps"],
    githubUrl: "https://github.com/BijoySarkar19/rakshak-ai",
    liveUrl: null,
    featuredOnHome: false,
    isOngoing: false,
    sortOrder: 9,
  },
  {
    slug: "smart-attendance-system",
    title: "Smart Attendance System",
    description: "Automated biometric attendance tracker using real-time facial recognition and anti-spoofing.",
    longDescription: "A robust computer-vision attendance management solution featuring multi-face detection, liveness verification, automated CSV report generation, and an administrative analytics dashboard.",
    image1: "/projects/smart-attendance-system/01.webp",
    image2: "/projects/smart-attendance-system/02.webp",
    image3: "/projects/smart-attendance-system/03.webp",
    techStack: ["Python", "OpenCV", "Face Recognition", "SQLite", "Streamlit"],
    features: ["Real-time facial detection", "Anti-spoofing liveness check", "Automated attendance logging", "Admin dashboard with exports"],
    githubUrl: "https://github.com/BijoySarkar19/smart-attendance-system",
    liveUrl: null,
    featuredOnHome: false,
    isOngoing: false,
    sortOrder: 10,
  },
  {
    slug: "sentimentx",
    title: "SentimentX",
    description: "Fine-grained sentiment and emotion analysis engine for customer feedback and social text.",
    longDescription: "An NLP pipeline capable of multi-label sentiment scoring, aspect-based sentiment extraction, sarcasm detection, and sentiment trajectory mapping over time for enterprise support streams.",
    image1: "/projects/sentimentx/01.webp",
    image2: "/projects/sentimentx/02.webp",
    image3: "/projects/sentimentx/03.webp",
    techStack: ["Python", "Transformers", "BERT", "FastAPI", "React"],
    features: ["Aspect-based sentiment analysis", "Emotion classification matrix", "Interactive sentiment timeline", "RESTful batch scoring API"],
    githubUrl: "https://github.com/BijoySarkar19/sentimentx",
    liveUrl: null,
    featuredOnHome: false,
    isOngoing: false,
    sortOrder: 11,
  },
  {
    slug: "expense-tracker",
    title: "Expense Tracker",
    description: "A cross-platform financial tracking app with category analytics, budget goals, and cloud sync.",
    longDescription: "A personal finance mobile application built with Flutter and Firebase. Enables real-time expense logging, visual monthly budget trends, offline support, and multi-currency conversion.",
    image1: "/projects/expense-tracker/01.webp",
    image2: "/projects/expense-tracker/02.webp",
    image3: "/projects/expense-tracker/03.webp",
    techStack: ["Flutter", "Dart", "Firebase", "Cloud Firestore", "Provider"],
    features: ["Real-time expense logging", "Category budget analytics", "Offline local cache sync", "CSV statement export"],
    githubUrl: "https://github.com/BijoySarkar19/expense-tracker",
    liveUrl: null,
    featuredOnHome: false,
    isOngoing: false,
    sortOrder: 12,
  },
  {
    slug: "novamart-commerce",
    title: "NovaMart Commerce",
    description: "A modern headless e-commerce store with server-side rendering, cart, and payment checkout.",
    longDescription: "A full-featured commerce store built with Next.js App Router, Stripe checkout, server actions, dynamic product filtering, customer reviews, and order tracking dashboard.",
    image1: "/projects/novamart-commerce/01.webp",
    image2: "/projects/novamart-commerce/02.webp",
    image3: "/projects/novamart-commerce/03.webp",
    techStack: ["Next.js", "TypeScript", "Tailwind CSS", "Stripe", "Prisma"],
    features: ["Headless catalog & search", "Secure Stripe checkout", "Server-rendered product pages", "Customer order history portal"],
    githubUrl: "https://github.com/BijoySarkar19/novamart-commerce",
    liveUrl: null,
    featuredOnHome: false,
    isOngoing: false,
    sortOrder: 13,
  },
  {
    slug: "advanced-nlp-analytics",
    title: "Advanced NLP Analytics",
    description: "Enterprise text analytics platform for topic modeling, entity recognition, and summarization.",
    longDescription: "A comprehensive natural language processing platform providing document clustering, automated abstractive summarization, named entity recognition (NER), and semantic similarity search.",
    image1: "/projects/advanced-nlp-analytics/01.webp",
    image2: "/projects/advanced-nlp-analytics/02.webp",
    image3: "/projects/advanced-nlp-analytics/03.webp",
    techStack: ["Python", "spaCy", "Hugging Face", "FastAPI", "Elasticsearch"],
    features: ["Named entity recognition", "Topic modeling with BERTopic", "Semantic vector search", "Automated text summarization"],
    githubUrl: "https://github.com/BijoySarkar19/advanced-nlp-analytics",
    liveUrl: null,
    featuredOnHome: false,
    isOngoing: false,
    sortOrder: 14,
  },
  {
    slug: "aether-platform",
    title: "Aether AI Platform",
    description: "Full-stack developer platform integrating model chat, agent workflows, and telemetry.",
    longDescription: "An end-to-end AI platform engineered for developer teams to design, evaluate, and deploy autonomous LLM agents with real-time prompt telemetry, execution tracing, and role-based access control.",
    image1: "/projects/aether-platform/01.webp",
    image2: "/projects/aether-platform/02.webp",
    image3: "/projects/aether-platform/03.webp",
    techStack: ["Next.js", "FastAPI", "LangChain", "PostgreSQL", "Docker"],
    features: ["Agent execution playground", "LLM evaluation workbench", "Prompt versioning and diffing", "Distributed telemetry dashboard"],
    githubUrl: "https://github.com/BijoySarkar19/aether-ai-engineering-platform",
    liveUrl: null,
    featuredOnHome: false,
    isOngoing: false,
    sortOrder: 15,
  },
  {
    slug: "sentineledge",
    title: "SentinelEdge",
    description: "Privacy-First Edge-to-Cloud Video & Incident Intelligence Platform",
    longDescription: "A high-performance edge-to-cloud intelligence platform engineered for real-time video stream ingestion, on-device neural incident detection, privacy-preserving redaction at the edge, and secure telemetry synchronization to distributed cloud clusters. Built for mission-critical situational awareness with sub-second alerting and zero-trust data protection.",
    image1: "/projects/sentineledge/01.webp",
    image2: "/projects/sentineledge/02.webp",
    image3: "/projects/sentineledge/03.webp",
    techStack: ["Edge AI", "Computer Vision", "FastAPI", "PyTorch", "WebRTC", "Docker", "Zero-Trust"],
    features: [
      "Real-time edge video stream ingestion and neural inference",
      "Privacy-preserving on-device facial and license plate redaction",
      "Sub-second incident detection and automated priority alerts",
      "Resilient edge-to-cloud telemetry sync with offline-first buffering",
      "Hardware-accelerated edge pipelines with end-to-end encryption"
    ],
    githubUrl: null,
    liveUrl: null,
    published: true,
    isOngoing: true,
    featuredOnHome: true,
    sortOrder: 1,
  },
];`;

// Replace const projects = [ ... ]; in seed.ts
const seedProjectsStart = seedContent.indexOf("const projects = [");
const seedProjectsEnd = seedContent.indexOf("];", seedProjectsStart) + 2;
seedContent = seedContent.substring(0, seedProjectsStart) + updatedProjectsSeed + seedContent.substring(seedProjectsEnd);
writeFileSync("prisma/seed.ts", seedContent, "utf8");
console.log("Updated prisma/seed.ts");

console.log("\n--- 4. Updating lib/fallback-data.ts ---");
let fallbackContent = readFileSync("lib/fallback-data.ts", "utf8");
const updatedFallbackProjects = `export const FALLBACK_PROJECTS: FallbackProject[] = [
  {
    id: "proj-1",
    slug: "owasp-ai-security-assistant",
    title: "OWASP AI Security Assistant",
    description: "Review code and endpoints against OWASP risks with local AI analysis and remediation guidance.",
    longDescription: "A cybersecurity application that reviews code snippets and URL endpoints against OWASP vulnerability categories. Local inference with Ollama supports security analysis, findings history, and remediation recommendations while keeping the assessment workflow close to the developer.",
    image1: "/projects/owasp-ai-security-assistant/01.webp",
    image2: "/projects/owasp-ai-security-assistant/02.webp",
    image3: "/projects/owasp-ai-security-assistant/03.webp",
    techStack: ["Python", "Flask", "Ollama", "Llama 3.2", "SQLite", "OWASP"],
    features: ["OWASP Top 10 guidance", "Local LLM inference", "Saved security review history", "Risk summaries and secure-code recommendations"],
    githubUrl: "https://github.com/BijoySarkar19/owasp-ai-security-assistant",
    liveUrl: null,
    featuredOnHome: true,
    isOngoing: false,
    published: true,
    sortOrder: 1,
  },
  {
    id: "proj-2",
    slug: "civiclens-core",
    title: "CivicLens Core",
    description: "A geospatial platform for mapping public infrastructure and reported civic issues.",
    longDescription: "A full-stack public-infrastructure intelligence platform designed around geospatial data. The core architecture brings together APIs, spatial storage, caching, background workers, and object storage, with a path toward AI-assisted risk prediction and maintenance planning.",
    image1: "/projects/civiclens-core/01.webp",
    image2: "/projects/civiclens-core/02.webp",
    image3: "/projects/civiclens-core/03.webp",
    techStack: ["FastAPI", "PostgreSQL", "PostGIS", "Redis", "Docker", "Next.js"],
    features: ["Geospatial infrastructure records", "Civic issue mapping and analysis", "API, database, and background-worker services", "Architecture prepared for risk prediction"],
    githubUrl: "https://github.com/BijoySarkar19/CivicLens-Core",
    liveUrl: null,
    published: true,
    isOngoing: false,
    featuredOnHome: true,
    sortOrder: 2,
  },
  {
    id: "proj-3",
    slug: "road-segmentation",
    title: "Road Segmentation from Satellite Imagery",
    description: "Extract road networks from satellite images with a deep-learning segmentation workflow.",
    longDescription: "A computer-vision project for pixel-wise road extraction from satellite imagery. The project brings together image preparation, U-Net training and inference, prediction masks, overlays, and evaluation views for inspecting segmentation results.",
    image1: "/projects/road-segmentation/01.webp",
    image2: "/projects/road-segmentation/02.webp",
    image3: "/projects/road-segmentation/03.webp",
    techStack: ["Python", "Deep Learning", "U-Net", "Computer Vision", "Satellite Imagery"],
    features: ["Satellite image preprocessing", "Pixel-wise road masks", "Overlay-based result inspection", "Training and evaluation views"],
    githubUrl: "https://github.com/BijoySarkar19/road-segmentation-satellite-imagery",
    liveUrl: null,
    featuredOnHome: true,
    isOngoing: false,
    published: true,
    sortOrder: 3,
  },
  {
    id: "proj-4",
    slug: "vaultora-bank",
    title: "Vaultora Bank",
    description: "A digital banking experience for account summaries, cards, payments, and financial activity.",
    longDescription: "A banking product interface concept that brings account balances, card controls, recent transactions, UPI and digital rupee payments, and security status into one responsive workspace.",
    image1: "/projects/vaultora-bank/01.webp",
    image2: "/projects/vaultora-bank/02.webp",
    image3: "/projects/vaultora-bank/03.webp",
    techStack: ["Next.js", "TypeScript", "Tailwind CSS", "Node.js", "PostgreSQL", "Razorpay"],
    features: ["Account and card overview", "Payments and transaction views", "UPI and digital rupee interface", "Security and account status panels"],
    githubUrl: "https://github.com/BijoySarkar19/Vaultora-Bank",
    liveUrl: null,
    featuredOnHome: true,
    isOngoing: false,
    published: true,
    sortOrder: 4,
  },
  {
    id: "proj-5",
    slug: "c-compiler-studio",
    title: "C Compiler Studio",
    description: "An interactive MiniC workspace for editing, compiling, and inspecting program output.",
    longDescription: "A web-based compiler learning environment that presents the MiniC workflow from source code through lexical analysis, parsing, intermediate code, and execution with GCC. The interface also surfaces diagnostics and generated artifacts.",
    image1: "/projects/c-compiler-studio/01.webp",
    image2: "/projects/c-compiler-studio/02.webp",
    image3: "/projects/c-compiler-studio/03.webp",
    techStack: ["Python", "Flask", "C", "GCC", "Docker"],
    features: ["MiniC source editor", "Lexer, parser, and AST workflow", "Intermediate code inspection", "GCC execution and diagnostics"],
    githubUrl: "https://github.com/BijoySarkar19/c-compiler-studio",
    liveUrl: null,
    featuredOnHome: true,
    isOngoing: false,
    published: true,
    sortOrder: 5,
  },
  {
    id: "proj-6",
    slug: "nexora-private-search",
    title: "Nexora",
    description: "A privacy-oriented search experience with web search, AI answers, and private sessions.",
    longDescription: "A search product concept combining web results, AI-assisted summaries, private browsing sessions, and visible privacy controls. The supplied screens show the experience across search, results, and AI-assisted research.",
    image1: "/projects/nexora-private-search/01.webp",
    image2: "/projects/nexora-private-search/02.webp",
    image3: "/projects/nexora-private-search/03.webp",
    techStack: ["Private Search", "AI Search", "Browser UX", "Privacy Controls"],
    features: ["Web and AI search views", "Private session controls", "Search result and summary layouts", "Privacy status and preferences"],
    githubUrl: "https://github.com/BijoySarkar19/nexora-private-search",
    liveUrl: null,
    featuredOnHome: false,
    isOngoing: false,
    published: true,
    sortOrder: 6,
  },
  {
    id: "proj-7",
    slug: "pixeldb-engine",
    title: "PixelDB Engine",
    description: "An educational database engine that makes query execution and storage internals visible.",
    longDescription: "A database-engine project with an educational interface for exploring SQL queries, tables, indexes, page storage, transactions, and recovery. The pixel-art presentation makes lower-level database concepts easier to inspect.",
    image1: "/projects/pixeldb-engine/01.webp",
    image2: "/projects/pixeldb-engine/02.webp",
    image3: "/projects/pixeldb-engine/03.webp",
    techStack: ["Java", "Maven", "SQL", "B+ Tree", "Storage Engine"],
    features: ["SQL execution interface", "Visual B+ tree inspector", "Page storage and buffer view", "Transaction and recovery visualizer"],
    githubUrl: "https://github.com/BijoySarkar19/pixeldb-engine",
    liveUrl: null,
    featuredOnHome: false,
    isOngoing: false,
    published: true,
    sortOrder: 7,
  },
  {
    id: "proj-8",
    slug: "javacachedb",
    title: "JavaCacheDB",
    description: "A lightweight in-memory cache system inspired by Redis with TTL and LRU eviction.",
    longDescription: "A high-performance in-memory key-value cache built in pure Java. Implements concurrent read-write locks, time-to-live expiration, LRU eviction policy, snapshot persistence, and a custom RESP-compatible protocol server.",
    image1: "/projects/javacachedb/01.webp",
    image2: "/projects/javacachedb/02.webp",
    image3: "/projects/javacachedb/03.webp",
    techStack: ["Java", "Concurrency", "Networking", "RESP Protocol", "In-Memory"],
    features: ["TTL expiration engine", "LRU memory eviction", "Snapshot persistence to disk", "Multi-client TCP server"],
    githubUrl: "https://github.com/BijoySarkar19/javacachedb",
    liveUrl: null,
    featuredOnHome: false,
    isOngoing: false,
    published: true,
    sortOrder: 8,
  },
  {
    id: "proj-9",
    slug: "rakshak-ai",
    title: "Rakshak AI",
    description: "AI-powered disaster response assistant with offline emergency routing and resource tracking.",
    longDescription: "An intelligent disaster management platform that coordinates relief efforts during severe weather and crisis events. Features offline-first routing, dynamic emergency supply tracking, SOS beacon broadcast, and bilingual voice assistant.",
    image1: "/projects/rakshak-ai/01.webp",
    image2: "/projects/rakshak-ai/02.webp",
    image3: "/projects/rakshak-ai/03.webp",
    techStack: ["Next.js", "FastAPI", "PyTorch", "OpenStreetMap", "WebRTC"],
    features: ["Offline emergency routing", "Real-time supply telemetry", "Multimodal SOS detection", "Disaster zone damage heatmaps"],
    githubUrl: "https://github.com/BijoySarkar19/rakshak-ai",
    liveUrl: null,
    featuredOnHome: false,
    isOngoing: false,
    published: true,
    sortOrder: 9,
  },
  {
    id: "proj-10",
    slug: "smart-attendance-system",
    title: "Smart Attendance System",
    description: "Automated biometric attendance tracker using real-time facial recognition and anti-spoofing.",
    longDescription: "A robust computer-vision attendance management solution featuring multi-face detection, liveness verification, automated CSV report generation, and an administrative analytics dashboard.",
    image1: "/projects/smart-attendance-system/01.webp",
    image2: "/projects/smart-attendance-system/02.webp",
    image3: "/projects/smart-attendance-system/03.webp",
    techStack: ["Python", "OpenCV", "Face Recognition", "SQLite", "Streamlit"],
    features: ["Real-time facial detection", "Anti-spoofing liveness check", "Automated attendance logging", "Admin dashboard with exports"],
    githubUrl: "https://github.com/BijoySarkar19/smart-attendance-system",
    liveUrl: null,
    featuredOnHome: false,
    isOngoing: false,
    published: true,
    sortOrder: 10,
  },
  {
    id: "proj-11",
    slug: "sentimentx",
    title: "SentimentX",
    description: "Fine-grained sentiment and emotion analysis engine for customer feedback and social text.",
    longDescription: "An NLP pipeline capable of multi-label sentiment scoring, aspect-based sentiment extraction, sarcasm detection, and sentiment trajectory mapping over time for enterprise support streams.",
    image1: "/projects/sentimentx/01.webp",
    image2: "/projects/sentimentx/02.webp",
    image3: "/projects/sentimentx/03.webp",
    techStack: ["Python", "Transformers", "BERT", "FastAPI", "React"],
    features: ["Aspect-based sentiment analysis", "Emotion classification matrix", "Interactive sentiment timeline", "RESTful batch scoring API"],
    githubUrl: "https://github.com/BijoySarkar19/sentimentx",
    liveUrl: null,
    featuredOnHome: false,
    isOngoing: false,
    published: true,
    sortOrder: 11,
  },
  {
    id: "proj-12",
    slug: "expense-tracker",
    title: "Expense Tracker",
    description: "A cross-platform financial tracking app with category analytics, budget goals, and cloud sync.",
    longDescription: "A personal finance mobile application built with Flutter and Firebase. Enables real-time expense logging, visual monthly budget trends, offline support, and multi-currency conversion.",
    image1: "/projects/expense-tracker/01.webp",
    image2: "/projects/expense-tracker/02.webp",
    image3: "/projects/expense-tracker/03.webp",
    techStack: ["Flutter", "Dart", "Firebase", "Cloud Firestore", "Provider"],
    features: ["Real-time expense logging", "Category budget analytics", "Offline local cache sync", "CSV statement export"],
    githubUrl: "https://github.com/BijoySarkar19/expense-tracker",
    liveUrl: null,
    featuredOnHome: false,
    isOngoing: false,
    published: true,
    sortOrder: 12,
  },
  {
    id: "proj-13",
    slug: "novamart-commerce",
    title: "NovaMart Commerce",
    description: "A modern headless e-commerce store with server-side rendering, cart, and payment checkout.",
    longDescription: "A full-featured commerce store built with Next.js App Router, Stripe checkout, server actions, dynamic product filtering, customer reviews, and order tracking dashboard.",
    image1: "/projects/novamart-commerce/01.webp",
    image2: "/projects/novamart-commerce/02.webp",
    image3: "/projects/novamart-commerce/03.webp",
    techStack: ["Next.js", "TypeScript", "Tailwind CSS", "Stripe", "Prisma"],
    features: ["Headless catalog & search", "Secure Stripe checkout", "Server-rendered product pages", "Customer order history portal"],
    githubUrl: "https://github.com/BijoySarkar19/novamart-commerce",
    liveUrl: null,
    featuredOnHome: false,
    isOngoing: false,
    published: true,
    sortOrder: 13,
  },
  {
    id: "proj-14",
    slug: "advanced-nlp-analytics",
    title: "Advanced NLP Analytics",
    description: "Enterprise text analytics platform for topic modeling, entity recognition, and summarization.",
    longDescription: "A comprehensive natural language processing platform providing document clustering, automated abstractive summarization, named entity recognition (NER), and semantic similarity search.",
    image1: "/projects/advanced-nlp-analytics/01.webp",
    image2: "/projects/advanced-nlp-analytics/02.webp",
    image3: "/projects/advanced-nlp-analytics/03.webp",
    techStack: ["Python", "spaCy", "Hugging Face", "FastAPI", "Elasticsearch"],
    features: ["Named entity recognition", "Topic modeling with BERTopic", "Semantic vector search", "Automated text summarization"],
    githubUrl: "https://github.com/BijoySarkar19/advanced-nlp-analytics",
    liveUrl: null,
    featuredOnHome: false,
    isOngoing: false,
    published: true,
    sortOrder: 14,
  },
  {
    id: "proj-15",
    slug: "aether-platform",
    title: "Aether AI Platform",
    description: "Full-stack developer platform integrating model chat, agent workflows, and telemetry.",
    longDescription: "An end-to-end AI platform engineered for developer teams to design, evaluate, and deploy autonomous LLM agents with real-time prompt telemetry, execution tracing, and role-based access control.",
    image1: "/projects/aether-platform/01.webp",
    image2: "/projects/aether-platform/02.webp",
    image3: "/projects/aether-platform/03.webp",
    techStack: ["Next.js", "FastAPI", "LangChain", "PostgreSQL", "Docker"],
    features: ["Agent execution playground", "LLM evaluation workbench", "Prompt versioning and diffing", "Distributed telemetry dashboard"],
    githubUrl: "https://github.com/BijoySarkar19/aether-ai-engineering-platform",
    liveUrl: null,
    featuredOnHome: false,
    isOngoing: false,
    published: true,
    sortOrder: 15,
  },
  {
    id: "proj-16",
    slug: "sentineledge",
    title: "SentinelEdge",
    description: "Privacy-First Edge-to-Cloud Video & Incident Intelligence Platform",
    longDescription: "A high-performance edge-to-cloud intelligence platform engineered for real-time video stream ingestion, on-device neural incident detection, privacy-preserving redaction at the edge, and secure telemetry synchronization to distributed cloud clusters. Built for mission-critical situational awareness with sub-second alerting and zero-trust data protection.",
    image1: "/projects/sentineledge/01.webp",
    image2: "/projects/sentineledge/02.webp",
    image3: "/projects/sentineledge/03.webp",
    techStack: ["Edge AI", "Computer Vision", "FastAPI", "PyTorch", "WebRTC", "Docker", "Zero-Trust"],
    features: [
      "Real-time edge video stream ingestion and neural inference",
      "Privacy-preserving on-device facial and license plate redaction",
      "Sub-second incident detection and automated priority alerts",
      "Resilient edge-to-cloud telemetry sync with offline-first buffering",
      "Hardware-accelerated edge pipelines with end-to-end encryption"
    ],
    githubUrl: null,
    liveUrl: null,
    published: true,
    isOngoing: true,
    featuredOnHome: true,
    sortOrder: 1,
  },
];`;

const fallbackProjectsStart = fallbackContent.indexOf("export const FALLBACK_PROJECTS: FallbackProject[] = [");
const fallbackProjectsEnd = fallbackContent.indexOf("];", fallbackProjectsStart) + 2;
fallbackContent = fallbackContent.substring(0, fallbackProjectsStart) + updatedFallbackProjects + fallbackContent.substring(fallbackProjectsEnd);
writeFileSync("lib/fallback-data.ts", fallbackContent, "utf8");
console.log("Updated lib/fallback-data.ts");

console.log("\n--- 5. Updating app/api/search-suggest/route.ts ---");
let searchSuggestContent = readFileSync("app/api/search-suggest/route.ts", "utf8");
if (!searchSuggestContent.includes("SentinelEdge")) {
  const insertTarget = '{ term: "CivicLens Core", desc: "Automated road distress analysis and civic infrastructure intelligence", path: "/projects/civiclens-core" },';
  const sentinelSuggest = `  { term: "SentinelEdge", desc: "Privacy-First edge-to-cloud video and incident intelligence platform", path: "/projects/sentineledge" },\n  ${insertTarget}`;
  searchSuggestContent = searchSuggestContent.replace(insertTarget, sentinelSuggest);
  writeFileSync("app/api/search-suggest/route.ts", searchSuggestContent, "utf8");
  console.log("Updated app/api/search-suggest/route.ts with SentinelEdge");
}

console.log("\n--- 6. Updating scripts/submit-indexnow.mjs ---");
let indexNowContent = readFileSync("scripts/submit-indexnow.mjs", "utf8");
if (!indexNowContent.includes("sentineledge")) {
  indexNowContent = indexNowContent.replace(
    '`https://${host}/projects/civiclens-core`,',
    '`https://${host}/projects/civiclens-core`,\n  `https://${host}/projects/sentineledge`,'
  );
  writeFileSync("scripts/submit-indexnow.mjs", indexNowContent, "utf8");
  console.log("Updated scripts/submit-indexnow.mjs with SentinelEdge");
}

console.log("\nAll synchronization completed successfully!");
