import fs from "fs";

let css = fs.readFileSync("app/globals.css", "utf8");

const target = `@media (max-width: 600px) {\n  .resume-viewer-filename { max-width: 90px; font-size: 10px; }\n}`;

const replacement = `.resume-viewer-filename-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

@media (max-width: 640px) {
  .resume-viewer-head {
    height: auto;
    min-height: auto;
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    padding: 8px 12px;
  }
  .resume-viewer-filename {
    max-width: 100% !important;
    width: 100%;
    font-size: 11.5px;
    font-weight: 600;
    justify-content: flex-start;
    padding-bottom: 6px;
    border-bottom: 1px dashed rgba(255, 255, 255, 0.08);
  }
  .resume-viewer-filename-text {
    overflow: visible;
    white-space: normal;
    word-break: break-all;
  }
  .resume-toolbar-controls {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 4px;
  }
  .resume-page-box {
    padding: 0 6px;
    font-size: 10px;
    height: 26px;
  }
  .resume-zoom-btn {
    width: 26px;
    height: 26px;
  }
  .resume-zoom-input-box {
    height: 26px;
    padding: 0 5px;
  }
}`;

if (!css.includes(target)) {
  console.error("Target not found!");
  process.exit(1);
}

css = css.replace(target, replacement);
fs.writeFileSync("app/globals.css", css, "utf8");
console.log("Updated globals.css successfully!");
