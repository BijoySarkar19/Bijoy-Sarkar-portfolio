import numpy as np
from PIL import Image, ImageFilter, ImageEnhance
import os
from collections import deque

orig_path = r"C:/Users/bijoy/.gemini/antigravity/brain/f9259d80-5f4a-48a1-a4e2-ea561cfdcf99/.user_uploaded/media_1795119796723_0201567f.jpg"
artifacts_dir = r"C:/Users/bijoy/.gemini/antigravity/brain/f9259d80-5f4a-48a1-a4e2-ea561cfdcf99"

orig = Image.open(orig_path).convert("RGB")
arr = np.array(orig, dtype=np.float32)
h, w = arr.shape[:2]

# Compute gray brightness (0 = black, 255 = white)
gray = (arr[:, :, 0] * 0.299 + arr[:, :, 1] * 0.587 + arr[:, :, 2] * 0.114) / 255.0

# ── OPTION 1: Direct 1-to-1 Black -> Orange on White Background ──
# High contrast, pure white background, pure vibrant orange ink (#ff5522)
opt1 = np.zeros((h, w, 3), dtype=np.uint8)
orange_ink = np.array([255, 85, 20], dtype=np.float32) # #ff5514
white_paper = np.array([255, 255, 255], dtype=np.float32)

for c in range(3):
    # linear interpolation between orange ink and white paper
    col = orange_ink[c] * (1.0 - gray) + white_paper[c] * gray
    opt1[:, :, c] = np.clip(col, 0, 255).astype(np.uint8)

Image.fromarray(opt1).save(os.path.join(artifacts_dir, "opt1_orange_ink_on_white.png"))

# ── OPTION 2: High-Contrast Dark Theme (Orange on Deep Dark #080b14) ──
# Flood-fill outer background to isolate it
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

opt2 = np.zeros((h, w, 3), dtype=np.uint8)
dark_bg = np.array([8, 11, 20], dtype=np.float32) # #080b14

# Set background to dark
for c in range(3):
    opt2[:, :, c] = dark_bg[c]

# For character foreground:
# Where it was black (hoodie, laptop, inner shadow) -> PUNCHY GLOWING ORANGE (#ff5e2c)
# Where it was white (outer hood, visor, hands) -> CRISP BRIGHT WHITE (#ffffff)
vibrant_orange = np.array([255, 94, 44], dtype=np.float32)
crisp_white = np.array([255, 255, 255], dtype=np.float32)

fg_pixels = np.zeros((h, w, 3), dtype=np.float32)
for c in range(3):
    fg_pixels[:, :, c] = vibrant_orange[c] * (1.0 - gray) + crisp_white[c] * gray

opt2[fg_mask] = np.clip(fg_pixels[fg_mask], 0, 255).astype(np.uint8)
Image.fromarray(opt2).save(os.path.join(artifacts_dir, "opt2_bold_orange_on_dark.png"))

# ── OPTION 3: Inverted Cyber Neon (Obsidian Hoodie + Glowing Orange Outlines & Visor) ──
# Where it was black in orig -> Deep Obsidian / Dark Slate (#111827)
# Where it was white in orig (outer hood, visor, lines) -> Glowing Neon Orange (#ff6622)
opt3 = np.zeros((h, w, 3), dtype=np.uint8)
for c in range(3):
    opt3[:, :, c] = dark_bg[c]

obsidian = np.array([16, 22, 34], dtype=np.float32)
neon_orange = np.array([255, 100, 30], dtype=np.float32)

fg_pixels3 = np.zeros((h, w, 3), dtype=np.float32)
for c in range(3):
    fg_pixels3[:, :, c] = obsidian[c] * (1.0 - gray) + neon_orange[c] * gray

opt3[fg_mask] = np.clip(fg_pixels3[fg_mask], 0, 255).astype(np.uint8)
Image.fromarray(opt3).save(os.path.join(artifacts_dir, "opt3_cyber_neon_outline.png"))

print("Rendered option 1, 2, 3 successfully!")
