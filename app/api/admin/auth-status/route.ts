import { NextResponse } from "next/server";
import { checkLoginRateLimit } from "@/lib/auth-rate-limit";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const identifier = (searchParams.get("identifier") || "bijoysarkar7252@gmail.com").trim().toLowerCase();

    const status = await checkLoginRateLimit(identifier);

    return NextResponse.json(
      {
        locked: !status.allowed,
        remainingSeconds: status.remainingSeconds,
        maxAttempts: 5,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("Auth status check error:", error);
    return NextResponse.json(
      { locked: false, remainingSeconds: 0, maxAttempts: 5 },
      { status: 200 }
    );
  }
}
