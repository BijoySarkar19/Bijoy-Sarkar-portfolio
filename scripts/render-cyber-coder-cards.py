import numpy as np
from PIL import Image, ImageFilter, ImageDraw, ImageFont
import os
from collections import deque

orig_path = r"C:/Users/bijoy/.gemini/antigravity/brain/f9259d80-5f4a-48a1-a4e2-ea561cfdcf99/.user_uploaded/media_1795118082765_2d028000.jpg"
public_dir = r"C:/Users/bijoy/Desktop/Portfolio/public/images"
ongoing_dir = r"C:/Users/bijoy/Desktop/Portfolio/public/projects/ongoing-default"
sentinel_dir = r"C:/Users/bijoy/Desktop/Portfolio/public/projects/sentineledge"
artifacts_dir = r"C:/Users/bijoy/.gemini/antigravity/brain/f9259d80-5f4a-48a1-a4e2-ea561cfdcf99"

for d in [public_dir, ongoing_dir, sentinel_dir]:
    os.makedirs(d, exist_ok=True)

orig = Image.open(orig_path).convert("RGB")
arr = np.array(orig, dtype=np.float32)
h, w = arr.shape[:2]

# Compute gray brightness
gray = (arr[:, :, 0] * 0.299 + arr[:, :, 1] * 0.587 + arr[:, :, 2] * 0.114) / 255.0

# BFS flood fill to isolate outer background from the character
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

# ── Color Palette based on Bijoy's website ──────────────────────
# Signature Orange: #ff5e2c
ORANGE = np.array([255, 94, 44], dtype=np.float32)
BRIGHT_ORANGE = np.array([255, 138, 85], dtype=np.float32)
DEEP_ORANGE = np.array([210, 65, 24], dtype=np.float32)
CYBER_WHITE = np.array([250, 252, 255], dtype=np.float32)
CYBER_BG = np.array([8, 11, 20], dtype=np.float32) # #080b14

# Render transparent RGBA version of the orange coder
# Foreground:
# Black (gray = 0) becomes vibrant orange #ff5e2c
# White (gray = 1) becomes crisp white #ffffff
rgba_coder = np.zeros((h, w, 4), dtype=np.float32)

# Antialiased alpha mask
alpha = np.zeros((h, w), dtype=np.float32)
# Pixels in fg_mask have alpha based on their inverted brightness or boundary
alpha[fg_mask] = 1.0 - (gray[fg_mask] * 0.0) # Full opacity inside figure
# For edge softening:
alpha_img = Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.0))
smooth_alpha = np.array(alpha_img, dtype=np.float32) / 255.0

# RGB calculation
yy, xx = np.mgrid[0:h, 0:w]
gradient_factor = np.clip(1.15 - 0.25 * (yy / float(h)), 0.85, 1.25)[:, :, None]

for c in range(3):
    rgba_coder[fg_mask, c] = (ORANGE[c] * gradient_factor[fg_mask, 0]) * (1.0 - gray[fg_mask]) + CYBER_WHITE[c] * gray[fg_mask]

rgba_coder[:, :, 3] = smooth_alpha

coder_rgba_img = Image.fromarray(np.clip(rgba_coder, 0, 255).astype(np.uint8), mode="RGBA")
coder_rgba_img.save(os.path.join(public_dir, "orange-coder-transparent.png"))
coder_rgba_img.save(os.path.join(artifacts_dir, "orange-coder-transparent.png"))

# ── 1. Create Square 736x736 on Website Dark Theme ─────────────
sq_img = Image.new("RGBA", (w, h), (8, 11, 20, 255))
# Add subtle radial orange aura glow
draw_sq = ImageDraw.Draw(sq_img)
for r in range(300, 50, -20):
    opacity = int(25 * (1.0 - r / 300.0))
    draw_sq.ellipse((w/2 - r, h/2 - r + 30, w/2 + r, h/2 + r + 30), fill=(255, 94, 44, opacity))

sq_img.alpha_composite(coder_rgba_img)
sq_rgb = sq_img.convert("RGB")
sq_rgb.save(os.path.join(public_dir, "orange-coder-square.webp"), "WEBP", quality=92)
sq_rgb.save(os.path.join(public_dir, "orange-coder-square.png"), "PNG")
sq_rgb.save(os.path.join(artifacts_dir, "orange-coder-square.png"))

# ── 2. Create Widescreen 1280x720 Project Card (Card 1: Master Hero) ───────────
card_w, card_h = 1280, 720
card1 = Image.new("RGBA", (card_w, card_h), (8, 11, 20, 255))
draw1 = ImageDraw.Draw(card1)

# Subtle background cyber grid lines
for gx in range(0, card_w, 40):
    draw1.line([(gx, 0), (gx, card_h)], fill=(255, 255, 255, 6), width=1)
for gy in range(0, card_h, 40):
    draw1.line([(0, gy), (card_w, gy)], fill=(255, 255, 255, 6), width=1)

# Ambient orange aura glow behind the coder
for r in range(450, 60, -30):
    op = int(35 * (1.0 - r / 450.0))
    draw1.ellipse((card_w/2 - r, card_h/2 - r + 40, card_w/2 + r, card_h/2 + r + 40), fill=(255, 94, 44, op))

# Scale coder to height 540 and composite in center
scale1 = 540.0 / float(h)
scaled_w1 = int(w * scale1)
scaled_h1 = 540
coder_scaled1 = coder_rgba_img.resize((scaled_w1, scaled_h1), Image.Resampling.LANCZOS)
pos_x1 = (card_w - scaled_w1) // 2
pos_y1 = (card_h - scaled_h1) // 2 + 35

card1.alpha_composite(coder_scaled1, (pos_x1, pos_y1))

# Add Sleek Cyber Header Tag: "⚡ ACTIVE DEVELOPMENT · CURRENTLY WORKING"
# Badge pill at top left
draw1.rounded_rectangle([(48, 40), (360, 78)], radius=8, fill=(15, 23, 38, 220), outline=(255, 94, 44, 140), width=1)
draw1.ellipse([(64, 55), (74, 65)], fill=(255, 94, 44, 255))
# Inner pulse
draw1.ellipse([(61, 52), (77, 68)], outline=(255, 94, 44, 120), width=1)

# Status Badge at top right
draw1.rounded_rectangle([(card_w - 240, 40), (card_w - 48, 78)], radius=8, fill=(15, 23, 38, 220), outline=(37, 53, 82, 180), width=1)

# Corner cyber targeting brackets
b_len = 18
draw1.line([(40, 40), (40 + b_len, 40)], fill=(255, 94, 44, 180), width=2)
draw1.line([(40, 40), (40, 40 + b_len)], fill=(255, 94, 44, 180), width=2)

draw1.line([(card_w - 40, 40), (card_w - 40 - b_len, 40)], fill=(255, 94, 44, 180), width=2)
draw1.line([(card_w - 40, 40), (card_w - 40, 40 + b_len)], fill=(255, 94, 44, 180), width=2)

draw1.line([(40, card_h - 40), (40 + b_len, card_h - 40)], fill=(255, 94, 44, 180), width=2)
draw1.line([(40, card_h - 40), (40, card_h - 40 - b_len)], fill=(255, 94, 44, 180), width=2)

draw1.line([(card_w - 40, card_h - 40), (card_w - 40 - b_len, card_h - 40)], fill=(255, 94, 44, 180), width=2)
draw1.line([(card_w - 40, card_h - 40), (card_w - 40, card_h - 40 - b_len)], fill=(255, 94, 44, 180), width=2)

card1_rgb = card1.convert("RGB")
card1_rgb.save(os.path.join(public_dir, "ongoing-project-cover.webp"), "WEBP", quality=92)
card1_rgb.save(os.path.join(public_dir, "ongoing-project-cover.png"), "PNG")
card1_rgb.save(os.path.join(artifacts_dir, "ongoing-project-cover.png"))

# ── 3. Create Card 2: Workspace Focus (Slight zoom & telemetry overlay) ─────────
card2 = Image.new("RGBA", (card_w, card_h), (8, 11, 20, 255))
draw2 = ImageDraw.Draw(card2)
for gx in range(0, card_w, 40): draw2.line([(gx, 0), (gx, card_h)], fill=(255, 255, 255, 6), width=1)
for gy in range(0, card_h, 40): draw2.line([(0, gy), (card_w, gy)], fill=(255, 255, 255, 6), width=1)
for r in range(400, 50, -30):
    op = int(30 * (1.0 - r / 400.0))
    draw2.ellipse((card_w*0.4 - r, card_h/2 - r + 20, card_w*0.4 + r, card_h/2 + r + 20), fill=(255, 94, 44, op))

# Larger coder placed slightly to the left
scale2 = 590.0 / float(h)
scaled_w2 = int(w * scale2)
scaled_h2 = 590
coder_scaled2 = coder_rgba_img.resize((scaled_w2, scaled_h2), Image.Resampling.LANCZOS)
card2.alpha_composite(coder_scaled2, (80, card_h - scaled_h2 + 20))

# Right telemetry cards
draw2.rounded_rectangle([(card_w - 480, 120), (card_w - 60, 240)], radius=10, fill=(15, 23, 38, 220), outline=(37, 53, 82, 180), width=1)
draw2.rounded_rectangle([(card_w - 480, 260), (card_w - 60, 420)], radius=10, fill=(15, 23, 38, 220), outline=(255, 94, 44, 120), width=1)
draw2.rounded_rectangle([(card_w - 480, 440), (card_w - 60, 580)], radius=10, fill=(15, 23, 38, 220), outline=(37, 53, 82, 180), width=1)

card2_rgb = card2.convert("RGB")
card2_rgb.save(os.path.join(public_dir, "ongoing-project-detail.webp"), "WEBP", quality=92)
card2_rgb.save(os.path.join(public_dir, "ongoing-project-detail.png"), "PNG")
card2_rgb.save(os.path.join(artifacts_dir, "ongoing-project-detail.png"))

# ── 4. Create Card 3: Terminal Architecture & Dark Minimalist ──────────────────
card3 = Image.new("RGBA", (card_w, card_h), (6, 9, 16, 255))
draw3 = ImageDraw.Draw(card3)
# Central warm orange bloom
for r in range(500, 40, -25):
    op = int(40 * (1.0 - r / 500.0))
    draw3.ellipse((card_w/2 - r, card_h/2 - r + 30, card_w/2 + r, card_h/2 + r + 30), fill=(255, 94, 44, op))

scale3 = 520.0 / float(h)
scaled_w3 = int(w * scale3)
scaled_h3 = 520
coder_scaled3 = coder_rgba_img.resize((scaled_w3, scaled_h3), Image.Resampling.LANCZOS)
card3.alpha_composite(coder_scaled3, ((card_w - scaled_w3) // 2, (card_h - scaled_h3) // 2 + 40))

card3_rgb = card3.convert("RGB")
card3_rgb.save(os.path.join(public_dir, "ongoing-project-terminal.webp"), "WEBP", quality=92)
card3_rgb.save(os.path.join(public_dir, "ongoing-project-terminal.png"), "PNG")
card3_rgb.save(os.path.join(artifacts_dir, "ongoing-project-terminal.png"))

# ── 5. Copy/Save directly to public/projects/ongoing-default and public/projects/sentineledge
for target_dir in [ongoing_dir, sentinel_dir]:
    card1_rgb.save(os.path.join(target_dir, "01.webp"), "WEBP", quality=92)
    card1_rgb.save(os.path.join(target_dir, "hero.webp"), "WEBP", quality=92)
    card1_rgb.save(os.path.join(target_dir, "01.png"), "PNG")
    
    card2_rgb.save(os.path.join(target_dir, "02.webp"), "WEBP", quality=92)
    card2_rgb.save(os.path.join(target_dir, "02.png"), "PNG")
    
    card3_rgb.save(os.path.join(target_dir, "03.webp"), "WEBP", quality=92)
    card3_rgb.save(os.path.join(target_dir, "03.png"), "PNG")

print("All cyber orange coder artwork generated and deployed to public/images and public/projects!")
