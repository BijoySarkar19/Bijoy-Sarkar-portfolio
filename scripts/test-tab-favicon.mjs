import sharp from "sharp";
import fs from "fs";

const imgPath = "C:/Users/bijoy/.gemini/antigravity/brain/f9259d80-5f4a-48a1-a4e2-ea561cfdcf99/.user_uploaded/media_1793688987032_deb00bc2.jpg";

async function run() {
  const size = 450;
  const left = 140;
  const top = 30;

  const cropped = await sharp(imgPath)
    .extract({ left, top, width: size, height: size })
    .resize(256, 256)
    .png()
    .toBuffer();

  const circleSvg = Buffer.from(
    `<svg width="256" height="256"><circle cx="128" cy="128" r="126" fill="white"/></svg>`
  );

  const ringSvg = Buffer.from(
    `<svg width="256" height="256"><circle cx="128" cy="128" r="125" fill="none" stroke="rgba(255, 94, 44, 0.65)" stroke-width="4"/></svg>`
  );

  const circular = await sharp(cropped)
    .composite([{ input: circleSvg, blend: "dest-in" }])
    .png()
    .toBuffer();

  await sharp(circular)
    .composite([{ input: ringSvg, blend: "over" }])
    .toFile("C:/Users/bijoy/.gemini/antigravity/brain/f9259d80-5f4a-48a1-a4e2-ea561cfdcf99/tab-crop-circular-preview.png");

  console.log("Generated tab-crop-circular-preview.png successfully");
}
run();
