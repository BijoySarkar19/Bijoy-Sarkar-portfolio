import fs from "fs";
import path from "path";

const tempFile = path.join(process.cwd(), "temp_sheets.json");
const buf = fs.readFileSync(tempFile);

let text = "";
if (buf[0] === 0xff && buf[1] === 0xfe) {
  text = buf.toString("utf16le").replace(/^\uFEFF/, "");
} else if (buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
  text = buf.toString("utf8").replace(/^\uFEFF/, "");
} else {
  text = buf.toString("utf8");
}

const data = JSON.parse(text);
const rawMessages = data.messages || [];

// Filter out blank rows
const validMessages = rawMessages.filter((m) => m.name || m.email || m.message);

console.log(`Found ${validMessages.length} valid messages out of ${rawMessages.length} total rows.`);

// Generate lib/fallback-messages.ts
const tsContent = `// Auto-generated fallback contact messages from Google Sheets
// Ensures zero-loading time, instant SSR, and robust serverless reliability

export interface FallbackContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  message: string;
  submittedAtIST: string;
  ipAddress?: string | null;
  status: string;
  googleSynced: boolean;
  notes?: string | null;
  createdAt: string;
}

export const FALLBACK_CONTACT_MESSAGES: FallbackContactMessage[] = ${JSON.stringify(
  validMessages,
  null,
  2
)};
`;

fs.writeFileSync(path.join(process.cwd(), "lib", "fallback-messages.ts"), tsContent, "utf8");
console.log("Wrote lib/fallback-messages.ts successfully.");

// Generate updated public/downloads/contact-submissions.csv
const csvHeader = "Submission ID,Date & Time (IST),Full Name,Email Address,Phone Number,Message Content,IP Address\n";

function escapeCsv(field = "") {
  const str = String(field ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

const csvRows = validMessages.map((m) => {
  const phoneVal = m.phone ? (m.phone.startsWith("+") ? `'${m.phone}` : m.phone) : "Not provided";
  return [
    m.id,
    m.submittedAtIST,
    m.name,
    m.email,
    phoneVal,
    (m.message || "").replace(/\r?\n/g, " "),
    m.ipAddress || "Unknown"
  ].map(escapeCsv).join(",");
});

const csvFull = "\uFEFF" + csvHeader + csvRows.join("\n") + "\n";
fs.writeFileSync(path.join(process.cwd(), "public", "downloads", "contact-submissions.csv"), csvFull, "utf8");
console.log("Wrote public/downloads/contact-submissions.csv successfully.");
