"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";

export function DeleteProjectButton({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function remove() {
    if (!window.confirm(`Are you sure you want to permanently delete “${title}”?`)) return;
    setPending(true);
    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        window.alert(result.error ?? "The project could not be deleted.");
        return;
      }
      router.refresh();
    } catch {
      window.alert("The project could not be deleted. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return <button className="admin-small-button danger" type="button" onClick={() => void remove()} disabled={pending}><Trash2 size={12} />{pending ? "Deleting…" : "Delete"}</button>;
}
