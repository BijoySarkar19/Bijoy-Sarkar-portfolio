import numpy as np
from PIL import Image, ImageDraw, ImageFilter
import os

orig_path = r"C:/Users/bijoy/.gemini/antigravity/brain/f9259d80-5f4a-48a1-a4e2-ea561cfdcf99/.user_uploaded/media_1795120239203_971c6850.jpg"
public_images = r"C:/Users/bijoy/Desktop/Portfolio/public/images"
artifacts_dir = r"C:/Users/bijoy/.gemini/antigravity/brain/f9259d80-5f4a-48a1-a4e2-ea561cfdcf99"

orig = Image.open(orig_path).convert("RGB")
arr = np.array(orig, dtype=np.float32)
h, w = arr.shape[:2]

gray = (arr[:, :, 0] * 0.299 + arr[:, :, 1] * 0.587 + arr[:, :, 2] * 0.114) / 255.0

min_x, max_x = 25, 703
min_y, max_y = 51, 671

target_w, target_h = 600, 800

pad_x = int((max_x - min_x) * 0.02)
pad_y = int((max_y - min_y) * 0.02)
crop_x0 = max(0, min_x - pad_x)
crop_y0 = max(0, min_y - pad_y)
crop_x1 = min(w, max_x + pad_x)
crop_y1 = min(h, max_y + pad_y)

fig_w = crop_x1 - crop_x0
fig_h = crop_y1 - crop_y0

scale_w = (target_w * 0.96) / float(fig_w)
scale_h = (target_h * 0.94) / float(fig_h)
scale = max(scale_w, scale_h * 0.95)

new_w = int(fig_w * scale)
new_h = int(fig_h * scale)
paste_x = (target_w - new_w) // 2
paste_y = (target_h - new_h) // 2 + 10

darkness = np.clip((0.92 - gray) / 0.85, 0.0, 1.0)

THEME_PRESETS = {
    "orange": ([255, 94, 44], [255, 125, 75], "#ff5e2c"),
    "violet": ([157, 78, 221], [180, 105, 240], "#9d4edd"),
    "blue": ([0, 180, 216], [50, 205, 235], "#00b4d8"),
    "emerald": ([0, 245, 212], [40, 255, 225], "#00f5d4"),
    "red": ([230, 57, 70], [245, 85, 95], "#e63946"),
}

# Generate foreground mask for the coder figure
# Black lines/hoodie -> dark obsidian/black [12, 16, 28] with smooth alpha
# Highlights -> crisp white [255, 255, 255]
v3_arr = np.zeros((h, w, 4), dtype=np.float32)
for y in range(h):
    for x in range(w):
        d = darkness[y, x]
        if d > 0.03:
            if gray[y, x] < 0.45:
                # Dark hoodie / linework / laptop
                v3_arr[y, x] = [10, 14, 24, d * 255.0]
            else:
                # White highlight lines
                v3_arr[y, x] = [255, 255, 255, 255.0]

v3_fg = Image.fromarray(np.clip(v3_arr, 0, 255).astype(np.uint8), mode="RGBA")
v3_cropped = v3_fg.crop((crop_x0, crop_y0, crop_x1, crop_y1))
v3_scaled = v3_cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)

for name, (c1, c2, hex_val) in THEME_PRESETS.items():
    card = Image.new("RGB", (target_w, target_h))
    draw = ImageDraw.Draw(card)
    
    # Smooth vertical gradient in the theme accent color
    for y in range(target_h):
        t = y / float(target_h)
        r = int(c1[0] * (1.0 - t) + c2[0] * t)
        g = int(c1[1] * (1.0 - t) + c2[1] * t)
        b = int(c1[2] * (1.0 - t) + c2[2] * t)
        draw.line([(0, y), (target_w, y)], fill=(r, g, b))
        
    # Paste figure on top
    card.paste(v3_scaled, (paste_x, paste_y), mask=v3_scaled.split()[3])
    
    out_webp = os.path.join(public_images, f"ongoing-project-cover-fullbleed-{name}.webp")
    out_png = os.path.join(public_images, f"ongoing-project-cover-fullbleed-{name}.png")
    card.save(out_webp, "WEBP", quality=98)
    card.save(out_png, "PNG")
    print(f"Generated fullbleed {name} ({hex_val}) -> {out_webp}")

# Also save fullbleed orange to ongoing-project-cover-orange.webp so legacy links to orange theme work
card_orange = Image.open(os.path.join(public_images, "ongoing-project-cover-fullbleed-orange.webp"))
card_orange.save(os.path.join(public_images, "ongoing-project-cover-fullbleed.webp"), "WEBP", quality=98)
print("Done generating all Style 2 full-bleed theme assets!")
