import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client";

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
    sortOrder: 2,
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
    sortOrder: 3,
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
    sortOrder: 4,
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
    featuredOnHome: true,
    isOngoing: false,
    sortOrder: 5,
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
    features: ["Query lab and database explorer", "Page and index visualization", "Transaction and log views", "Recovery workflow"],
    githubUrl: "https://github.com/BijoySarkar19/PixelDB",
    liveUrl: null,
    sortOrder: 6,
  },
  {
    slug: "javacachedb",
    title: "JavaCacheDB",
    description: "A Redis-inspired in-memory key-value database written in Java.",
    longDescription: "A Java key-value database project with a TCP command interface, expiring keys, concurrent clients, and snapshot persistence. The interface visualizes command activity, memory use, connection state, and stored keys.",
    image1: "/projects/javacachedb/01.webp",
    image2: "/projects/javacachedb/02.webp",
    image3: "/projects/javacachedb/03.webp",
    techStack: ["Java 21", "Maven", "TCP", "Concurrency", "Persistence"],
    features: ["Key-value command interface", "TTL and expiration", "Concurrent client connections", "Snapshot persistence and monitoring"],
    githubUrl: "https://github.com/BijoySarkar19/JavaCacheDB",
    liveUrl: null,
    sortOrder: 7,
  },
  {
    slug: "novamart-commerce",
    title: "NovaMart",
    description: "A multi-vendor commerce experience spanning storefronts, products, checkout, and seller operations.",
    longDescription: "A multi-vendor e-commerce project connecting product discovery, customer checkout, order tracking, and seller inventory workflows. The supplied screens show both the customer storefront and seller operations interface.",
    image1: "/projects/novamart-commerce/01.webp",
    image2: "/projects/novamart-commerce/02.webp",
    image3: "/projects/novamart-commerce/03.webp",
    techStack: ["Next.js", "TypeScript", "Prisma", "SQLite", "Razorpay"],
    features: ["Multi-vendor product browsing", "Cart and order tracking", "Seller inventory dashboard", "Payment-oriented checkout"],
    githubUrl: "https://github.com/BijoySarkar19/NovaMart-Multi-Vendor-Ecommerce",
    liveUrl: null,
    sortOrder: 8,
  },
  {
    slug: "advanced-nlp-analytics",
    title: "Advanced NLP Analytics",
    description: "Analyze text and datasets with preprocessing, sentiment views, and model evaluation.",
    longDescription: "An NLP analytics application for entering text or exploring datasets, then inspecting preprocessing, sentiment distributions, keywords, training, and evaluation results in one workspace.",
    image1: "/projects/advanced-nlp-analytics/01.webp",
    image2: "/projects/advanced-nlp-analytics/02.webp",
    image3: "/projects/advanced-nlp-analytics/03.webp",
    techStack: ["Python", "Flask", "NLTK", "TF-IDF", "scikit-learn"],
    features: ["Text preprocessing pipeline", "Dataset profiling and sentiment views", "TF-IDF keyword analysis", "Model training and evaluation"],
    githubUrl: "https://github.com/BijoySarkar19/advanced-nlp-analytics",
    liveUrl: null,
    sortOrder: 9,
  },
  {
    slug: "sentimentx",
    title: "SentimentX",
    description: "Turn YouTube comments into sentiment breakdowns, trends, and keyword insights.",
    longDescription: "A sentiment-analysis project focused on public video comments. The dashboard presents comment classifications, sentiment distributions, trends, representative comments, and report exports.",
    image1: "/projects/sentimentx/01.webp",
    image2: "/projects/sentimentx/02.webp",
    image3: "/projects/sentimentx/03.webp",
    techStack: ["Python", "Flask", "NLTK", "VADER", "YouTube Data API"],
    features: ["Comment sentiment analysis", "Trend and keyword views", "Saved reports and history", "CSV export"],
    githubUrl: "https://github.com/BijoySarkar19/SentimentX-AI-Sentiment-Analysis",
    liveUrl: null,
    sortOrder: 10,
  },
  {
    slug: "smart-attendance-system",
    title: "Smart Attendance System",
    description: "A student attendance dashboard centered on face recognition and attendance records.",
    longDescription: "An attendance-management interface concept with student records, live recognition status, attendance history, department summaries, and verification methods.",
    image1: "/projects/smart-attendance-system/01.webp",
    image2: "/projects/smart-attendance-system/02.webp",
    image3: "/projects/smart-attendance-system/03.webp",
    techStack: ["Python", "OpenCV", "Face Recognition", "SQLite"],
    features: ["Student and enrollment records", "Face-recognition attendance flow", "Attendance history and summaries", "Device and verification status"],
    githubUrl: "https://github.com/BijoySarkar19/smart-attendance-system",
    liveUrl: null,
    sortOrder: 11,
  },
  {
    slug: "rakshak-ai",
    title: "Rakshak-AI",
    description: "A local AI health-information assistant with wellness tools and speech support.",
    longDescription: "A locally hosted assistant built with Python and LM Studio. The desktop workflow combines general health information, BMI tools, speech recognition, and text-to-speech, with SQLite keeping application data on the user's device.",
    image1: "/projects/rakshak-ai/01.webp",
    image2: "/projects/rakshak-ai/02.webp",
    image3: "/projects/rakshak-ai/03.webp",
    techStack: ["Python", "LM Studio", "Llama 3.2", "Tkinter", "SQLite", "Speech Recognition"],
    features: ["Locally hosted assistant", "General wellness information", "BMI calculator and speech tools", "SQLite conversation history"],
    githubUrl: "https://github.com/BijoySarkar19/Rakshak-AI",
    liveUrl: null,
    sortOrder: 12,
  },
  {
    slug: "expense-tracker",
    title: "Expense Tracker",
    description: "A Flutter app for recording spending, organizing categories, and reviewing financial activity.",
    longDescription: "A Flutter and Dart mobile application for managing everyday spending. Firebase Authentication and Firestore support sign-in and data storage, while transaction, category, and analytics views help users review activity.",
    image1: "/projects/expense-tracker/01.webp",
    image2: "/projects/expense-tracker/02.webp",
    image3: "/projects/expense-tracker/03.webp",
    techStack: ["Flutter", "Dart", "Firebase", "Firestore"],
    features: ["Income and expense records", "Category management", "Spending analytics", "Firebase-backed sync"],
    githubUrl: "https://github.com/BijoySarkar19/ExpenseTracker1",
    liveUrl: null,
    sortOrder: 13,
  },
  {
    slug: "aether-platform",
    title: "Aether",
    description: "An AI engineering workspace for chat, code assistance, models, agents, and project tools.",
    longDescription: "An AI engineering platform concept that brings model chat, code work, agents, knowledge tools, and project activity into a single workspace. The supplied screens explore the home dashboard, assistant workflow, and model/tool catalog.",
    image1: "/projects/aether-platform/01.webp",
    image2: "/projects/aether-platform/02.webp",
    image3: "/projects/aether-platform/03.webp",
    techStack: ["AI Engineering", "LLM Tools", "Agent Workflows", "Developer Experience"],
    features: ["Model chat and code assistance", "Agent and knowledge tools", "Project and tool workspace", "System activity dashboard"],
    githubUrl: "https://github.com/BijoySarkar19/aether-ai-engineering-platform",
    liveUrl: null,
    sortOrder: 14,
  },
  {
    slug: "civiclens-core",
    title: "CivicLens Core",
    description: "A geospatial platform for mapping public infrastructure and reported civic issues.",
    longDescription: "A full-stack public-infrastructure intelligence platform designed around geospatial data. The core architecture brings together APIs, spatial storage, caching, background workers, and object storage, with a path toward AI-assisted risk prediction and maintenance planning.",
    image1: "/projects/civiclens-core/hero.svg",
    image2: "/projects/civiclens-core/01.svg",
    image3: "/projects/civiclens-core/02.svg",
    techStack: ["FastAPI", "PostgreSQL", "PostGIS", "Redis", "Docker", "Next.js"],
    features: ["Geospatial infrastructure records", "Civic issue mapping and analysis", "API, database, and background-worker services", "Architecture prepared for risk prediction"],
    githubUrl: "https://github.com/BijoySarkar19/CivicLens-Core",
    liveUrl: null,
    published: true,
    isOngoing: true,
    featuredOnHome: false,
    sortOrder: 15,
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
    { key: "contactEmail", value: "bijoysarkar190@gmail.com" },
    { key: "location", value: "Agartala, India" },
    { key: "status", value: "Open to opportunities" },
    { key: "githubUrl", value: "https://github.com/BijoySarkar19" },
    { key: "themeAccent", value: "#ff5e2c" },
    { key: "soundEnabled", value: "true" },
    { key: "gamesEnabled", value: "true" },
  ];

  for (const s of defaultSettings) {
    await prisma.siteSetting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }
  console.info("Seeded default site settings.");

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
