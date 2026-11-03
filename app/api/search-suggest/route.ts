import { NextRequest, NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

interface SuggestionItem {
  term: string;
  desc: string;
  path: string;
}

const STATIC_SUGGESTIONS: SuggestionItem[] = [
  { term: "Bijoy Sarkar Portfolio", desc: "Official software engineering and AI systems portfolio", path: "/" },
  { term: "Bijoy Sarkar Projects", desc: "Intelligent systems, CivicLens Core, ML engineering", path: "/projects" },
  { term: "Bijoy Sarkar CV & Resume", desc: "Verified curriculum vitae, education, and technical experience", path: "/#resume" },
  { term: "Bijoy Sarkar About", desc: "Background at ICFAI University Tripura, core skills & stack", path: "/#about" },
  { term: "Bijoy Sarkar Contact", desc: "Direct inquiry, email, and social profiles", path: "/#contact" },
  { term: "CivicLens Core", desc: "Automated road distress analysis and civic infrastructure intelligence", path: "/projects/civiclens-core" },
  { term: "Rakshak-AI", desc: "Defense-grade perimeter intelligence and multimodal threat detection", path: "/projects/rakshak-ai" },
  { term: "Aether Intelligent Workspace", desc: "Modern developer environment with contextual intelligence", path: "/projects/aether" },
  { term: "Expense Tracker Pro", desc: "Flutter and Firebase cross-platform financial telemetry application", path: "/projects/expense-tracker" },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim().toLowerCase();
  const siteUrl = getSiteUrl();

  let matches = STATIC_SUGGESTIONS;
  if (q.length > 0) {
    matches = STATIC_SUGGESTIONS.filter(
      (item) =>
        item.term.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q) ||
        item.path.toLowerCase().includes(q)
    );
    if (matches.length === 0) {
      matches = [
        {
          term: `Bijoy Sarkar — Search "${q}"`,
          desc: "Search portfolio projects and systems",
          path: `/projects?q=${encodeURIComponent(q)}`,
        },
      ];
    }
  }

  const terms = matches.map((m) => m.term);
  const descriptions = matches.map((m) => m.desc);
  const urls = matches.map((m) => `${siteUrl}${m.path}`);

  // OpenSearch JSON suggestions format: [ query, [terms], [descriptions], [urls] ]
  const responseData = [q, terms, descriptions, urls];

  return NextResponse.json(responseData, {
    headers: {
      "Content-Type": "application/x-suggestions+json; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
