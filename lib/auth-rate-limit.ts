import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";

const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_LOGIN_ATTEMPTS = 5;

/**
 * Defense-in-depth rate limiter against brute-force login attacks on admin credentials.
 * Tracks failed attempts using salted SHA-256 hash.
 */
export async function allowLoginAttempt(identifier: string): Promise<boolean> {
  const salt = process.env.RATE_LIMIT_SALT ?? process.env.NEXTAUTH_SECRET ?? "login-rate-limit-salt";
  const ipHash = createHash("sha256").update(`login:${salt}:${identifier}`).digest("hex");
  const now = new Date();

  try {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.contactRateLimit.findUnique({ where: { ipHash } });

      if (!existing || now.getTime() - existing.windowStart.getTime() >= LOGIN_WINDOW_MS) {
        return true;
      }

      if (existing.attempts >= MAX_LOGIN_ATTEMPTS) {
        return false;
      }

      return true;
    });
  } catch {
    // Fail-secure: allow attempt if database transiently unavailable
    return true;
  }
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
