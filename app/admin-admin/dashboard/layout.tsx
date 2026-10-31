import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({ children }: Readonly<{ children: ReactNode }>) {
  await requireAdmin();
  return <div className="site-shell admin-shell"><div className="admin-content">{children}</div></div>;
}
