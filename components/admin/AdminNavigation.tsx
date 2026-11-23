"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminLogout } from "@/components/admin/AdminLogout";
import { useEffect, useState } from "react";
import { formatAdminClockIST } from "@/lib/ist-date";
import { Clock } from "lucide-react";

export type AdminTab = "overview" | "projects" | "experience" | "skills" | "resume" | "settings" | "audit" | "messages" | "new";

const NAV_ITEMS: { tab: AdminTab; href: string; label: string }[] = [
  { tab: "overview", href: "/admin-admin/dashboard", label: "Overview" },
  { tab: "projects", href: "/admin-admin/dashboard/projects", label: "Projects" },
  { tab: "experience", href: "/admin-admin/dashboard/experience", label: "Work Experience" },
  { tab: "skills", href: "/admin-admin/dashboard/skills", label: "Skills & Languages" },
  { tab: "resume", href: "/admin-admin/dashboard/resume", label: "CV / Resume" },
  { tab: "messages", href: "/admin-admin/dashboard/messages", label: "Messages & Sheets" },
  { tab: "settings", href: "/admin-admin/dashboard/settings", label: "Settings" },
  { tab: "audit", href: "/admin-admin/dashboard/audit", label: "Activity Dataset (IST)" },
];

export function AdminNavigation({ active }: { active: AdminTab }) {
  const [istTime, setIstTime] = useState("");
  const [pendingTab, setPendingTab] = useState<AdminTab | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    setPendingTab(null);
  }, [pathname, active]);

  useEffect(() => {
    const update = () => setIstTime(formatAdminClockIST(new Date()));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="admin-nav-container">
      <div className="admin-nav-row">
        <nav className="admin-nav" aria-label="Admin navigation">
          {NAV_ITEMS.map((item) => {
            const isCurrent = active === item.tab || (item.tab === "projects" && active === "new");
            const isPending = pendingTab === item.tab && !isCurrent;

            return (
              <Link
                key={item.tab}
                href={item.href}
                prefetch={true}
                aria-current={isCurrent ? "page" : undefined}
                className={isPending ? "admin-nav-pending" : undefined}
                onClick={() => {
                  if (!isCurrent) {
                    setPendingTab(item.tab);
                  }
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="admin-nav-aside">
          {istTime && (
            <div className="admin-ist-clock" title="Current Indian Standard Time (IST - Asia/Kolkata)">
              <Clock size={12} />
              <span>{istTime}</span>
            </div>
          )}
          <AdminLogout />
        </div>
      </div>
    </div>
  );
}
