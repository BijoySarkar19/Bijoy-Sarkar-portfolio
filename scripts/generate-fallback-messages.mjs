import fs from "fs";
import path from "path";
import { FALLBACK_CONTACT_MESSAGES } from "../lib/fallback-messages.ts";

fs.writeFileSync(
  path.join(process.cwd(), "prisma", "fallback-messages.json"),
  JSON.stringify(FALLBACK_CONTACT_MESSAGES, null, 2),
  "utf8"
);
console.log("Wrote prisma/fallback-messages.json successfully.");
