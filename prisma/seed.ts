import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client";
import { FALLBACK_CONTACT_MESSAGES } from "../lib/fallback-messages";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

const projects = [
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
    image1: "/images/ongoing-project-cover-orange.webp",
    image2: "",
    image3: "",
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
];

async function main() {
  const username = process.env.ADMIN_USERNAME?.trim();
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (username && email && password) {
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.admin.upsert({
      where: { email },
      update: { username, passwordHash },
      create: { username, email, passwordHash },
    });
    console.info("Admin account seeded from environment configuration.");
  } else {
    console.info("Admin seed skipped. Set ADMIN_USERNAME, ADMIN_EMAIL, and ADMIN_PASSWORD to create it.");
  }

  for (const project of projects) {
    const { techStack, features, ...fields } = project;
    await prisma.project.upsert({
      where: { slug: project.slug },
      update: { ...fields, techStack: JSON.stringify(techStack), features: JSON.stringify(features) },
      create: { ...fields, techStack: JSON.stringify(techStack), features: JSON.stringify(features) },
    });
  }
  console.info(`Seeded ${projects.length} portfolio projects.`);

  // Seed Work Experience
  const defaultExperiences = [
    {
      period: "Jun — Jul 2026",
      role: "Cybersecurity Intern",
      organization: "ETDC · STQC Directorate, MeitY",
      summary: "Reviewed cybersecurity frameworks and Generative AI security, using OWASP guidance to assess risks in LLM applications.",
      tags: ["AI Security", "OWASP", "Risk Assessment"],
      sortOrder: 1,
    },
    {
      period: "Jan — Mar 2026",
      role: "AI/ML Intern",
      organization: "National Institute of Technology Silchar",
      summary: "Worked on road segmentation from satellite imagery, covering preprocessing, dataset preparation, feature extraction, and model evaluation.",
      tags: ["Python", "Computer Vision", "Segmentation"],
      sortOrder: 2,
    },
    {
      period: "Jun — Jul 2025",
      role: "App Developer Intern",
      organization: "TalkEng · Agartala",
      summary: "Built an expense-tracking mobile app in Flutter and Dart, integrating Firebase Authentication and real-time Firestore data.",
      tags: ["Flutter", "Dart", "Firebase"],
      sortOrder: 3,
    },
    {
      period: "Jun — Aug 2024",
      role: "Full-Stack Development Intern",
      organization: "Apni Vidya · Agartala",
      summary: "Contributed to frontend and backend features across web application design, implementation, debugging, and delivery.",
      tags: ["Web Development", "Frontend", "Backend"],
      sortOrder: 4,
    },
    {
      period: "Mar — Aug 2022",
      role: "Computer Tutor",
      organization: "Novel Computer · Agartala",
      summary: "Taught computer fundamentals, programming basics, MS Office, and practical IT skills through hands-on learning.",
      tags: ["Teaching", "Computer Fundamentals", "MS Office"],
      sortOrder: 5,
    },
  ];

  for (const exp of defaultExperiences) {
    const existing = await prisma.workExperience.findFirst({
      where: { role: exp.role, organization: exp.organization },
    });
    if (!existing) {
      await prisma.workExperience.create({
        data: {
          period: exp.period,
          role: exp.role,
          organization: exp.organization,
          summary: exp.summary,
          tags: JSON.stringify(exp.tags),
          sortOrder: exp.sortOrder,
        },
      });
    }
  }
  console.info("Seeded default work experiences.");

  // Seed Skill Groups & Languages
  const defaultSkillGroups = [
    { title: "Programming", note: "Languages & fundamentals", icon: "Code2", skills: ["Python", "C++", "C", "Java", "JavaScript", "Dart", "SQL"], sortOrder: 1 },
    { title: "AI / Machine Learning", note: "Models, vision & language", icon: "BrainCircuit", skills: ["Machine Learning", "Deep Learning", "Computer Vision", "NLP", "OpenCV", "NLTK"], sortOrder: 2 },
    { title: "Web Engineering", note: "Interfaces & application logic", icon: "Terminal", skills: ["Next.js", "React", "Flask", "Streamlit", "HTML", "CSS"], sortOrder: 3 },
    { title: "Mobile Development", note: "Cross-platform applications", icon: "Smartphone", skills: ["Flutter", "Firebase", "Firestore", "Android Studio"], sortOrder: 4 },
    { title: "Data & Storage", note: "Relational and document stores", icon: "Database", skills: ["SQLite", "MySQL", "PostgreSQL", "PostGIS", "Redis"], sortOrder: 5 },
    { title: "Security & Delivery", note: "Secure, reproducible software", icon: "Fingerprint", skills: ["OWASP", "LLM Security", "Docker", "Git", "GitHub"], sortOrder: 6 },
    { title: "Languages", note: "Spoken languages", icon: "Languages", skills: ["English", "Hindi", "Bengali"], sortOrder: 7 },
  ];

  for (const sg of defaultSkillGroups) {
    await prisma.skillGroup.upsert({
      where: { title: sg.title },
      update: { note: sg.note, icon: sg.icon, skills: JSON.stringify(sg.skills), sortOrder: sg.sortOrder },
      create: { title: sg.title, note: sg.note, icon: sg.icon, skills: JSON.stringify(sg.skills), sortOrder: sg.sortOrder },
    });
  }
  console.info("Seeded default skill and language groups.");

  // Seed Resume File
  const existingResume = await prisma.resumeFile.findFirst({ where: { active: true } });
  if (!existingResume) {
    await prisma.resumeFile.create({
      data: {
        filename: "Bijoy_Sarkar_CV.pdf",
        path: "/Bijoy_Sarkar_CV.pdf",
        active: true,
      },
    });
    console.info("Seeded active resume entry.");
  }

  // Seed Default Site Settings
  const defaultSettings = [
    { key: "heroTitle", value: "Software Engineer & AI Developer" },
    { key: "heroSubhead", value: "Building intelligent systems and full-stack solutions." },
    { key: "heroBio", value: "Computer Science undergraduate focused on AI/ML, secure software, and useful digital products." },
    { key: "contactEmail", value: "bijoysarkar7252@gmail.com" },
    { key: "contactRecipientEmail", value: "bijoysarkar7252@gmail.com" },
    { key: "location", value: "Agartala, Tripura, India" },
    { key: "locationMapUrl", value: "https://maps.google.com/?q=Agartala,+Tripura,+India" },
    { key: "status", value: "Open to opportunities" },
    { key: "githubUrl", value: "https://github.com/BijoySarkar19" },
    { key: "themeAccent", value: "#ff5e2c" },
    { key: "ongoingDefaultImage", value: "/images/ongoing-project-cover-orange.webp" },
    { key: "defaultProjectImageCount", value: "3" },
    { key: "themeMode", value: "dark" },
    { key: "soundEnabled", value: "false" },
    { key: "gamesEnabled", value: "true" },
    { key: "googleSheetsWebhookUrl", value: "https://script.google.com/macros/s/AKfycbxtE4fuHg9Mpp-DuLBfF2ve2cpeWiwKk8IE7Nkw_xO2gOjlYniUzAI3Vw8D4Hy0JrPzNw/exec" },
    {
      key: "degreesList",
      value: JSON.stringify([
        {
          id: "btech-degree",
          degree: "B.Tech · Computer Science & Engineering",
          institution: "ICFAI University Tripura",
          link: "https://www.iutripura.edu.in/",
          period: "2023 - 2027",
          showOnHome: true,
        },
      ]),
    },
  ];

  for (const s of defaultSettings) {
    await prisma.siteSetting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }
  console.info("Seeded default site settings.");

  // Seed Contact Messages from Fallback Google Sheets Dataset
  for (const m of FALLBACK_CONTACT_MESSAGES) {
    const parsedDate = new Date(m.createdAt || Date.now());
    await prisma.contactMessage.upsert({
      where: { id: m.id },
      update: {},
      create: {
        id: m.id,
        name: m.name,
        email: m.email,
        phone: m.phone || null,
        message: m.message,
        submittedAtIST: m.submittedAtIST,
        ipAddress: m.ipAddress || null,
        status: m.status || "READ",
        googleSynced: true,
        notes: m.notes || null,
        createdAt: isNaN(parsedDate.getTime()) ? new Date() : parsedDate,
      },
    });
  }
  console.info(`Seeded ${FALLBACK_CONTACT_MESSAGES.length} contact messages.`);

  // Seed Initial Audit Log
  const auditCount = await prisma.auditLog.count();
  if (auditCount === 0) {
    await prisma.auditLog.create({
      data: {
        entity: "SYSTEM",
        entityId: "system-seed",
        action: "INITIAL_SEED",
        changes: JSON.stringify({ summary: "System initialized with base dataset for projects, experience, skills, and CV." }),
        adminId: "system",
        adminName: "System Administrator",
      },
    });
    console.info("Seeded initial audit log entry.");
  }
}

main()
  .catch((error: unknown) => {
    console.error("Database seed failed.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
