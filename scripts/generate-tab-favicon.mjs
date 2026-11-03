import sharp from "sharp";
import fs from "fs";
import path from "path";

async function main() {
  const tabPhotoPath = "C:/Users/bijoy/.gemini/antigravity/brain/f9259d80-5f4a-48a1-a4e2-ea561cfdcf99/.user_uploaded/media_1793688987032_deb00bc2.jpg";
  if (!fs.existsSync(tabPhotoPath)) {
    console.error("Tab photo not found at", tabPhotoPath);
    process.exit(1);
  }

  // Crop centered face region from light blue kurta photo
  // Image is 720x720. Head centered at x=365, y=250.
  const cropConfig = { left: 140, top: 30, width: 450, height: 450 };
  const baseSize = 256;
  const radius = baseSize / 2;

  // SVG mask for clean anti-aliased circle
  const circleMaskSvg = `<svg width="${baseSize}" height="${baseSize}" viewBox="0 0 ${baseSize} ${baseSize}">
    <circle cx="${radius}" cy="${radius}" r="${radius}" fill="white" />
  </svg>`;

  // Subtle sleek outer ring overlay in portfolio orange
  const ringSvg = `<svg width="${baseSize}" height="${baseSize}" viewBox="0 0 ${baseSize} ${baseSize}">
    <circle cx="${radius}" cy="${radius}" r="${radius - 2}" fill="none" stroke="rgba(255, 94, 44, 0.65)" stroke-width="4" />
  </svg>`;

  const tabCircle256 = await sharp(tabPhotoPath)
    .extract(cropConfig)
    .resize(baseSize, baseSize, { fit: "cover" })
    .composite([
      { input: Buffer.from(circleMaskSvg), blend: "dest-in" },
      { input: Buffer.from(ringSvg), blend: "over" },
    ])
    .png()
    .toBuffer();

  // Save dedicated tab icons
  fs.writeFileSync("public/tab-icon.png", tabCircle256);

  const buf16 = await sharp(tabCircle256).resize(16, 16).png().toBuffer();
  const buf32 = await sharp(tabCircle256).resize(32, 32).png().toBuffer();
  const buf48 = await sharp(tabCircle256).resize(48, 48).png().toBuffer();

  fs.writeFileSync("public/favicon-16x16.png", buf16);
  fs.writeFileSync("public/favicon-32x32.png", buf32);

  // Build multi-resolution favicon.ico for browser tabs and URL bars
  const icoBuffer = buildIco([
    { size: 16, buffer: buf16 },
    { size: 32, buffer: buf32 },
    { size: 48, buffer: buf48 },
  ]);
  fs.writeFileSync("public/favicon.ico", icoBuffer);
  console.log("Updated public/favicon.ico with light blue kurta circular photo");

  // Generate public/tab-icon.svg
  const base64Png = tabCircle256.toString("base64");
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <defs>
    <clipPath id="tabCircleClip">
      <circle cx="128" cy="128" r="128" />
    </clipPath>
  </defs>
  <image href="data:image/png;base64,${base64Png}" width="256" height="256" clip-path="url(#tabCircleClip)" />
</svg>`;
  fs.writeFileSync("public/tab-icon.svg", svgContent, "utf-8");
  console.log("Generated public/tab-icon.svg");

  console.log("VERIFICATION: public/avatar.png is untouched:", fs.statSync("public/avatar.png").size);
  console.log("VERIFICATION: public/favicon-48x48.png is untouched:", fs.statSync("public/favicon-48x48.png").size);
}

function buildIco(images) {
  const count = images.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  let offset = headerSize + count * dirEntrySize;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // ICO type
  header.writeUInt16LE(count, 4); // Number of images

  const entries = [];
  for (const img of images) {
    const entry = Buffer.alloc(dirEntrySize);
    entry.writeUInt8(img.size >= 256 ? 0 : img.size, 0); // Width
    entry.writeUInt8(img.size >= 256 ? 0 : img.size, 1); // Height
    entry.writeUInt8(0, 2); // Colors in palette
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(img.buffer.length, 8); // Size of image data
    entry.writeUInt32LE(offset, 12); // Offset of image data
    entries.push(entry);
    offset += img.buffer.length;
  }

  return Buffer.concat([header, ...entries, ...images.map((img) => img.buffer)]);
}

main().catch(console.error);
