import sys
import os
import json
import time
import pymupdf

def generate_pages(pdf_path="public/Bijoy_Sarkar_CV.pdf", out_dir="public/cv-pages"):
    if not os.path.isabs(pdf_path):
        pdf_path = os.path.join(os.getcwd(), pdf_path)
    if not os.path.isabs(out_dir):
        out_dir = os.path.join(os.getcwd(), out_dir)

    if not os.path.exists(pdf_path):
        print(f"Error: {pdf_path} not found")
        sys.exit(1)

    os.makedirs(out_dir, exist_ok=True)
    doc = pymupdf.open(pdf_path)
    page_count = len(doc)
    pages = []

    for i, page in enumerate(doc):
        # 180 DPI provides high crispness without huge file size
        pix = page.get_pixmap(dpi=180)
        img_name = f"page-{i+1}.png"
        img_path = os.path.join(out_dir, img_name)
        pix.save(img_path)
        pages.append(f"/cv-pages/{img_name}")

    # Clean up any leftover pages if previous PDF had more pages
    existing_files = os.listdir(out_dir)
    for f in existing_files:
        if f.startswith("page-") and f.endswith(".png"):
            try:
                p_num = int(f.replace("page-", "").replace(".png", ""))
                if p_num > page_count:
                    os.remove(os.path.join(out_dir, f))
            except ValueError:
                pass

    manifest = {
        "filename": os.path.basename(pdf_path),
        "pageCount": page_count,
        "pages": pages,
        "updatedAt": int(time.time() * 1000)
    }

    manifest_path = os.path.join(out_dir, "manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    print(f"Generated {page_count} pages for {pdf_path} -> {manifest_path}")

if __name__ == "__main__":
    target_pdf = sys.argv[1] if len(sys.argv) > 1 else "public/Bijoy_Sarkar_CV.pdf"
    generate_pages(target_pdf)
