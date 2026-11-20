import subprocess
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

WORKSPACE = Path(r"c:\Users\HP\Desktop\clipping")
BIN_FFMPEG = str(WORKSPACE / "bin" / "ffmpeg.exe")
CLIP_SRC = WORKSPACE / "FOLTYN PLAYING GTA 6!!" / "curated_clips" / "Clip_03_Stealth_Takedown_Barber_Banter.mp4"
FINAL_DIR = WORKSPACE / "final clips"
FINAL_DIR.mkdir(parents=True, exist_ok=True)
RAW_FRAME = WORKSPACE / "output" / "covers" / "cover_clip3_raw.jpg"
COVER_OUT = FINAL_DIR / "Clip_03_Cover_Master.jpg"

def build_cover():
    cmd = [
        BIN_FFMPEG, "-y",
        "-ss", "00:00:20.500",
        "-i", str(CLIP_SRC),
        "-vframes", "1",
        "-q:v", "2",
        str(RAW_FRAME)
    ]
    subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    
    img = Image.open(RAW_FRAME).convert("RGBA")
    w, h = img.size
    
    # Scale to 9:16 vertical 1080x1920 with blurred backdrop
    # Create background by scaling to cover and blurring
    bg = img.resize((1080, 1920), Image.Resampling.LANCZOS)
    from PIL import ImageFilter
    bg = bg.filter(ImageFilter.GaussianBlur(radius=25))
    
    # Foreground centered
    fg = img.resize((1080, 608), Image.Resampling.LANCZOS)
    bg.paste(fg, (0, (1920 - 608) // 2 - 100))
    
    overlay = Image.new("RGBA", (1080, 1920), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    
    # Top and bottom vignette
    for y in range(0, 360):
        draw.line([(0, y), (1080, y)], fill=(0, 0, 0, int(180 * (1.0 - y / 360.0))))
    for y in range(1920 - 400, 1920):
        draw.line([(0, y), (1080, y)], fill=(0, 0, 0, int(210 * ((y - (1920 - 400)) / 400.0))))
        
    font_badge = ImageFont.truetype(r"C:\Windows\Fonts\impact.ttf", 44)
    font_main = ImageFont.truetype(r"C:\Windows\Fonts\impact.ttf", 80)
    font_sub = ImageFont.truetype(r"C:\Windows\Fonts\impact.ttf", 62)
    
    badge_text = "💇‍♂️ STREAMER REVENGE 💇‍♂️"
    badge_w = draw.textlength(badge_text, font=font_badge)
    bx0 = (1080 - badge_w) / 2 - 24
    by0 = 800
    bx1 = bx0 + badge_w + 48
    by1 = by0 + 64
    draw.rounded_rectangle([bx0, by0, bx1, by1], radius=16, fill=(180, 30, 190, 255))
    draw.text(((1080 - badge_w) / 2, by0 + 4), badge_text, font=font_badge, fill=(255, 255, 255, 255))
    
    card_y0 = by1 + 16
    card_y1 = card_y0 + 200
    draw.rounded_rectangle([50, card_y0, 1080 - 50, card_y1], radius=24, fill=(12, 14, 18, 225), outline=(255, 220, 0, 180), width=4)
    
    h1 = "CHAT ROASTED HIS CUT 💀"
    h1_w = draw.textlength(h1, font=font_main)
    draw.text(((1080 - h1_w) / 2 + 4, card_y0 + 16), h1, font=font_main, fill=(0, 0, 0, 240))
    draw.text(((1080 - h1_w) / 2, card_y0 + 12), h1, font=font_main, fill=(255, 230, 0, 255))
    
    h2 = "HE TOOK REVENGE ON NPC 😭"
    h2_w = draw.textlength(h2, font=font_sub)
    draw.text(((1080 - h2_w) / 2 + 4, card_y0 + 106), h2, font=font_sub, fill=(0, 0, 0, 240))
    draw.text(((1080 - h2_w) / 2, card_y0 + 102), h2, font=font_sub, fill=(255, 255, 255, 255))
    
    final_img = Image.alpha_composite(bg, overlay).convert("RGB")
    final_img.save(COVER_OUT, "JPEG", quality=95)
    print(f"Generated: {COVER_OUT}")

if __name__ == "__main__":
    build_cover()
