import numpy as np
from PIL import Image, ImageFilter, ImageDraw
import os
from collections import deque

orig_path = r"C:/Users/bijoy/.gemini/antigravity/brain/f9259d80-5f4a-48a1-a4e2-ea561cfdcf99/.user_uploaded/media_1795119796723_0201567f.jpg"
artifacts_dir = r"C:/Users/bijoy/.gemini/antigravity/brain/f9259d80-5f4a-48a1-a4e2-ea561cfdcf99"

orig = Image.open(orig_path).convert("RGB")
arr = np.array(orig, dtype=np.float32)
h, w = arr.shape[:2]

# Compute gray brightness: 0.0 (pure black) to 1.0 (pure white)
gray = (arr[:, :, 0] * 0.299 + arr[:, :, 1] * 0.587 + arr[:, :, 2] * 0.114) / 255.0

# 1. CRISP BOLD ORANGE ON WHITE (#ffffff background, #ff5514 vibrant bold orange ink)
# Linear mapping with enhanced contrast
# Contrast curve on gray: make darks darker, lights lighter
gamma_gray = np.clip(gray ** 1.1, 0.0, 1.0)
vibrant_orange = np.array([255, 85, 18], dtype=np.float32) # #ff5512
white_paper = np.array([255, 255, 255], dtype=np.float32)

crisp_white_bg = np.zeros((h, w, 3), dtype=np.uint8)
for c in range(3):
    col = vibrant_orange[c] * (1.0 - gamma_gray) + white_paper[c] * gamma_gray
    crisp_white_bg[:, :, c] = np.clip(col, 0, 255).astype(np.uint8)

Image.fromarray(crisp_white_bg).save(os.path.join(artifacts_dir, "crisp_orange_on_white.png"))

# 2. CRISP BOLD ORANGE ON DARK (#080b14 background)
# Isolate outer background
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

# For dark background:
# We want MAXIMUM CLARITY AND CONTRAST.
# Background: #080b14 (Dark cyber)
# Outer hood outline & details: BOLD VIBRANT ORANGE #ff5e2c
# Outer hood fill: Pure White #ffffff or Light Cyber Slate #e2e8f0
# Inside hood & face mask: Deep Charcoal #0c121e with Glowing Neon Visor
# Torso & Hoodie: BOLD VIBRANT ORANGE #ff5e2c with bright highlights
# Laptop: Deep Charcoal #0d1524 with BOLD ORANGE Glowing screen border & keys
# Hands: White typing on keys
crisp_dark_bg = np.zeros((h, w, 3), dtype=np.uint8)
dark_canvas = np.array([8, 11, 20], dtype=np.float32)
for c in range(3):
    crisp_dark_bg[:, :, c] = dark_canvas[c]

# For foreground pixels:
# What was black in original (torso, laptop body, shadows) -> VIBRANT BLAZING ORANGE (#ff5e2c)
# What was white in original (hood highlight, visor, hands) -> CRISP WHITE (#ffffff)
electric_orange = np.array([255, 94, 44], dtype=np.float32)
neon_white = np.array([255, 255, 255], dtype=np.float32)

fg_col = np.zeros((h, w, 3), dtype=np.float32)
for c in range(3):
    fg_col[:, :, c] = electric_orange[c] * (1.0 - gamma_gray) + neon_white[c] * gamma_gray

crisp_dark_bg[fg_mask] = np.clip(fg_col[fg_mask], 0, 255).astype(np.uint8)
Image.fromarray(crisp_dark_bg).save(os.path.join(artifacts_dir, "crisp_orange_on_dark.png"))

# 3. CARD FORMAT (600 x 800 — perfectly matching 3:4 aspect ratio of .project-image-frame!)
# No letterboxing, no zooming cut-off, razor sharp!
# Let's create both White BG and Dark BG in 600x800:
for name, source_img in [("card_white_bg", crisp_white_bg), ("card_dark_bg", crisp_dark_bg)]:
    card_w, card_h = 600, 800
    bg_color = (255, 255, 255) if "white" in name else (8, 11, 20)
    card = Image.new("RGB", (card_w, card_h), bg_color)
    
    # Scale figure to fit cleanly with nice padding inside 600x800
    scale = 560.0 / float(h)
    new_w = int(w * scale)
    new_h = int(h * scale)
    
    src_pil = Image.fromarray(source_img)
    resized_fig = src_pil.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    offset_x = (card_w - new_w) // 2
    offset_y = (card_h - new_h) // 2 + 10
    
    card.paste(resized_fig, (offset_x, offset_y))
    card.save(os.path.join(artifacts_dir, f"{name}.png"))

print("Crisp artwork and cards created successfully!")
