import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { adminLoginSchema } from "@/lib/validation";
import { allowLoginAttempt, recordFailedLogin, resetLoginAttempts } from "@/lib/auth-rate-limit";

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

        const username = parsed.data.username.trim().toLowerCase();
        const email = parsed.data.email.trim().toLowerCase();
        const password = parsed.data.password;
        const identifier = email || username;

        // Next-level brute-force protection: check if account/IP is rate-limited
        const allowed = await allowLoginAttempt(identifier);
        if (!allowed) {
          throw new Error("Too many failed sign-in attempts. Please wait 15 minutes before retrying.");
        }

        // 1. Direct environment administrator credentials fallback
        const envUsername = (process.env.ADMIN_USERNAME || "Bijoy19").trim().toLowerCase();
        const envEmail = (process.env.ADMIN_EMAIL || "bijoysarkar7252@gmail.com").trim().toLowerCase();
        const envPassword = process.env.ADMIN_PASSWORD || "Teriki77!";

        if (
          (username === envUsername || username === "bijoy") &&
          email === envEmail &&
          password === envPassword
        ) {
          await resetLoginAttempts(identifier);
          return {
            id: "admin-env",
            name: process.env.ADMIN_USERNAME || "Bijoy19",
            email: process.env.ADMIN_EMAIL || "bijoysarkar7252@gmail.com",
            role: "ADMIN" as const,
          };
        }

        // 2. Check against database admin record if database is accessible
        try {
          const admin = await prisma.admin.findUnique({ where: { email } });
          if (admin && admin.username.toLowerCase() === username) {
            const passwordValid = await bcrypt.compare(password, admin.passwordHash);
            if (passwordValid) {
              await resetLoginAttempts(identifier);
              return { id: admin.id, name: admin.username, email: admin.email, role: "ADMIN" as const };
            }
          }
        } catch (dbError) {
          console.warn("Prisma admin check fallback:", dbError);
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
