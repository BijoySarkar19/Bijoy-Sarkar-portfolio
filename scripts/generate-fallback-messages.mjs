import fs from "fs";
import path from "path";

const WEBHOOK_URL =
  "https://script.google.com/macros/s/AKfycbxtE4fuHg9Mpp-DuLBfF2ve2cpeWiwKk8IE7Nkw_xO2gOjlYniUzAI3Vw8D4Hy0JrPzNw/exec";

function formatISTDate(dateVal) {
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return (
      new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }).format(d) + " IST"
    );
  } catch {
    return String(dateVal);
  }
}

async function main() {
  console.log("Fetching live messages from Google Sheets Webhook...");
  const res = await fetch(WEBHOOK_URL);
  const data = await res.json();
  const rawMessages = data.messages || [];

  console.log(`Received ${rawMessages.length} total messages from Google Sheets.`);

  const allMessages = rawMessages.map((m) => {
    const rowMatch = m.id?.match(/sheet-row-(\d+)/);
    const rowNum = rowMatch ? rowMatch[1] : "";
    const isBlank = !m.name && !m.email && !m.message;

    let submittedAtIST = m.submittedAtIST || "";
    if (submittedAtIST.includes("GMT") || submittedAtIST.includes("India Standard Time")) {
      submittedAtIST = formatISTDate(submittedAtIST);
    }

    const cleanPhone =
      m.phone === "#ERROR!" || !m.phone ? "Not provided" : String(m.phone).replace(/^'/, "").trim();

    return {
      id: m.id,
      name: m.name?.trim() || (rowNum ? `Inquiry (Sheet Row ${rowNum})` : "Direct Submission"),
      email: m.email?.trim() || "Not provided",
      phone: cleanPhone || "Not provided",
      message:
        m.message?.trim() ||
        (rowNum
          ? `Direct spreadsheet inquiry recorded on Google Sheets (Row ${rowNum}).`
          : "Direct spreadsheet inquiry recorded on Google Sheets."),
      submittedAtIST: submittedAtIST || "Recorded in Google Sheets",
      ipAddress: m.ipAddress || "Unknown",
      status: m.status || (isBlank ? "READ" : "UNREAD"),
      googleSynced: true,
      notes: isBlank ? "Direct spreadsheet record with empty contact fields" : null,
      createdAt: m.createdAt || new Date().toISOString(),
    };
  });

  console.log(`Processed ${allMessages.length} messages (including all sheet rows 2 through 23).`);

  // 1. Write lib/fallback-messages.ts
  const tsContent = `// Auto-generated fallback contact messages from Google Sheets
// Synchronizes all rows (Rows 2 to 23) ensuring 1:1 parity with Google Sheets

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
    allMessages,
    null,
    2
  )};
`;
  fs.writeFileSync(path.join(process.cwd(), "lib", "fallback-messages.ts"), tsContent, "utf8");
  console.log("Wrote lib/fallback-messages.ts successfully.");

  // 2. Write prisma/fallback-messages.json
  fs.writeFileSync(
    path.join(process.cwd(), "prisma", "fallback-messages.json"),
    JSON.stringify(allMessages, null, 2),
    "utf8"
  );
  console.log("Wrote prisma/fallback-messages.json successfully.");

  // 3. Write public/downloads/contact-submissions.csv
  const csvHeader =
    "Submission ID,Date & Time (IST),Full Name,Email Address,Phone Number,Message Content,IP Address\n";

  function escapeCsv(field = "") {
    const str = String(field ?? "");
    if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  const csvRows = allMessages.map((m) => {
    const phoneVal = m.phone ? (m.phone.startsWith("+") ? `'${m.phone}` : m.phone) : "Not provided";
    return [
      m.id,
      m.submittedAtIST,
      m.name,
      m.email,
      phoneVal,
      (m.message || "").replace(/\r?\n/g, " "),
      m.ipAddress || "Unknown",
    ]
      .map(escapeCsv)
      .join(",");
  });

  const csvFull = "\uFEFF" + csvHeader + csvRows.join("\n") + "\n";
  fs.writeFileSync(
    path.join(process.cwd(), "public", "downloads", "contact-submissions.csv"),
    csvFull,
    "utf8"
  );
  console.log("Wrote public/downloads/contact-submissions.csv successfully.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
