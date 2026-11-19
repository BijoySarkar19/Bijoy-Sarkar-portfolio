from PIL import Image
import os

artifacts_dir = r"C:/Users/bijoy/.gemini/antigravity/brain/f9259d80-5f4a-48a1-a4e2-ea561cfdcf99"
public_images = r"C:/Users/bijoy/Desktop/Portfolio/public/images"
sentinel_dir = r"C:/Users/bijoy/Desktop/Portfolio/public/projects/sentineledge"
ongoing_def = r"C:/Users/bijoy/Desktop/Portfolio/public/projects/ongoing-default"

for d in [public_images, sentinel_dir, ongoing_def]:
    os.makedirs(d, exist_ok=True)

# Master image: v1_fullbox_white_bg.png
# Completely covers the 3:4 box with zero black parts in upper, lower, sides, corners!
img = Image.open(os.path.join(artifacts_dir, "v1_fullbox_white_bg.png")).convert("RGB")

# 1. Deploy to public/images
img.save(os.path.join(public_images, "ongoing-project-cover.webp"), "WEBP", quality=98)
img.save(os.path.join(public_images, "ongoing-project-cover.png"), "PNG")
img.save(os.path.join(public_images, "ongoing-project-cover-white.webp"), "WEBP", quality=98)
img.save(os.path.join(public_images, "ongoing-project-cover-white.png"), "PNG")

# 2. Deploy to SentinelEdge
img.save(os.path.join(sentinel_dir, "01.webp"), "WEBP", quality=98)
img.save(os.path.join(sentinel_dir, "hero.webp"), "WEBP", quality=98)
img.save(os.path.join(sentinel_dir, "01.png"), "PNG")

# 3. Deploy to ongoing-default
img.save(os.path.join(ongoing_def, "01.webp"), "WEBP", quality=98)
img.save(os.path.join(ongoing_def, "hero.webp"), "WEBP", quality=98)
img.save(os.path.join(ongoing_def, "01.png"), "PNG")

# Also deploy v3 fullbox orange
v3_img = Image.open(os.path.join(artifacts_dir, "v3_fullbox_orange_bg.png")).convert("RGB")
v3_img.save(os.path.join(public_images, "ongoing-project-cover-orange.webp"), "WEBP", quality=98)

print("Master full-box artwork deployed to all target paths successfully!")
