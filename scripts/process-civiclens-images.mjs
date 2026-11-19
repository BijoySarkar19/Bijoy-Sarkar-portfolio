import sharp from "sharp";
import fs from "fs";
import path from "path";

const img1 = "C:/Users/bijoy/.gemini/antigravity/brain/f9259d80-5f4a-48a1-a4e2-ea561cfdcf99/.user_uploaded/media_1795116325567_49dfd455.jpg"; // Hero overview: Analyze. Monitor. Improve.
const img2 = "C:/Users/bijoy/.gemini/antigravity/brain/f9259d80-5f4a-48a1-a4e2-ea561cfdcf99/.user_uploaded/media_1795116317480_5cbf7ae7.jpg"; // Command Center / Operational Overview
const img3 = "C:/Users/bijoy/.gemini/antigravity/brain/f9259d80-5f4a-48a1-a4e2-ea561cfdcf99/.user_uploaded/media_1795116332122_c27c34c4.jpg"; // Public Infrastructure Intelligence

const outDir = path.join(process.cwd(), "public", "projects", "civiclens-core");

async function main() {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // 1. Convert Image 1 (Hero: Analyze. Monitor. Improve.) to 01.webp and hero.webp / hero.png
  await sharp(img1)
    .webp({ quality: 92 })
    .toFile(path.join(outDir, "01.webp"));
  await sharp(img1)
    .webp({ quality: 92 })
    .toFile(path.join(outDir, "hero.webp"));
  await sharp(img1)
    .png({ quality: 90 })
    .toFile(path.join(outDir, "01.png"));
  console.log("Processed 01.webp, hero.webp, 01.png");

  // 2. Convert Image 2 (Command Center / Operational Overview) to 02.webp and 02.png
  await sharp(img2)
    .webp({ quality: 92 })
    .toFile(path.join(outDir, "02.webp"));
  await sharp(img2)
    .png({ quality: 90 })
    .toFile(path.join(outDir, "02.png"));
  console.log("Processed 02.webp, 02.png");

  // 3. Convert Image 3 (Public Infrastructure Intelligence) to 03.webp and 03.png
  await sharp(img3)
    .webp({ quality: 92 })
    .toFile(path.join(outDir, "03.webp"));
  await sharp(img3)
    .png({ quality: 90 })
    .toFile(path.join(outDir, "03.png"));
  console.log("Processed 03.webp, 03.png");

  console.log("All CivicLens Core project images processed successfully!");
}

main().catch(console.error);
