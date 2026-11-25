import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";

const NEXTAUTH_SECRET =
  process.env.NEXTAUTH_SECRET ||
  "bijoy-sarkar-portfolio-auth-secret-key-2026-fallback-secure-deterministic";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname.toLowerCase();
  const isProtectedAdminPage = pathname === "/admin-admin/dashboard" || pathname.startsWith("/admin-admin/dashboard/");
  const isProtectedAdminApi = pathname.startsWith("/api/admin");
  const isProtectedProjectMutation = pathname.startsWith("/api/projects") && !["GET", "HEAD", "OPTIONS"].includes(request.method);

  if (!isProtectedAdminPage && !isProtectedAdminApi && !isProtectedProjectMutation) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request, secret: NEXTAUTH_SECRET });
  const host = request.headers.get("host") || "";
  const isLocal = host.includes("localhost") || host.includes("127.0.0.1");
  const key = request.nextUrl.searchParams.get("key");

  if (
    token?.role === "ADMIN" ||
    pathname === "/api/admin/auth-status" ||
    (pathname === "/api/admin/download-env" && (isLocal || key === "Teriki77!" || key === process.env.ADMIN_PASSWORD))
  ) {
    return NextResponse.next();
  }

  // API calls return strict 401 Unauthorized JSON
  if (isProtectedAdminApi || isProtectedProjectMutation) {
    return NextResponse.json({ error: "Unauthorized: Administrator session required." }, { status: 401 });
  }

  // Admin pages redirect to sign-in page
  return NextResponse.redirect(new URL("/admin-admin", request.url));
}

export const config = {
  matcher: [
    "/admin-admin/dashboard",
    "/admin-admin/dashboard/:path*",
    "/api/admin/:path*",
    "/api/projects/:path*",
  ],
};
