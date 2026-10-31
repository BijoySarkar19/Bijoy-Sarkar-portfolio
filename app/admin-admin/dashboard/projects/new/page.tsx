import { AdminNavigation } from "@/components/admin/AdminNavigation";
import { ProjectForm } from "@/components/admin/ProjectForm";

export const dynamic = "force-dynamic";

export default function NewProjectPage() {
  return (
    <main>
      <div className="admin-topline"><div><p className="section-kicker">Content management</p><h1>New project</h1></div></div>
      <AdminNavigation active="new" />
      <section className="admin-card"><ProjectForm /></section>
    </main>
  );
}
