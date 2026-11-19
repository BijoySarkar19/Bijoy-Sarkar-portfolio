import fs from "node:fs";

let css = fs.readFileSync("app/globals.css", "utf8");

// Normalize line endings to find cleanly
css = css.replace(
  /\.project-image-frame::after\s*\{[^}]+\}/,
  `.project-image-frame::after { position: absolute; inset: 84% 0 0; pointer-events: none; background: linear-gradient(180deg, transparent, rgb(0 0 0 / 0.22)); content: ""; }`
);

css = css.replace(
  /\.project-image\s*\{[^}]+\}/,
  `.project-image { object-fit: cover; filter: none !important; opacity: 1 !important; transform: scale(1.001); transition: transform 700ms cubic-bezier(.2,.7,.2,1); }`
);

css = css.replace(
  /\.project-card:hover \.project-image\s*\{[^}]+\}/,
  `.project-card:hover .project-image { filter: none !important; opacity: 1 !important; transform: scale(1.04); }`
);

css = css.replace(
  /html\.light-mode \.project-image-frame::after\s*\{[^}]+\}/,
  `html.light-mode .project-image-frame::after { inset: 84% 0 0; background: linear-gradient(180deg, transparent, rgba(0, 0, 0, 0.15)); }`
);

fs.writeFileSync("app/globals.css", css, "utf8");
console.log("Updated app/globals.css successfully");
