interface RecaptchaResponse {
  success: boolean;
  score?: number;
  action?: string;
}

export async function verifyRecaptcha(token: string, remoteIp?: string) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) return process.env.NODE_ENV !== "production";
  if (!token) return false;

  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.set("remoteip", remoteIp);

  try {
    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
    });
    if (!response.ok) return false;
    const result = (await response.json()) as RecaptchaResponse;
    return result.success && (result.score === undefined || result.score >= 0.5) && (result.action === undefined || result.action === "contact");
  } catch {
    return false;
  }
}
