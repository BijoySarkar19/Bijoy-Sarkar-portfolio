import Database from "better-sqlite3";
import path from "path";

const dbPath = path.resolve(process.cwd(), "dev.db");
const db = new Database(dbPath);

async function main() {
  console.log("Reading existing CivicLens Core state from dev.db...");
  const prevCivicLens = db.prepare("SELECT * FROM Project WHERE slug = 'civiclens-core'").get();
  console.log("Current state:", prevCivicLens);

  // 1. Update CivicLens Core to Main Projects (Real problems)
  db.prepare(`
    UPDATE Project
    SET isOngoing = 0,
        featuredOnHome = 1,
        sortOrder = 2,
        image1 = '/projects/civiclens-core/01.webp',
        image2 = '/projects/civiclens-core/02.webp',
        image3 = '/projects/civiclens-core/03.webp',
        githubUrl = 'https://github.com/BijoySarkar19/CivicLens-Core',
        updatedAt = CURRENT_TIMESTAMP
    WHERE slug = 'civiclens-core'
  `).run();

  // 2. Adjust sortOrder of other main featured projects to maintain clean Top 5
  db.prepare("UPDATE Project SET sortOrder = 1 WHERE slug = 'owasp-ai-security-assistant'").run();
  db.prepare("UPDATE Project SET sortOrder = 3 WHERE slug = 'road-segmentation'").run();
  db.prepare("UPDATE Project SET sortOrder = 4 WHERE slug = 'vaultora-bank'").run();
  db.prepare("UPDATE Project SET sortOrder = 5 WHERE slug = 'c-compiler-studio'").run();
  db.prepare("UPDATE Project SET featuredOnHome = 0, sortOrder = 6 WHERE slug = 'nexora-private-search'").run();

  const nextCivicLens = db.prepare("SELECT * FROM Project WHERE slug = 'civiclens-core'").get();
  console.log("Updated state:", nextCivicLens);

  // 3. Insert audit log entry for IST audit timeline in Admin Portal
  const auditId = "audit_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 7);
  const auditSummary = `Deployed "CivicLens Core" from Currently Working to Main Projects section (Real problems. Useful software.)`;
  const auditPayload = JSON.stringify({
    summary: auditSummary,
    previous: prevCivicLens,
    current: nextCivicLens,
  });

  db.prepare(`
    INSERT INTO AuditLog (id, entity, entityId, action, changes, adminId, adminName, timestamp)
    VALUES (?, 'PROJECT', ?, 'UPDATE', ?, 'admin-system', 'Bijoy Sarkar', CURRENT_TIMESTAMP)
  `).run(auditId, nextCivicLens.id, auditPayload);

  console.log("Recorded audit log entry with ID:", auditId);

  // 4. Verify counts
  const mainProjects = db.prepare("SELECT id, slug, title, sortOrder, featuredOnHome, isOngoing FROM Project WHERE published = 1 AND featuredOnHome = 1 AND isOngoing = 0 ORDER BY sortOrder ASC").all();
  const ongoingProjects = db.prepare("SELECT id, slug, title, sortOrder, featuredOnHome, isOngoing FROM Project WHERE published = 1 AND featuredOnHome = 1 AND isOngoing = 1 ORDER BY sortOrder ASC").all();

  console.log("\n=== VERIFICATION: Main Projects (Real problems, Top 5) ===");
  console.table(mainProjects);

  console.log("\n=== VERIFICATION: Ongoing Projects (Currently working on, Top 2) ===");
  console.table(ongoingProjects);

  db.close();
}

main().catch(console.error);
