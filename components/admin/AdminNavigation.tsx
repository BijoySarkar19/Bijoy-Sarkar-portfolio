"use client";

import Link from "next/link";
import { AdminLogout } from "@/components/admin/AdminLogout";
import { useEffect, useState } from "react";
import { formatIndianTime } from "@/lib/ist-date";
import { Clock } from "lucide-react";

export type AdminTab = "overview" | "projects" | "experience" | "skills" | "resume" | "settings" | "audit" | "messages" | "new";

export function AdminNavigation({ active }: { active: AdminTab }) {
  const [istTime, setIstTime] = useState("");

  useEffect(() => {
    const update = () => setIstTime(formatIndianTime(new Date()));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="admin-nav-container">
      <div className="admin-nav-row">
        <nav className="admin-nav" aria-label="Admin navigation">
          <Link href="/admin-admin/dashboard" aria-current={active === "overview" ? "page" : undefined}>
            Overview
          </Link>
          <Link href="/admin-admin/dashboard/projects" aria-current={active === "projects" || active === "new" ? "page" : undefined}>
            Projects
          </Link>
          <Link href="/admin-admin/dashboard/experience" aria-current={active === "experience" ? "page" : undefined}>
            Work Experience
          </Link>
          <Link href="/admin-admin/dashboard/skills" aria-current={active === "skills" ? "page" : undefined}>
            Skills &amp; Languages
          </Link>
          <Link href="/admin-admin/dashboard/resume" aria-current={active === "resume" ? "page" : undefined}>
            CV / Resume
          </Link>
          <Link href="/admin-admin/dashboard/messages" aria-current={active === "messages" ? "page" : undefined}>
            Messages &amp; Sheets
          </Link>
          <Link href="/admin-admin/dashboard/settings" aria-current={active === "settings" ? "page" : undefined}>
            Settings
          </Link>
          <Link href="/admin-admin/dashboard/audit" aria-current={active === "audit" ? "page" : undefined}>
            Activity Dataset (IST)
          </Link>
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
