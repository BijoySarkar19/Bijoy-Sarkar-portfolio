"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export function AdminLogout() {
  return <button className="admin-small-button" type="button" onClick={() => void signOut({ callbackUrl: "/admin-admin" })}><LogOut size={13} /> Sign out</button>;
}
