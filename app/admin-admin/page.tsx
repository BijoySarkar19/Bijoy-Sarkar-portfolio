import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  let session = null;
  try {
    session = await getServerSession(authOptions);
  } catch (error) {
    console.warn("getServerSession warning on /admin-admin:", error);
  }
  if (session?.user?.role === "ADMIN") redirect("/admin-admin/dashboard");
  return (
    <main className="admin-login-wrap">
      <section className="admin-login" aria-labelledby="admin-login-title">
        <p className="section-kicker">Private workspace</p>
        <h1 id="admin-login-title">Admin sign in</h1>
        <p>Sign in to manage published portfolio projects.</p>
        <AdminLogin />
      </section>
    </main>
  );
}
