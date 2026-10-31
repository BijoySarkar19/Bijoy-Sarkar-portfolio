import nodemailer from "nodemailer";
import type { ContactInput } from "@/lib/validation";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] ?? character);
}

export async function sendContactEmail(
  data: ContactInput,
  submittedAt: Date,
  riskInfo: string,
  recipientEmail?: string
) {
  const host = process.env.EMAIL_HOST;
  const port = Number(process.env.EMAIL_PORT ?? 587);
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const from = process.env.EMAIL_FROM;
  const recipient = recipientEmail || process.env.CONTACT_EMAIL || "bijoysarkar7252@gmail.com";
  if (!host || !user || !pass || !from || !recipient || !Number.isFinite(port)) return false;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  const name = escapeHtml(data.name);
  const email = escapeHtml(data.email);
  const phone = escapeHtml(data.phone || "Not provided");
  const message = escapeHtml(data.message).replace(/\n/g, "<br />");
  const timestamp = escapeHtml(submittedAt.toISOString());
  const safeRiskInfo = escapeHtml(riskInfo);

  await transporter.sendMail({
    from,
    to: recipient,
    replyTo: data.email,
    subject: `New Portfolio Contact — ${data.name}`,
    text: [
      `Name: ${data.name}`,
      `Email: ${data.email}`,
      `Phone: ${data.phone || "Not provided"}`,
      `Submitted: ${submittedAt.toISOString()}`,
      `Risk information: ${riskInfo}`,
      "",
      data.message,
    ].join("\n"),
    html: `<!doctype html><html><body style="margin:0;background:#05070d;color:#f5f5f5;font-family:Arial,sans-serif;padding:32px"><main style="max-width:640px;margin:auto;background:#080b14;border:1px solid #22283a;border-radius:18px;padding:32px"><p style="color:#ff5e2c;font-size:12px;letter-spacing:.16em;text-transform:uppercase">Portfolio contact</p><h1 style="font-size:24px;margin:0 0 24px">New message from ${name}</h1><p><b>Email</b><br>${email}</p><p><b>Phone</b><br>${phone}</p><p><b>Submitted</b><br>${timestamp}</p><p><b>Risk context</b><br>${safeRiskInfo}</p><div style="border-top:1px solid #22283a;margin-top:24px;padding-top:20px;line-height:1.7">${message}</div></main></body></html>`,
  });
  return true;
}
