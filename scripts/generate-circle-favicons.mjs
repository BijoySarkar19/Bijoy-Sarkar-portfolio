import sharp from "sharp";
import fs from "fs";
import path from "path";

async function main() {
  const inputImage = path.resolve("public/bijoy-sarkar.jpg");
  if (!fs.existsSync(inputImage)) {
    console.error("public/bijoy-sarkar.jpg not found!");
    process.exit(1);
  }

  // Base size for circular mask
  const baseSize = 512;
  const radius = baseSize / 2;

  // SVG mask for a clean anti-aliased circle
  // We can also add an optional subtle modern border/ring to ensure it pops on both dark and light browser backgrounds!
  const circleMaskSvg = `<svg width="${baseSize}" height="${baseSize}" viewBox="0 0 ${baseSize} ${baseSize}">
    <circle cx="${radius}" cy="${radius}" r="${radius}" fill="white" />
  </svg>`;

  // Subtle sleek outer ring overlay
  const ringSvg = `<svg width="${baseSize}" height="${baseSize}" viewBox="0 0 ${baseSize} ${baseSize}">
    <circle cx="${radius}" cy="${radius}" r="${radius - 2}" fill="none" stroke="rgba(255, 94, 44, 0.45)" stroke-width="4" />
  </svg>`;

  // 1. Crop face from original 720x720 photo ({ left: 140, top: 60, width: 440, height: 440 })
  // 2. Resize to 512x512
  // 3. Mask with circle
  const baseCircle512 = await sharp(inputImage)
    .extract({ left: 140, top: 60, width: 440, height: 440 })
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

  fs.writeFileSync("public/favicon-512x512.png", baseCircle512);
  console.log("Generated public/favicon-512x512.png");

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

  // Also build multi-resolution favicon.ico containing 16x16, 32x32, 48x48
  // Since favicon.ico can wrap PNGs directly:
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

  // Also save a preview in the artifacts directory so the user can see
  const previewPath = "C:/Users/bijoy/.gemini/antigravity/brain/f9259d80-5f4a-48a1-a4e2-ea561cfdcf99/circular-favicon-preview.png";
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
