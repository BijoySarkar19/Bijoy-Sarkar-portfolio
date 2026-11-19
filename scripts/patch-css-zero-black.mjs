import fs from "node:fs";

let css = fs.readFileSync("app/globals.css", "utf8");

// Remove any gradient overlay so no black shows on lower parts
css = css.replace(
  /\.project-image-frame::after\s*\{[^}]+\}/,
  `.project-image-frame::after { display: none !important; }`
);

// Ensure .project-image-frame has clean background without black edges
css = css.replace(
  /\.project-image-frame\s*\{ position: relative; aspect-ratio: 3 \/ 4; overflow: hidden; background: [^;]+; \}/,
  `.project-image-frame { position: relative; aspect-ratio: 3 / 4; overflow: hidden; background: #ffffff; }`
);

// Ensure project-image has 100% full coverage, no black borders or filters
css = css.replace(
  /\.project-image\s*\{[^}]+\}/,
  `.project-image { object-fit: cover; width: 100%; height: 100%; filter: none !important; opacity: 1 !important; transform: scale(1.001); transition: transform 700ms cubic-bezier(.2,.7,.2,1); }`
);

fs.writeFileSync("app/globals.css", css, "utf8");
console.log("Updated app/globals.css with clean zero-black-parts styling!");
