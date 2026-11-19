from PIL import Image
import os

artifacts_dir = r"C:/Users/bijoy/.gemini/antigravity/brain/f9259d80-5f4a-48a1-a4e2-ea561cfdcf99"
public_images = r"C:/Users/bijoy/Desktop/Portfolio/public/images"
sentinel_dir = r"C:/Users/bijoy/Desktop/Portfolio/public/projects/sentineledge"
ongoing_def = r"C:/Users/bijoy/Desktop/Portfolio/public/projects/ongoing-default"

for d in [public_images, sentinel_dir, ongoing_def]:
    os.makedirs(d, exist_ok=True)

# Load the crisp, high-contrast dark-theme card (600x800)
dark_card = Image.open(os.path.join(artifacts_dir, "card_dark_bg.png"))
# Also load the white-theme card
white_card = Image.open(os.path.join(artifacts_dir, "card_white_bg.png"))

# Deploy the high-contrast dark card as the master ongoing artwork
dark_card.save(os.path.join(public_images, "ongoing-project-cover.webp"), "WEBP", quality=96)
dark_card.save(os.path.join(public_images, "ongoing-project-cover.png"), "PNG")

# Also save white card in images for admin options
white_card.save(os.path.join(public_images, "ongoing-project-cover-white.webp"), "WEBP", quality=96)
white_card.save(os.path.join(public_images, "ongoing-project-cover-white.png"), "PNG")

# Deploy to SentinelEdge
dark_card.save(os.path.join(sentinel_dir, "01.webp"), "WEBP", quality=96)
dark_card.save(os.path.join(sentinel_dir, "hero.webp"), "WEBP", quality=96)
dark_card.save(os.path.join(sentinel_dir, "01.png"), "PNG")

# Deploy to ongoing-default
dark_card.save(os.path.join(ongoing_def, "01.webp"), "WEBP", quality=96)
dark_card.save(os.path.join(ongoing_def, "hero.webp"), "WEBP", quality=96)
dark_card.save(os.path.join(ongoing_def, "01.png"), "PNG")

print("Deployed high-contrast crisp assets successfully!")
