import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const envPath = path.join(process.cwd(), ".env");
  let content = "";

  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, "utf-8");
  } else {
    // Generate clean .env with full system variables
    content = [
      'DATABASE_URL="file:./dev.db"',
      `NEXTAUTH_SECRET="${process.env.NEXTAUTH_SECRET || "mFvrXCU4Lu8G7lRe5zWYk3wOGZpeBlTu46teEN4kzXYlYt-6Q4-wMmMTP_t__s3N"}"`,
      `NEXTAUTH_URL="${process.env.NEXTAUTH_URL || "https://bijoy-sarkar-portfolio.vercel.app"}"`,
      `ADMIN_USERNAME="${process.env.ADMIN_USERNAME || "Bijoy19"}"`,
      `ADMIN_EMAIL="${process.env.ADMIN_EMAIL || "bijoysarkar7252@gmail.com"}"`,
      `ADMIN_PASSWORD="${process.env.ADMIN_PASSWORD || "Teriki77!"}"`,
      `CONTACT_EMAIL="${process.env.CONTACT_EMAIL || "bijoysarkar7252@gmail.com"}"`,
      `RATE_LIMIT_SALT="${process.env.RATE_LIMIT_SALT || "-ORT48Bq3KVWCEEJaLERniDJXHl5pxPhGBrpeK2yGP9Atr2OauKVV_sB__MGHgVK"}"`,
      `NEXT_PUBLIC_SITE_URL="${process.env.NEXT_PUBLIC_SITE_URL || "https://bijoy-sarkar-portfolio.vercel.app"}"`,
      "",
      'EMAIL_HOST="smtp.gmail.com"',
      'EMAIL_PORT="465"',
      'EMAIL_USER="bijoysarkar7252@gmail.com"',
      'EMAIL_PASS="evsqahrqxsyrwtps"',
      'EMAIL_FROM="bijoysarkar7252@gmail.com"',
      "",
      'GOOGLE_SHEETS_WEBHOOK_URL="https://script.google.com/macros/s/AKfycbxtE4fuHg9Mpp-DuLBfF2ve2cpeWiwKk8IE7Nkw_xO2gOjlYniUzAI3Vw8D4Hy0JrPzNw/exec"',
      "",
    ].join("\n");
  }

  return new NextResponse(content, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": 'attachment; filename=".env"',
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
