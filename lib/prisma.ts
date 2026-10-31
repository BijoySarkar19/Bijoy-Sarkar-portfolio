import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";
import { existsSync, copyFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function getDatabaseUrl(): string {
  const envUrl = process.env.DATABASE_URL;
  if (envUrl && !envUrl.startsWith("file:")) {
    return envUrl;
  }

  // When deployed in Vercel serverless / AWS Lambda, the root filesystem is read-only.
  // /tmp is the only writable storage available.
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const tmpDbPath = "/tmp/dev.db";
    const srcDbPath = resolve(process.cwd(), "dev.db");

    try {
      if (!existsSync(tmpDbPath)) {
        if (existsSync(srcDbPath)) {
          copyFileSync(srcDbPath, tmpDbPath);
        } else {
          mkdirSync(dirname(tmpDbPath), { recursive: true });
        }
      }
    } catch (err) {
      console.warn("Could not copy dev.db to /tmp:", err);
    }

    return `file:${tmpDbPath}`;
  }

  return envUrl ?? "file:./dev.db";
}

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaBetterSqlite3({
    url: getDatabaseUrl(),
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
