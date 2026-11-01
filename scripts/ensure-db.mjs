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
    // Ensure CivicLens Core is active in Currently Working (1/2)
    database.prepare(`UPDATE Project SET featuredOnHome = 1 WHERE slug = 'civiclens-core' AND isOngoing = 1`).run();
    database.close();
  } catch {}
}
