import Database from "better-sqlite3";
import fs from "node:fs";

for (const dbPath of ["dev.db", "prisma/dev.db"]) {
  if (fs.existsSync(dbPath)) {
    const db = new Database(dbPath);
    try {
      db.exec("ALTER TABLE Project ADD COLUMN imagesJson TEXT DEFAULT '[]'");
      console.log(`Added imagesJson to ${dbPath}`);
    } catch (e) {
      console.log(`Notice for ${dbPath}:`, e.message);
    }
    // Also ensure defaultProjectImageCount and ongoingDefaultImage in SiteSetting
    try {
      db.prepare("INSERT OR IGNORE INTO SiteSetting (key, value, updatedAt) VALUES (?, ?, CURRENT_TIMESTAMP)")
        .run("ongoingDefaultImage", "/images/ongoing-project-cover.webp");
      db.prepare("INSERT OR IGNORE INTO SiteSetting (key, value, updatedAt) VALUES (?, ?, CURRENT_TIMESTAMP)")
        .run("defaultProjectImageCount", "3");
      console.log(`Seeded default settings in ${dbPath}`);
    } catch (e) {
      console.log(`Setting notice for ${dbPath}:`, e.message);
    }
    db.close();
  }
}
