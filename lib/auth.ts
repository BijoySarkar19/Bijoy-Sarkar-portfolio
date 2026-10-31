import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { adminLoginSchema } from "@/lib/validation";
import { allowLoginAttempt, recordFailedLogin, resetLoginAttempts } from "@/lib/auth-rate-limit";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
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
      async authorize(credentials, req) {
        const parsed = adminLoginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const username = parsed.data.username.trim().toLowerCase();
        const email = parsed.data.email.trim().toLowerCase();
        const identifier = email || username;

        // Next-level brute-force protection: check if account/IP is rate-limited
        const allowed = await allowLoginAttempt(identifier);
        if (!allowed) {
          throw new Error("Too many failed sign-in attempts. Please wait 15 minutes before retrying.");
        }

        const admin = await prisma.admin.findUnique({ where: { email } });
        if (!admin || admin.username.toLowerCase() !== username) {
          await recordFailedLogin(identifier);
          return null;
        }

        const passwordValid = await bcrypt.compare(parsed.data.password, admin.passwordHash);
        if (!passwordValid) {
          await recordFailedLogin(identifier);
          return null;
        }

        // Reset rate-limit counter on successful login
        await resetLoginAttempts(identifier);

        return { id: admin.id, name: admin.username, email: admin.email, role: "ADMIN" as const };
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
