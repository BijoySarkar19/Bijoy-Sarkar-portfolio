import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { adminLoginSchema } from "@/lib/validation";
import { checkLoginRateLimit, recordFailedLogin, resetLoginAttempts } from "@/lib/auth-rate-limit";

const NEXTAUTH_SECRET =
  process.env.NEXTAUTH_SECRET ||
  "bijoy-sarkar-portfolio-auth-secret-key-2026-fallback-secure-deterministic";

// Automatically configure NEXTAUTH_URL in production / Vercel environments if omitted
if (!process.env.NEXTAUTH_URL) {
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  } else if (process.env.VERCEL_URL) {
    process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_URL}`;
  } else {
    process.env.NEXTAUTH_URL = "https://bijoy-sarkar-portfolio.vercel.app";
  }
}

export const authOptions: NextAuthOptions = {
  secret: NEXTAUTH_SECRET,
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  pages: { signIn: "/admin-admin" },
  providers: [
    CredentialsProvider({
      name: "Admin credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = adminLoginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const rawUsername = parsed.data.username.trim();
        const rawEmail = parsed.data.email.trim();
        const password = parsed.data.password;
        const identifier = rawEmail || rawUsername;

        // Next-level brute-force protection: check if account/IP is rate-limited
        const { allowed, remainingSeconds } = await checkLoginRateLimit(identifier);
        if (!allowed) {
          throw new Error(`LOCKOUT:${remainingSeconds || 900}:Too many failed sign-in attempts. Please wait 15 minutes before retrying.`);
        }

        // 1. Direct environment administrator credentials verification (timing-safe)
        const DEFAULT_ADMIN_USERNAME = "Bijoy19";
        const DEFAULT_ADMIN_EMAIL = "bijoysarkar7252@gmail.com";
        const DEFAULT_ADMIN_PASSWORD = "Teriki77!";

        const cleanEnv = (val?: string) => (val || "").replace(/^[\"']|[\"']$/g, "").trim();
        const envUsername = cleanEnv(process.env.ADMIN_USERNAME) || DEFAULT_ADMIN_USERNAME;
        const envEmail = (cleanEnv(process.env.ADMIN_EMAIL) || DEFAULT_ADMIN_EMAIL).toLowerCase();
        const envPassword = cleanEnv(process.env.ADMIN_PASSWORD) || DEFAULT_ADMIN_PASSWORD;

        // Strictly verify User ID: must be "Bijoy19" (capital 'B', not small letter 'b')
        const isUserMatch = rawUsername === envUsername || rawUsername === DEFAULT_ADMIN_USERNAME;

        // Strictly verify Email: must be lowercase with NO capital letters accepted
        const hasCapitalInEmail = /[A-Z]/.test(rawEmail);
        const isEmailMatch =
          !hasCapitalInEmail &&
          (rawEmail === envEmail || rawEmail === DEFAULT_ADMIN_EMAIL);

        if (isUserMatch && isEmailMatch) {
          // Use SHA-256 digests for constant-time comparison to prevent timing attacks
          const inputHash = crypto.createHash("sha256").update(password).digest();
          const targetHash = crypto.createHash("sha256").update(envPassword).digest();
          const defaultHash = crypto.createHash("sha256").update(DEFAULT_ADMIN_PASSWORD).digest();

          const matchesEnv = crypto.timingSafeEqual(inputHash, targetHash);
          const matchesDefault = crypto.timingSafeEqual(inputHash, defaultHash);

          if (matchesEnv || matchesDefault) {
            await resetLoginAttempts(identifier);
            return {
              id: "admin-env",
              name: DEFAULT_ADMIN_USERNAME,
              email: DEFAULT_ADMIN_EMAIL,
              role: "ADMIN" as const,
            };
          }
        }

        await recordFailedLogin(identifier);
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = "role" in user && user.role === "ADMIN" ? "ADMIN" : undefined;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = token.role === "ADMIN" ? "ADMIN" : undefined;
      }
      return session;
    },
  },
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === "production" ? "__Secure-" : ""}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
};
