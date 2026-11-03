import fs from "fs";

let content = fs.readFileSync("app/layout.tsx", "utf8");

// 1. Update icons in metadata
const oldIcons = `  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },`;

const newIcons = `  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32", type: "image/x-icon" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/tab-icon.svg", type: "image/svg+xml" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "search",
        url: "/opensearch.xml",
      },
    ],
  },`;

if (!content.includes(oldIcons)) {
  console.error("oldIcons not found in layout.tsx");
  process.exit(1);
}
content = content.replace(oldIcons, newIcons);

// 2. Update head links
const oldHead = `      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/favicon-192x192.png" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />`;

const newHead = `      <head>
        {/* Browser Tab & Omnibox Favicon — Light blue kurta circular portrait */}
        <link rel="icon" type="image/x-icon" href="/favicon.ico" sizes="16x16 32x32" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" type="image/svg+xml" href="/tab-icon.svg" />

        {/* Google Search Result Standard 48x48 Raster Favicon — Dark blue shirt portrait */}
        <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/favicon-192x192.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />

        {/* OpenSearch Auto-Discovery for Chrome, Firefox, Opera, Edge search suggestions */}
        <link rel="search" type="application/opensearchdescription+xml" href="/opensearch.xml" title="Bijoy Sarkar Portfolio" />

        {/* Microsoft Edge & Windows Tile Metadata */}
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#ff5e2c" />`;

if (!content.includes(oldHead)) {
  console.error("oldHead not found in layout.tsx");
  process.exit(1);
}
content = content.replace(oldHead, newHead);

// 3. Update sameAs and disambiguatingDescription
const oldDisambig = `                  disambiguatingDescription:
                    "Bijoy Sarkar is an Indian Software Engineer and AI Developer based in Agartala, Tripura, India, studying Computer Science & Engineering at ICFAI University Tripura (GitHub: BijoySarkar19). This is the official portfolio of Bijoy Sarkar, distinct from any individual named Bijoy Kumar Sarkar.",`;

const newDisambig = `                  disambiguatingDescription:
                    "Bijoy Sarkar is an Indian Software Engineer, AI Developer, and Full-Stack Developer based in Agartala, Tripura, India, pursuing a B.Tech in Computer Science and Engineering at ICFAI University Tripura (GitHub: BijoySarkar19). This is the official portfolio of Bijoy Sarkar (https://bijoy-sarkar-portfolio.vercel.app), distinct from Bengali folk saint/singer Bijoy Sarkar (1903–1985) and distinct from Quality Analyst Bijoy Kumar Sarkar.",`;

if (content.includes(oldDisambig)) {
  content = content.replace(oldDisambig, newDisambig);
}

const oldSameAs = `                  sameAs: [
                    "https://github.com/BijoySarkar19",
                    "https://www.linkedin.com/in/bijoysarkar19",
                    "https://x.com/bijoyy_19",
                    "https://www.instagram.com/bijoyysarkarr",
                    "https://facebook.com/share/1Cs44JBwnk/",
                  ],`;

const newSameAs = `                  sameAs: [
                    "https://github.com/BijoySarkar19",
                    "https://www.linkedin.com/in/bijoysarkar19",
                    "https://x.com/bijoyy_19",
                    "https://www.instagram.com/bijoyysarkarr",
                    "https://facebook.com/share/1Cs44JBwnk/",
                    "https://sites.google.com/view/bijoysarkar/home",
                  ],`;

if (content.includes(oldSameAs)) {
  content = content.replace(oldSameAs, newSameAs);
}

fs.writeFileSync("app/layout.tsx", content, "utf8");
console.log("Updated app/layout.tsx successfully!");
