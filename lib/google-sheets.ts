import { writeFile, readFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { prisma } from "@/lib/prisma";

export interface ContactRecord {
  id?: string;
  name: string;
  email: string;
  phone?: string | null;
  message: string;
  submittedAtIST: string;
  ipAddress?: string | null;
  recipientEmail?: string | null;
}

const CSV_DIR = join(process.cwd(), "public", "downloads");
const CSV_FILE = join(CSV_DIR, "contact-submissions.csv");

function escapeCsv(field: string = ""): string {
  if (field.includes(",") || field.includes('"') || field.includes("\n") || field.includes("\r")) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

export async function appendToGoogleSheetCsv(record: ContactRecord) {
  try {
    await mkdir(CSV_DIR, { recursive: true });
    const header = "Submission ID,Date & Time (IST),Full Name,Email Address,Phone Number,Message Content,IP Address\n";
    
    const row = [
      record.id || "N/A",
      record.submittedAtIST,
      record.name,
      record.email,
      record.phone ? (record.phone.startsWith("+") ? `'${record.phone}` : record.phone) : "Not provided",
      record.message.replace(/\r?\n/g, " "),
      record.ipAddress || "Unknown",
    ].map(escapeCsv).join(",") + "\n";

    if (!existsSync(CSV_FILE)) {
      await writeFile(CSV_FILE, "\uFEFF" + header + row, "utf8"); // Add UTF-8 BOM for Excel/Google Sheets
    } else {
      const existing = await readFile(CSV_FILE, "utf8");
      await writeFile(CSV_FILE, existing + row, "utf8");
    }
  } catch (err) {
    console.error("Failed to append to contact-submissions.csv:", err);
  }
}

export async function syncWithGoogleSheetWebhook(record: ContactRecord) {
  try {
    // Check if webhook URL is configured in site settings or env
    const setting = await prisma.siteSetting.findUnique({
      where: { key: "googleSheetsWebhookUrl" },
    });
    const webhookUrl = setting?.value || process.env.GOOGLE_SHEETS_WEBHOOK_URL;

    if (!webhookUrl || !webhookUrl.startsWith("http")) {
      return {
        synced: false,
        reason: "Webhook URL is not configured. Go to Admin > Settings and enter your Google Apps Script Web App URL.",
      };
    }

    const rawPhone = (record.phone || "").trim();
    // Google Sheets parses strings starting with '+' as mathematical formulas resulting in #ERROR!.
    // Prepending a single quote tells Google Sheets to treat it as plain text without showing the quote.
    const sheetPhone = rawPhone
      ? (rawPhone.startsWith("+") ? `'${rawPhone}` : rawPhone)
      : "Not provided";

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      redirect: "follow",
      body: JSON.stringify({
        account: record.recipientEmail || "bijoysarkar7252@gmail.com",
        recipientEmail: record.recipientEmail || "bijoysarkar7252@gmail.com",
        timestampIST: record.submittedAtIST,
        name: record.name,
        email: record.email,
        phone: sheetPhone,
        rawPhone: rawPhone || "Not provided",
        message: record.message,
        ipAddress: record.ipAddress || "Unknown",
      }),
    });

    if (res.ok || res.status === 200 || res.status === 302) {
      return { synced: true };
    }

    if (res.status === 404) {
      return {
        synced: false,
        reason: "HTTP 404 (Script not found). In Google Sheets: Extensions > Apps Script > click Save (💾), then Deploy > New deployment > Web app > set 'Who has access' to 'Anyone' > Deploy, and paste the fresh /exec URL in Settings.",
      };
    }

    if (res.status === 401 || res.status === 403) {
      return {
        synced: false,
        reason: `HTTP ${res.status} (Access Denied). Make sure 'Who has access' is set to 'Anyone' in your Apps Script deployment.`,
      };
    }

    return { synced: false, reason: `HTTP ${res.status}` };
  } catch (err) {
    console.error("Google Sheets Webhook Sync failed:", err);
    return { synced: false, reason: String(err) };
  }
}
