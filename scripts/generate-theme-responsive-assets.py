import numpy as np
from PIL import Image
import os

orig_path = r"C:/Users/bijoy/.gemini/antigravity/brain/f9259d80-5f4a-48a1-a4e2-ea561cfdcf99/.user_uploaded/media_1795120239203_971c6850.jpg"
public_images = r"C:/Users/bijoy/Desktop/Portfolio/public/images"
sentinel_dir = r"C:/Users/bijoy/Desktop/Portfolio/public/projects/sentineledge"
ongoing_def = r"C:/Users/bijoy/Desktop/Portfolio/public/projects/ongoing-default"
artifacts_dir = r"C:/Users/bijoy/.gemini/antigravity/brain/f9259d80-5f4a-48a1-a4e2-ea561cfdcf99"

for d in [public_images, sentinel_dir, ongoing_def]:
    os.makedirs(d, exist_ok=True)

orig = Image.open(orig_path).convert("RGB")
arr = np.array(orig, dtype=np.float32)
h, w = arr.shape[:2]

# Compute gray brightness (0 = pure black line, 1 = pure white background)
gray = (arr[:, :, 0] * 0.299 + arr[:, :, 1] * 0.587 + arr[:, :, 2] * 0.114) / 255.0

# Bounding box of the character
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

# Normalized darkness of original lines/hoodie (0 = white, 1 = black)
darkness = np.clip((0.92 - gray) / 0.85, 0.0, 1.0)

# Generate theme-colored images for all presets
THEME_PRESETS = {
    "orange": ([255, 94, 44], "#ff5e2c"),
    "violet": ([157, 78, 221], "#9d4edd"),
    "blue": ([0, 180, 216], "#00b4d8"),
    "emerald": ([0, 245, 212], "#00f5d4"),
    "red": ([230, 57, 70], "#e63946"),
}

for name, (rgb, hex_val) in THEME_PRESETS.items():
    color = np.array(rgb, dtype=np.float32)
    # White background with color blending
    recolored = np.ones((h, w, 3), dtype=np.float32) * 255.0
    for c in range(3):
        recolored[:, :, c] = 255.0 * (1.0 - darkness) + color[c] * darkness
    
    rec_img = Image.fromarray(np.clip(recolored, 0, 255).astype(np.uint8))
    cropped = rec_img.crop((crop_x0, crop_y0, crop_x1, crop_y1))
    scaled = cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    card = Image.new("RGB", (target_w, target_h), (255, 255, 255))
    card.paste(scaled, (paste_x, paste_y))
    
    # Save preset WEBP and PNG
    out_webp = os.path.join(public_images, f"ongoing-project-cover-{name}.webp")
    out_png = os.path.join(public_images, f"ongoing-project-cover-{name}.png")
    card.save(out_webp, "WEBP", quality=98)
    card.save(out_png, "PNG")
    print(f"Generated preset {name} ({hex_val}) -> {out_webp}")

# Also generate a crisp silhouette mask for real-time CSS dynamic tinting
# In this mask, alpha is darkness: 255 where figure is, 0 where white background is
silhouette = np.zeros((h, w, 4), dtype=np.uint8)
# All pixels in silhouette are solid color with alpha = darkness
silhouette[:, :, 0] = 255
silhouette[:, :, 1] = 255
silhouette[:, :, 2] = 255
silhouette[:, :, 3] = (darkness * 255).astype(np.uint8)

sil_img = Image.fromarray(silhouette, mode="RGBA")
sil_cropped = sil_img.crop((crop_x0, crop_y0, crop_x1, crop_y1))
sil_scaled = sil_cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)

card_sil = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))
card_sil.paste(sil_scaled, (paste_x, paste_y))
card_sil.save(os.path.join(public_images, "ongoing-coder-silhouette.png"), "PNG")
card_sil.save(os.path.join(artifacts_dir, "ongoing-coder-silhouette.png"), "PNG")
print("Generated ongoing-coder-silhouette.png for CSS masking!")
