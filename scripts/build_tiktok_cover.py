from PIL import Image, ImageDraw, ImageFont, ImageFilter
from pathlib import Path

WORKSPACE = Path(r"c:\Users\HP\Desktop\clipping")
INPUT_FRAME = WORKSPACE / "output" / "covers" / "cover_02_six_stars_shocked_cat.jpg"
OUTPUT_COVER = WORKSPACE / "output" / "covers" / "TIKTOK_COVER_MASTER.jpg"
OUTPUT_ALT = WORKSPACE / "output" / "covers" / "TIKTOK_COVER_ARREST.jpg"
INPUT_ARREST = WORKSPACE / "output" / "covers" / "cover_04_arrest_climax.jpg"

def create_viral_cover(bg_path, out_path, headline_1, headline_2, badge_text, badge_color):
    img = Image.open(bg_path).convert("RGBA")
    w, h = img.size
    
    # Create overlay layer
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    
    # 1. Subtle cinematic vignette darkening top and bottom
    for y in range(0, 360):
        alpha = int(180 * (1.0 - y / 360.0))
        draw.line([(0, y), (w, y)], fill=(0, 0, 0, alpha))
        
    for y in range(h - 400, h):
        alpha = int(210 * ((y - (h - 400)) / 400.0))
        draw.line([(0, y), (w, y)], fill=(0, 0, 0, alpha))
        
    # Red / Blue subtle police light tint at corners
    for r in range(250):
        alpha = int(45 * (1.0 - r / 250.0))
        draw.ellipse([(-50, -50), (250, 250)], outline=(255, 30, 30, alpha), width=3)
        draw.ellipse([(w - 250, -50), (w + 50, 250)], outline=(30, 120, 255, alpha), width=3)

    # 2. Main Title Banner in the Profile Grid Safe Zone (Y: 820 to 1100)
    font_badge = ImageFont.truetype(r"C:\Windows\Fonts\impact.ttf", 46)
    font_main = ImageFont.truetype(r"C:\Windows\Fonts\impact.ttf", 86)
    font_sub = ImageFont.truetype(r"C:\Windows\Fonts\impact.ttf", 68)
    
    # Draw top pill badge
    badge_w = draw.textlength(badge_text, font=font_badge)
    bx0 = (w - badge_w) / 2 - 24
    by0 = 800
    bx1 = bx0 + badge_w + 48
    by1 = by0 + 64
    draw.rounded_rectangle([bx0, by0, bx1, by1], radius=16, fill=badge_color)
    draw.text(((w - badge_w) / 2, by0 + 4), badge_text, font=font_badge, fill=(255, 255, 255, 255))
    
    # Background card for headlines
    card_y0 = by1 + 16
    card_y1 = card_y0 + 200
    draw.rounded_rectangle([60, card_y0, w - 60, card_y1], radius=24, fill=(12, 14, 18, 220), outline=(255, 220, 0, 180), width=4)
    
    # Draw Headline 1 (Yellow)
    h1_w = draw.textlength(headline_1, font=font_main)
    h1_x = (w - h1_w) / 2
    h1_y = card_y0 + 12
    # Shadow
    draw.text((h1_x + 4, h1_y + 4), headline_1, font=font_main, fill=(0, 0, 0, 240))
    draw.text((h1_x, h1_y), headline_1, font=font_main, fill=(255, 230, 0, 255))
    
    # Draw Headline 2 (White)
    h2_w = draw.textlength(headline_2, font=font_sub)
    h2_x = (w - h2_w) / 2
    h2_y = h1_y + 92
    draw.text((h2_x + 4, h2_y + 4), headline_2, font=font_sub, fill=(0, 0, 0, 240))
    draw.text((h2_x, h2_y), headline_2, font=font_sub, fill=(255, 255, 255, 255))
    
    # Merge and save
    final_img = Image.alpha_composite(img, overlay).convert("RGB")
    final_img.save(out_path, "JPEG", quality=95)
    print(f"Created Cover: {out_path}")

if __name__ == "__main__":
    create_viral_cover(
        INPUT_FRAME,
        OUTPUT_COVER,
        "6 STARS IN GTA 6?!",
        "COPS SWARMED HIM 💀",
        "🚨 VICE CITY POLICE 🚨",
        (220, 30, 30, 255)
    )
    
    create_viral_cover(
        INPUT_ARREST,
        OUTPUT_ALT,
        "HE GOT BUSTED! 😭",
        "THE ARREST WAS CRAZY",
        "💀 EMOTIONAL DAMAGE 💀",
        (200, 20, 20, 255)
    )
