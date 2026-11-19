import "dotenv/config";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import Database from "better-sqlite3";

const url = process.env.DATABASE_URL ?? "file:./dev.db";
if (!url.startsWith("file:")) {
  throw new Error("The local setup command expects a SQLite file URL in DATABASE_URL.");
}

const fileName = decodeURIComponent(url.slice("file:".length).split("?")[0]);
const databasePath = resolve(process.cwd(), fileName);
if (!existsSync(databasePath)) {
  mkdirSync(dirname(databasePath), { recursive: true });
  const database = new Database(databasePath);
  database.close();
} else {
  try {
    const database = new Database(databasePath);
    // Ensure CivicLens Core is deployed to Main Projects (Real problems) with WebP screenshots and repository
    database.prepare(`
      UPDATE Project
      SET isOngoing = 0,
          featuredOnHome = 1,
          sortOrder = 2,
          image1 = '/projects/civiclens-core/01.webp',
          image2 = '/projects/civiclens-core/02.webp',
          image3 = '/projects/civiclens-core/03.webp',
          githubUrl = 'https://github.com/BijoySarkar19/CivicLens-Core'
      WHERE slug = 'civiclens-core'
    `).run();

    // Ensure SentinelEdge is active in Currently Working
    const hasSentinel = database.prepare("SELECT id FROM Project WHERE slug = 'sentineledge'").get();
    if (hasSentinel) {
      database.prepare(`
        UPDATE Project
        SET isOngoing = 1,
            featuredOnHome = 1,
            sortOrder = 1,
            image1 = '/images/ongoing-project-cover.webp',
            image2 = '',
            image3 = ''
        WHERE slug = 'sentineledge'
      `).run();
    }
    database.close();
  } catch {}
}
