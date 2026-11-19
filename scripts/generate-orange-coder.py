import numpy as np
from PIL import Image, ImageFilter, ImageEnhance
import os
from collections import deque

img_path = r"C:/Users/bijoy/.gemini/antigravity/brain/f9259d80-5f4a-48a1-a4e2-ea561cfdcf99/.user_uploaded/media_1795118082765_2d028000.jpg"
out_dir = r"C:/Users/bijoy/.gemini/antigravity/brain/f9259d80-5f4a-48a1-a4e2-ea561cfdcf99"

orig = Image.open(img_path).convert("RGB")
arr = np.array(orig, dtype=np.float32)
h, w = arr.shape[:2]

# Grayscale brightness: 0.0 (pure black) to 1.0 (pure white)
gray = (arr[:, :, 0] * 0.299 + arr[:, :, 1] * 0.587 + arr[:, :, 2] * 0.114) / 255.0

# Isolate outer background from figure
is_bg = np.zeros((h, w), dtype=bool)
queue = deque()
for x in range(w):
    if gray[0, x] > 0.8: queue.append((0, x))
    if gray[h-1, x] > 0.8: queue.append((h-1, x))
for y in range(h):
    if gray[y, 0] > 0.8: queue.append((y, 0))
    if gray[y, w-1] > 0.8: queue.append((y, w-1))

for y, x in queue:
    is_bg[y, x] = True

while queue:
    cy, cx = queue.popleft()
    for dy, dx in [(-1,0), (1,0), (0,-1), (0,1)]:
        ny, nx = cy + dy, cx + dx
        if 0 <= ny < h and 0 <= nx < w and not is_bg[ny, nx] and gray[ny, nx] > 0.85:
            is_bg[ny, nx] = True
            queue.append((ny, nx))

fg_mask = ~is_bg

# Style 1: Signature Orange Hoodie Coder on Dark Cyber Background
# The website color: #ff5e2c (255, 94, 44)
# What was black (torso, laptop, inner hood) -> #ff5e2c with shading and highlights
# What was white (outer hood, visor, laptop keyboard) -> White / Ice Cyan (#ffffff / #e2e8f0)
# Background -> Deep Cyber (#080c14) with subtle radial orange aura glow
out1 = np.zeros((h, w, 3), dtype=np.float32)

# Create radial gradient on background
yy, xx = np.mgrid[0:h, 0:w]
dist_center = np.sqrt((xx - w/2)**2 + (yy - h/2)**2) / (w * 0.5)
dist_norm = np.clip(dist_center, 0.0, 1.0)

bg_glow = np.zeros((h, w, 3), dtype=np.float32)
for c, (val_center, val_edge) in enumerate([(18, 8), (14, 10), (28, 16)]):
    bg_glow[:, :, c] = val_center * (1.0 - dist_norm) + val_edge * dist_norm

# Add warm orange ambient aura near the coder
aura = np.exp(-((xx - w*0.48)**2 + (yy - h*0.52)**2) / (2 * (w*0.35)**2))
bg_glow[:, :, 0] += aura * 45
bg_glow[:, :, 1] += aura * 16
bg_glow[:, :, 2] += aura * 6

out1[:] = bg_glow

# For foreground pixels:
# Black (gray = 0) becomes vibrant orange #ff5e2c
# White (gray = 1) becomes crisp white #ffffff
orange = np.array([255, 94, 44], dtype=np.float32)
bright_orange = np.array([255, 130, 80], dtype=np.float32)
dark_orange = np.array([195, 50, 18], dtype=np.float32)
white = np.array([255, 255, 255], dtype=np.float32)

# Gradient orange depending on y (subtle lighting)
y_grad = np.clip(yy / float(h), 0.0, 1.0)[:, :, None]
fg_orange = orange * (1.1 - 0.2 * y_grad)

fg_pixels = np.zeros((h, w, 3), dtype=np.float32)
for c in range(3):
    fg_pixels[:, :, c] = fg_orange[:, :, c] * (1.0 - gray) + white[c] * gray

# Blend foreground with antialiasing at edges
out1[fg_mask] = fg_pixels[fg_mask]

# Save style 1
res1 = Image.fromarray(np.clip(out1, 0, 255).astype(np.uint8))
res1.save(os.path.join(out_dir, "style1_orange_coder_darkbg.png"))

# Style 2: Cyber Neon Inverted Linework (where black lines/blocks become vibrant glowing orange line art on obsidian)
# Invert the original: black becomes bright, white becomes dark
inverted_gray = 1.0 - gray
# Mask only foreground
inv_fg = np.zeros((h, w), dtype=np.float32)
inv_fg[fg_mask] = inverted_gray[fg_mask]

out2 = np.zeros((h, w, 3), dtype=np.float32)
out2[:] = bg_glow
# Apply fiery neon palette
out2[fg_mask, 0] = np.clip(bg_glow[fg_mask, 0] + inv_fg[fg_mask] * 255, 0, 255)
out2[fg_mask, 1] = np.clip(bg_glow[fg_mask, 1] + inv_fg[fg_mask] * 94, 0, 255)
out2[fg_mask, 2] = np.clip(bg_glow[fg_mask, 2] + inv_fg[fg_mask] * 44, 0, 255)

# Visor & highlights in white/cyan
visor_mask = fg_mask & (gray > 0.9)
out2[visor_mask] = np.array([240, 248, 255])

res2 = Image.fromarray(np.clip(out2, 0, 255).astype(np.uint8))
res2.save(os.path.join(out_dir, "style2_neon_orange_linework.png"))

# Style 3: Widescreen 1280x720 Project Showcase Card (The exact format used for project preview cards!)
# Centered coder figure with cyberpunk HUD telemetry frame, matching the portfolio's active development aesthetics!
card_w, card_h = 1280, 720
card = np.zeros((card_h, card_w, 3), dtype=np.float32)

# Deep cyber background gradient
cy_y, cy_x = np.mgrid[0:card_h, 0:card_w]
card_dist = np.sqrt((cy_x - card_w/2)**2 + (cy_y - card_h/2)**2) / (card_w * 0.5)
card[:, :, 0] = 8 + 12 * (1.0 - np.clip(card_dist, 0, 1))
card[:, :, 1] = 11 + 10 * (1.0 - np.clip(card_dist, 0, 1))
card[:, :, 2] = 20 + 8 * (1.0 - np.clip(card_dist, 0, 1))

# Add radial orange glow behind the coder
aura_card = np.exp(-((cy_x - card_w/2)**2 + (cy_y - card_h*0.52)**2) / (2 * (260)**2))
card[:, :, 0] += aura_card * 75
card[:, :, 1] += aura_card * 25
card[:, :, 2] += aura_card * 10

# Scale coder to fit nicely in 720h (e.g. 580h)
target_h = 560
scale = target_h / float(h)
target_w = int(w * scale)

coder_resized = res1.resize((target_w, target_h), Image.Resampling.LANCZOS)
coder_arr = np.array(coder_resized, dtype=np.float32)

# Overlay in the center of the card
offset_x = (card_w - target_w) // 2
offset_y = (card_h - target_h) // 2 + 30

# Also create transparent mask so background blends seamlessly
mask_resized = Image.fromarray((fg_mask * 255).astype(np.uint8)).resize((target_w, target_h), Image.Resampling.LANCZOS)
mask_arr = np.array(mask_resized, dtype=np.float32) / 255.0

for c in range(3):
    card[offset_y:offset_y+target_h, offset_x:offset_x+target_w, c] = (
        coder_arr[:, :, c] * mask_arr + card[offset_y:offset_y+target_h, offset_x:offset_x+target_w, c] * (1.0 - mask_arr)
    )

res3 = Image.fromarray(np.clip(card, 0, 255).astype(np.uint8))
res3.save(os.path.join(out_dir, "style3_widescreen_project_card.png"))

print("Generated style 1, 2, and 3 successfully!")
