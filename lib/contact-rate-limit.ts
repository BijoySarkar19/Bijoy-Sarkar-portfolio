import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";

const WINDOW_MS = 60 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export async function allowContactAttempt(ipAddress: string) {
  const salt = process.env.RATE_LIMIT_SALT ?? process.env.NEXTAUTH_SECRET ?? "local-rate-limit-salt";
  const ipHash = createHash("sha256").update(`${salt}:${ipAddress}`).digest("hex");
  const now = new Date();

  return prisma.$transaction(async (transaction) => {
    const existing = await transaction.contactRateLimit.findUnique({ where: { ipHash } });
    if (!existing || now.getTime() - existing.windowStart.getTime() >= WINDOW_MS) {
      await transaction.contactRateLimit.upsert({
        where: { ipHash },
        create: { ipHash, windowStart: now, attempts: 1 },
        update: { windowStart: now, attempts: 1 },
      });
      return true;
    }
    if (existing.attempts >= MAX_ATTEMPTS) return false;
    await transaction.contactRateLimit.update({ where: { ipHash }, data: { attempts: { increment: 1 } } });
    return true;
  });
}
