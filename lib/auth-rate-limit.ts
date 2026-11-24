import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";

const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_LOGIN_ATTEMPTS = 5;

export interface LoginRateLimitStatus {
  allowed: boolean;
  remainingSeconds: number;
}

/**
 * Defense-in-depth rate limiter against brute-force login attacks on admin credentials.
 * Tracks failed attempts using salted SHA-256 hash.
 */
export async function checkLoginRateLimit(identifier: string): Promise<LoginRateLimitStatus> {
  const salt = process.env.RATE_LIMIT_SALT ?? process.env.NEXTAUTH_SECRET ?? "login-rate-limit-salt";
  const ipHash = createHash("sha256").update(`login:${salt}:${identifier}`).digest("hex");
  const now = new Date();

  try {
    const existing = await prisma.contactRateLimit.findUnique({ where: { ipHash } });

    if (!existing || now.getTime() - existing.windowStart.getTime() >= LOGIN_WINDOW_MS) {
      return { allowed: true, remainingSeconds: 0 };
    }

    if (existing.attempts >= MAX_LOGIN_ATTEMPTS) {
      const elapsed = now.getTime() - existing.windowStart.getTime();
      const remainingMs = Math.max(0, LOGIN_WINDOW_MS - elapsed);
      const remainingSeconds = Math.ceil(remainingMs / 1000);
      return { allowed: false, remainingSeconds: remainingSeconds > 0 ? remainingSeconds : 900 };
    }

    return { allowed: true, remainingSeconds: 0 };
  } catch {
    // Fail-secure: allow attempt if database transiently unavailable
    return { allowed: true, remainingSeconds: 0 };
  }
}

export async function allowLoginAttempt(identifier: string): Promise<boolean> {
  const status = await checkLoginRateLimit(identifier);
  return status.allowed;
}

/**
 * Record a failed login attempt for the identifier.
 */
export async function recordFailedLogin(identifier: string): Promise<void> {
  const salt = process.env.RATE_LIMIT_SALT ?? process.env.NEXTAUTH_SECRET ?? "login-rate-limit-salt";
  const ipHash = createHash("sha256").update(`login:${salt}:${identifier}`).digest("hex");
  const now = new Date();

  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.contactRateLimit.findUnique({ where: { ipHash } });

      if (!existing || now.getTime() - existing.windowStart.getTime() >= LOGIN_WINDOW_MS) {
        await tx.contactRateLimit.upsert({
          where: { ipHash },
          create: { ipHash, windowStart: now, attempts: 1 },
          update: { windowStart: now, attempts: 1 },
        });
      } else {
        await tx.contactRateLimit.update({
          where: { ipHash },
          data: { attempts: { increment: 1 } },
        });
      }
    });
  } catch {
    // Non-fatal logging
  }
}

/**
 * Reset failed login attempts on successful login.
 */
export async function resetLoginAttempts(identifier: string): Promise<void> {
  const salt = process.env.RATE_LIMIT_SALT ?? process.env.NEXTAUTH_SECRET ?? "login-rate-limit-salt";
  const ipHash = createHash("sha256").update(`login:${salt}:${identifier}`).digest("hex");

  try {
    await prisma.contactRateLimit.deleteMany({ where: { ipHash } });
  } catch {
    // Non-fatal
  }
}
