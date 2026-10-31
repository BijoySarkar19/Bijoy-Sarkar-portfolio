import { existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import sharp from "sharp";

const sourceDirectory = process.env.PROJECT_IMAGE_SOURCE ?? resolve(process.cwd(), "..", "Project images");
const imageSets = [
  ["owasp-ai-security-assistant", [1, 2, 3]],
  ["road-segmentation", [4, 5, 6]],
  ["vaultora-bank", [7, 8, 9]],
  ["c-compiler-studio", [10, 11, 12]],
  ["nexora-private-search", [16, 17, 18]],
  ["pixeldb-engine", [19, 20, 21]],
  ["javacachedb", [22, 23, 24]],
  ["novamart-commerce", [25, 26, 27]],
  ["advanced-nlp-analytics", [28, 29, 30]],
  ["sentimentx", [31, 32, 33]],
  ["smart-attendance-system", [34, 35, 36]],
  ["rakshak-ai", [37, 38, 39]],
  ["expense-tracker", [40, 41, 42]],
  ["aether-platform", [43, 44, 45]],
];

if (!existsSync(sourceDirectory)) {
  throw new Error(`Project image folder not found: ${sourceDirectory}`);
}

let imported = 0;
for (const [slug, imageNumbers] of imageSets) {
  const destinationDirectory = resolve(process.cwd(), "public", "projects", slug);
  mkdirSync(destinationDirectory, { recursive: true });

  for (const [index, imageNumber] of imageNumbers.entries()) {
    const sourcePath = resolve(sourceDirectory, `${imageNumber}.png`);
    const destinationPath = resolve(destinationDirectory, `${String(index + 1).padStart(2, "0")}.webp`);
    if (!existsSync(sourcePath)) throw new Error(`Project image not found: ${sourcePath}`);

    await sharp(sourcePath)
      .rotate()
      .resize({ width: 2000, height: 1400, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 90, effort: 5 })
      .toFile(destinationPath);
    imported += 1;
  }
}

console.info(`Imported ${imported} mapped project images from ${sourceDirectory}.`);
