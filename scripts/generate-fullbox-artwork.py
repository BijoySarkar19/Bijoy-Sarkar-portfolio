import numpy as np
from PIL import Image, ImageFilter, ImageDraw
import os
from collections import deque

orig_path = r"C:/Users/bijoy/.gemini/antigravity/brain/f9259d80-5f4a-48a1-a4e2-ea561cfdcf99/.user_uploaded/media_1795120239203_971c6850.jpg"
artifacts_dir = r"C:/Users/bijoy/.gemini/antigravity/brain/f9259d80-5f4a-48a1-a4e2-ea561cfdcf99"
public_images = r"C:/Users/bijoy/Desktop/Portfolio/public/images"
sentinel_dir = r"C:/Users/bijoy/Desktop/Portfolio/public/projects/sentineledge"
ongoing_def = r"C:/Users/bijoy/Desktop/Portfolio/public/projects/ongoing-default"

for d in [public_images, sentinel_dir, ongoing_def]:
    os.makedirs(d, exist_ok=True)

orig = Image.open(orig_path).convert("RGB")
arr = np.array(orig, dtype=np.float32)
h, w = arr.shape[:2]

# Compute gray brightness (0 = black, 1 = white)
gray = (arr[:, :, 0] * 0.299 + arr[:, :, 1] * 0.587 + arr[:, :, 2] * 0.114) / 255.0

# Find bounding box of the figure (dark pixels)
min_x, max_x, min_y, max_y = w, 0, h, 0
for y in range(h):
    for x in range(w):
        if gray[y, x] < 0.92:
            if x < min_x: min_x = x
            if x > max_x: max_x = x
            if y < min_y: min_y = y
            if y > max_y: max_y = y

print(f"Bounding box: x=[{min_x}, {max_x}], y=[{min_y}, {max_y}], w={max_x-min_x}, h={max_y-min_y}")

# Portfolio signature orange: #ff5e2c
ORANGE = np.array([255, 94, 44], dtype=np.float32)
ORANGE_DARK = np.array([220, 68, 25], dtype=np.float32)
ORANGE_LIGHT = np.array([255, 140, 95], dtype=np.float32)

# ==============================================================================
# VARIANT 1: Clean White Background, Bold Vibrant Orange Coder, 100% Covers Box
# Zero black parts in upper, lower, sides, corners! Pure crisp white background.
# ==============================================================================
target_w, target_h = 600, 800 # 3:4 aspect ratio matching .project-image-frame

# Recolor the original 736x736:
# Where gray < 0.5 (black hoodie, lines, laptop) -> vibrant ORANGE [255, 94, 44]
# Where gray >= 0.5 -> pure WHITE [255, 255, 255]
# Smooth interpolation for anti-aliased linework
recolored_white_bg = np.ones((h, w, 3), dtype=np.float32) * 255.0

# Normalize darkness: 1 = pure black line/hoodie, 0 = pure white background
darkness = np.clip((0.92 - gray) / 0.85, 0.0, 1.0)
for c in range(3):
    # Blend from white (255) to orange (ORANGE[c])
    recolored_white_bg[:, :, c] = 255.0 * (1.0 - darkness) + ORANGE[c] * darkness

recolored_white_img = Image.fromarray(np.clip(recolored_white_bg, 0, 255).astype(np.uint8))

# Now tightly crop to bounding box with just 2% margin so it covers the full box!
pad_x = int((max_x - min_x) * 0.02)
pad_y = int((max_y - min_y) * 0.02)
crop_x0 = max(0, min_x - pad_x)
crop_y0 = max(0, min_y - pad_y)
crop_x1 = min(w, max_x + pad_x)
crop_y1 = min(h, max_y + pad_y)

cropped_figure = recolored_white_img.crop((crop_x0, crop_y0, crop_x1, crop_y1))
fig_w, fig_h = cropped_figure.size

# We want the figure to cover the full box of 600x800!
# Scale figure so its width covers almost the entire 600 width (e.g. 580px wide)
# and centers vertically so the hood is at the top, laptop at the bottom
scale_w = (target_w * 0.96) / float(fig_w)
scale_h = (target_h * 0.94) / float(fig_h)
scale = max(scale_w, scale_h * 0.95)

new_w = int(fig_w * scale)
new_h = int(fig_h * scale)
scaled_figure = cropped_figure.resize((new_w, new_h), Image.Resampling.LANCZOS)

card_v1 = Image.new("RGB", (target_w, target_h), (255, 255, 255))
# Paste centered horizontally, aligned near bottom/middle
paste_x = (target_w - new_w) // 2
paste_y = (target_h - new_h) // 2 + 10
card_v1.paste(scaled_figure, (paste_x, paste_y))

v1_path = os.path.join(artifacts_dir, "v1_fullbox_white_bg.png")
card_v1.save(v1_path, "PNG")
print("Saved v1_fullbox_white_bg.png")

# ==============================================================================
# VARIANT 2: Edge-to-Edge Zoomed (Coder completely fills all 4 corners & edges)
# ==============================================================================
# Zoom in so the coder's hood reaches the top edge, laptop touches the bottom,
# and elbows touch the left and right edges!
scale_zoom = max(target_w / float(fig_w), target_h / float(fig_h)) * 1.08
zoom_w = int(fig_w * scale_zoom)
zoom_h = int(fig_h * scale_zoom)
zoomed_figure = cropped_figure.resize((zoom_w, zoom_h), Image.Resampling.LANCZOS)

card_v2 = Image.new("RGB", (target_w, target_h), (255, 255, 255))
zoom_paste_x = (target_w - zoom_w) // 2
zoom_paste_y = (target_h - zoom_h) // 2
card_v2.paste(zoomed_figure, (zoom_paste_x, zoom_paste_y))

v2_path = os.path.join(artifacts_dir, "v2_edge_to_edge_zoom.png")
card_v2.save(v2_path, "PNG")
print("Saved v2_edge_to_edge_zoom.png")

# ==============================================================================
# VARIANT 3: Full-Bleed Vibrant Orange Theme (Website Color covers entire box)
# Orange gradient background from #ff5e2c to #ff7d4d covering all 4 corners!
# Zero black parts on upper, lower, sides, corners!
# ==============================================================================
card_v3 = Image.new("RGB", (target_w, target_h))
draw_v3 = ImageDraw.Draw(card_v3)
for y in range(target_h):
    factor = y / float(target_h)
    r = int(255)
    g = int(94 + factor * 25)
    b = int(44 + factor * 20)
    draw_v3.line([(0, y), (target_w, y)], fill=(r, g, b))

# In this variant, the linework and hoodie can be crisp black/white contrast over the full orange background
# Where original is black -> deep dark indigo/black [10, 15, 26] or crisp white
# Where original is white -> transparent / the orange background
v3_arr = np.zeros((h, w, 4), dtype=np.float32)
# The coder character mask
for y in range(h):
    for x in range(w):
        d = darkness[y, x]
        if d > 0.05:
            # Figure pixel: dark linework or visor
            if gray[y, x] < 0.4:
                # Black hoodie/laptop -> dark sleek obsidian
                v3_arr[y, x] = [15, 20, 32, d * 255.0]
            else:
                # White highlight -> crisp white
                v3_arr[y, x] = [255, 255, 255, 255.0]

v3_fg_img = Image.fromarray(np.clip(v3_arr, 0, 255).astype(np.uint8), mode="RGBA")
v3_cropped = v3_fg_img.crop((crop_x0, crop_y0, crop_x1, crop_y1))
v3_scaled = v3_cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)

card_v3.paste(v3_scaled, (paste_x, paste_y), mask=v3_scaled.split()[3])
v3_path = os.path.join(artifacts_dir, "v3_fullbox_orange_bg.png")
card_v3.save(v3_path, "PNG")
print("Saved v3_fullbox_orange_bg.png")
