import numpy as np
from PIL import Image, ImageFilter
import os

img_path = r"C:/Users/bijoy/.gemini/antigravity/brain/f9259d80-5f4a-48a1-a4e2-ea561cfdcf99/.user_uploaded/media_1795118082765_2d028000.jpg"
out_dir = r"C:/Users/bijoy/.gemini/antigravity/brain/f9259d80-5f4a-48a1-a4e2-ea561cfdcf99"

img = Image.open(img_path).convert("RGB")
arr = np.array(img, dtype=np.float32)

# Grayscale brightness (0 = pure black, 255 = pure white)
gray = (arr[:, :, 0] * 0.299 + arr[:, :, 1] * 0.587 + arr[:, :, 2] * 0.114) / 255.0

# 1. Direct replacement: Black becomes Signature Orange (#ff5e2c = 255, 94, 44), White remains White
# If gray = 0 (black), color = (255, 94, 44). If gray = 1 (white), color = (255, 255, 255)
orange_rgb = np.array([255, 94, 44], dtype=np.float32)
white_rgb = np.array([255, 255, 255], dtype=np.float32)

cand1 = np.zeros_like(arr)
for c in range(3):
    cand1[:, :, c] = orange_rgb[c] * (1.0 - gray) + white_rgb[c] * gray
Image.fromarray(np.clip(cand1, 0, 255).astype(np.uint8)).save(os.path.join(out_dir, "cand1_orange_on_white.png"))

# 2. Cyber Dark Theme: Background (white in orig) becomes Website Dark (#080b14 = 8, 11, 20),
# and Foreground (black in orig) becomes Signature Orange (#ff5e2c = 255, 94, 44)
dark_bg = np.array([8, 12, 20], dtype=np.float32)
cand2 = np.zeros_like(arr)
for c in range(3):
    cand2[:, :, c] = orange_rgb[c] * (1.0 - gray) + dark_bg[c] * gray
Image.fromarray(np.clip(cand2, 0, 255).astype(np.uint8)).save(os.path.join(out_dir, "cand2_orange_on_dark.png"))

# 3. Smart Cyber Inverted:
# Let's flood-fill the outer background from (0,0) to separate outer background from inner white highlights!
# Outer background -> Dark website color (#080c14)
# Black hoodie & laptop -> Deep dark cyber with Glowing Orange borders/lines and accents!
# Or: White outer hood -> Crisp white/silver or glowing orange!
# Inner face & laptop -> Dark with vibrant glowing orange accents!
from collections import deque

h, w = gray.shape
is_bg = np.zeros((h, w), dtype=bool)
# BFS flood fill for outer background (pixels with gray > 0.85 connected to border)
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

# With is_bg separated:
# Foreground is where not is_bg.
# In foreground:
# orig black (hoodie, laptop) can be styled with rich cyber black (#0c1020 / #101826) or orange (#ff5e2c)!
# What if the hoodie is Cyber Black (#0d1320), the lines/edges are glowing Orange (#ff5e2c), and the background is dark (#06090e)?
# What if the hoodie is Orange (#ff5e2c), the white outer hood is crisp white (#f0f4fc), visor is glowing cyan or orange, laptop is dark with orange glow?
cand3 = np.zeros((h, w, 3), dtype=np.float32)
# Background
cand3[is_bg] = np.array([8, 12, 20]) # Website dark

# Foreground:
fg_mask = ~is_bg
# Inside foreground:
# gray < 0.2: was black (main hoodie, laptop lid, face mask) -> Vibrant Orange (#ff5e2c)
# gray > 0.8: was white (outer hood, visor, hand highlight) -> Crisp White / Cyber Silver (#ffffff)
for c in range(3):
    # interpolate between orange (for black) and white (for white) inside foreground
    cand3[fg_mask, c] = orange_rgb[c] * (1.0 - gray[fg_mask]) + white_rgb[c] * gray[fg_mask]

Image.fromarray(np.clip(cand3, 0, 255).astype(np.uint8)).save(os.path.join(out_dir, "cand3_isolated_orange_hoodie.png"))

# 4. Premium Dark Cyber Coder:
# Background: Deep dark cyber (#080c14) with subtle radial orange aura glow
# Character:
# Outer hood & visor: Glowing Orange (#ff5e2c)
# Hoodie body & laptop: Deep Obsidian (#111827) with Glowing Orange Edge Inks!
# Let's find edges in the original image using Sobel or diff
from PIL import ImageOps
edge_img = img.convert("L").filter(ImageFilter.FIND_EDGES)
edges = np.array(edge_img, dtype=np.float32) / 255.0

cand4 = np.zeros((h, w, 3), dtype=np.float32)
cand4[:] = np.array([8, 12, 20]) # background

# Character body:
hoodie_mask = fg_mask & (gray < 0.5)
white_hood_mask = fg_mask & (gray >= 0.5)

# Hoodie body in dark graphite/obsidian
cand4[hoodie_mask] = np.array([16, 22, 34])
# Hoodie outer shell in vibrant orange
cand4[white_hood_mask] = np.array([255, 94, 44])

# Visor & laptop glow:
# Edges glowing bright orange / amber
edge_mask = fg_mask & (edges > 0.25)
cand4[edge_mask] = np.array([255, 140, 70])

Image.fromarray(np.clip(cand4, 0, 255).astype(np.uint8)).save(os.path.join(out_dir, "cand4_cyber_obsidian_orange.png"))

print("Generated candidates 1, 2, 3, 4 successfully!")
