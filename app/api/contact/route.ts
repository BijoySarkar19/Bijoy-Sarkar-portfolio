import { NextResponse } from "next/server";
import { allowContactAttempt } from "@/lib/contact-rate-limit";
import { sendContactEmail } from "@/lib/mail";
import { verifyRecaptcha } from "@/lib/recaptcha";
import { cleanText, contactSchema } from "@/lib/validation";
import { prisma } from "@/lib/prisma";
import { formatMessageCardIST } from "@/lib/audit";
import { appendToGoogleSheetCsv, syncWithGoogleSheetWebhook } from "@/lib/google-sheets";

export const runtime = "nodejs";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
    },
  });
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  const forwardedHost = request.headers.get("x-forwarded-host");

  if (origin && host) {
    try {
      const originHost = new URL(origin).host.toLowerCase();
      const hostLower = host.toLowerCase();
      const fwdHostLower = forwardedHost?.toLowerCase();

      const isLocal =
        (originHost.includes("localhost") || originHost.includes("127.0.0.1") || originHost.startsWith("192.168.") || originHost.startsWith("10.") || originHost.startsWith("172.")) &&
        (hostLower.includes("localhost") || hostLower.includes("127.0.0.1") || hostLower.startsWith("192.168.") || hostLower.startsWith("10.") || hostLower.startsWith("172.") || hostLower.includes("portfolio"));

      const isExactMatch = originHost === hostLower || (Boolean(fwdHostLower) && originHost === fwdHostLower);
      const isAllowedDomain = originHost.includes("bijoy-sarkar-portfolio") || originHost.includes("vercel.app");

      if (!isExactMatch && !isLocal && !isAllowedDomain) {
        return NextResponse.json({ error: "Request could not be accepted." }, { status: 403 });
      }
    } catch {
      // Proceed safely if URL parsing fails
    }
  }
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return NextResponse.json({ error: "Request could not be accepted." }, { status: 415 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Please check the form and try again." }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check your name, email, and message." }, { status: 422 });
  }

  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const remoteIp = forwarded || request.headers.get("x-real-ip") || "unknown";

  try {
    const allowed = await allowContactAttempt(remoteIp);
    if (!allowed) return NextResponse.json({ error: "Please wait before sending another message." }, { status: 429 });
  } catch (error) {
    console.error("Contact rate limit check failed:", error);
  }

  const captchaPassed = await verifyRecaptcha(parsed.data.captchaToken, remoteIp === "unknown" ? undefined : remoteIp);
  if (!captchaPassed) {
    return NextResponse.json({ error: "Security check failed. Please reload and try again." }, { status: 400 });
  }

  const now = new Date();
  const submittedAtIST = formatMessageCardIST(now);

  const data = {
    name: cleanText(parsed.data.name),
    email: cleanText(parsed.data.email),
    phone: cleanText(parsed.data.phone ?? ""),
    message: cleanText(parsed.data.message),
    captchaToken: parsed.data.captchaToken ?? "",
  };

  const userAgent = request.headers.get("user-agent")?.slice(0, 180) ?? "Unknown browser";
  const riskInfo = `${process.env.RECAPTCHA_SECRET_KEY ? "reCAPTCHA verified" : "Local development: CAPTCHA not configured"}; user agent: ${userAgent}`;

  try {
    // 1. Always store persistently in the database
    const saved = await prisma.contactMessage.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        message: data.message,
        submittedAtIST,
        ipAddress: remoteIp,
        status: "UNREAD",
        googleSynced: false,
      },
    });

    // 2. Save into Google Sheets CSV dataset
    await appendToGoogleSheetCsv({
      id: saved.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      message: data.message,
      submittedAtIST,
      ipAddress: remoteIp,
    });

    // 3. Determine contact inbox recipient email from site settings
    let recipientEmail = "bijoysarkar7252@gmail.com";
    try {
      const recipientSetting = await prisma.siteSetting.findUnique({
        where: { key: "contactRecipientEmail" },
      });
      if (recipientSetting?.value?.trim()) {
        recipientEmail = recipientSetting.value.trim();
      } else {
        const fallbackEmailSetting = await prisma.siteSetting.findUnique({
          where: { key: "contactEmail" },
        });
        if (fallbackEmailSetting?.value?.trim()) {
          recipientEmail = fallbackEmailSetting.value.trim();
        }
      }
    } catch {
      // Use fallback
    }

    // 4. Attempt Google Sheets Webhook Sync if configured
    const syncRes = await syncWithGoogleSheetWebhook({
      id: saved.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      message: data.message,
      submittedAtIST,
      ipAddress: remoteIp,
      recipientEmail,
    });

    if (syncRes.synced) {
      await prisma.contactMessage.update({
        where: { id: saved.id },
        data: { googleSynced: true },
      });
    }

    // 5. Send email delivery if SMTP is configured (non-blocking fallback)
    try {
      await sendContactEmail(data, now, riskInfo, recipientEmail);
    } catch (emailError) {
      console.warn("Email transport skipped/unconfigured:", emailError);
    }

    return NextResponse.json({
      message: "Message sent successfully! Thank you for reaching out.",
      submissionId: saved.id,
      submittedAtIST,
    }, { status: 200 });
  } catch (error) {
    console.error("Failed to store contact submission:", error);
    return NextResponse.json({ error: "Failed to record message. Please try again." }, { status: 500 });
  }
}
