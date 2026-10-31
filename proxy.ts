import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isProtectedAdminPage = pathname.startsWith("/admin-admin/dashboard");
  const isProtectedAdminApi = pathname.startsWith("/api/admin");
  const isProtectedProjectMutation = pathname.startsWith("/api/projects") && !["GET", "HEAD", "OPTIONS"].includes(request.method);

  if (!isProtectedAdminPage && !isProtectedAdminApi && !isProtectedProjectMutation) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET ?? "" });
  if (token?.role === "ADMIN") {
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
    "/admin-admin/dashboard/:path*",
    "/api/admin/:path*",
    "/api/projects/:path*",
  ],
};
