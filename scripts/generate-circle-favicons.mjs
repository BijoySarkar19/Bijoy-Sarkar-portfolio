import sharp from "sharp";
import fs from "fs";
import path from "path";

async function main() {
  const newPhotoPath = "C:/Users/bijoy/.gemini/antigravity/brain/f9259d80-5f4a-48a1-a4e2-ea561cfdcf99/.user_uploaded/media_1793653375037_081bf8b0.jpg";
  if (!fs.existsSync(newPhotoPath)) {
    console.error("New photo not found at", newPhotoPath);
    process.exit(1);
  }

  // 1. Copy full photo to public/bijoy-sarkar.jpg
  fs.copyFileSync(newPhotoPath, "public/bijoy-sarkar.jpg");
  console.log("Updated public/bijoy-sarkar.jpg with new photo");

  // 2. Crop centered face region
  // Image is 768x1024. Head center is around x=390, y=480
  const cropConfig = { left: 180, top: 270, width: 420, height: 420 };
  const baseSize = 512;
  const radius = baseSize / 2;

  // SVG mask for clean anti-aliased circle
  const circleMaskSvg = `<svg width="${baseSize}" height="${baseSize}" viewBox="0 0 ${baseSize} ${baseSize}">
    <circle cx="${radius}" cy="${radius}" r="${radius}" fill="white" />
  </svg>`;

  // Subtle sleek outer ring overlay in portfolio orange
  const ringSvg = `<svg width="${baseSize}" height="${baseSize}" viewBox="0 0 ${baseSize} ${baseSize}">
    <circle cx="${radius}" cy="${radius}" r="${radius - 2.5}" fill="none" stroke="rgba(255, 94, 44, 0.55)" stroke-width="5" />
  </svg>`;

  const baseCircle512 = await sharp(newPhotoPath)
    .extract(cropConfig)
    .resize(baseSize, baseSize, { fit: "cover" })
    .composite([
      {
        input: Buffer.from(circleMaskSvg),
        blend: "dest-in",
      },
      {
        input: Buffer.from(ringSvg),
        blend: "over",
      },
    ])
    .png()
    .toBuffer();

  // Save brand avatar
  fs.writeFileSync("public/avatar.png", baseCircle512);
  fs.writeFileSync("public/favicon-512x512.png", baseCircle512);
  console.log("Generated public/avatar.png & public/favicon-512x512.png");

  const sizes = [
    { name: "favicon-48x48.png", size: 48 },
    { name: "favicon.png", size: 48 },
    { name: "favicon-96x96.png", size: 96 },
    { name: "favicon-144x144.png", size: 144 },
    { name: "apple-touch-icon.png", size: 180 },
    { name: "favicon-192x192.png", size: 192 },
    { name: "icon.png", size: 192 },
  ];

  for (const item of sizes) {
    const resized = await sharp(baseCircle512)
      .resize(item.size, item.size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    fs.writeFileSync(path.join("public", item.name), resized);
    console.log(`Generated public/${item.name} (${item.size}x${item.size})`);
  }

  // Multi-resolution favicon.ico
  const buf16 = await sharp(baseCircle512).resize(16, 16).png().toBuffer();
  const buf32 = await sharp(baseCircle512).resize(32, 32).png().toBuffer();
  const buf48 = await sharp(baseCircle512).resize(48, 48).png().toBuffer();

  const icoBuffer = buildIco([
    { size: 16, buffer: buf16 },
    { size: 32, buffer: buf32 },
    { size: 48, buffer: buf48 },
  ]);
  fs.writeFileSync("public/favicon.ico", icoBuffer);
  console.log("Generated public/favicon.ico");

  // Save preview for inspection
  const previewPath = "C:/Users/bijoy/.gemini/antigravity/brain/f9259d80-5f4a-48a1-a4e2-ea561cfdcf99/new-circle-favicon-preview.png";
  fs.writeFileSync(previewPath, baseCircle512);
  console.log("Saved preview to", previewPath);
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
