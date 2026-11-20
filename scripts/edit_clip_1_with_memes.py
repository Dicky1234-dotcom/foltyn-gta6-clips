import json
import os
import re
import subprocess
from pathlib import Path

WORKSPACE = Path(r"c:\Users\HP\Desktop\clipping")
BIN_FFMPEG = str(WORKSPACE / "bin" / "ffmpeg.exe")
CLIP_SRC = WORKSPACE / "FOLTYN PLAYING GTA 6!!" / "curated_clips" / "Clip_01_Six_Star_Police_Chase.mp4"
MEME_CAT = WORKSPACE / "assets" / "reaction_memes" / "cats" / "shocked_cat.mp4"
MEME_DAMAGE = WORKSPACE / "assets" / "reaction_memes" / "reactions" / "emotional_damage.mp4"

OUT_DIR = WORKSPACE / "output"
OUT_DIR.mkdir(parents=True, exist_ok=True)
OUT_MP4 = OUT_DIR / "Clip_01_Six_Star_Police_Chase_Meme_TikTok.mp4"
ASS_PATH = OUT_DIR / "clip_01_subtitles.ass"

def render_vertical_clip_with_memes():
    env = os.environ.copy()
    env["FONTCONFIG_PATH"] = r"C:\Windows\Fonts"
    
    font_impact = r"C\:/Windows/Fonts/impact.ttf"
    escaped_ass = "output/clip_01_subtitles.ass"
    
    # Combined filter_complex:
    fc = (
        # 1. Base vertical 9:16 layout
        "[0:v]split=2[bg][fg];"
        "[bg]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=25:5[bgblur];"
        "[fg]scale=1080:-1[fgscaled];"
        "[bgblur][fgscaled]overlay=0:(H-h)/2-100[vbase];"
        
        # 2. Hook header banner (first 3.5s)
        f"[vbase]drawtext=fontfile='{font_impact}':text='HE GOT 6 STARS IN GTA 6?! 💀🚨':fontcolor=yellow:fontsize=50:"
        "box=1:boxcolor=black@0.80:boxborderw=18:"
        "x=(w-text_w)/2:y=240:enable='between(t,0,3.5)'[vtitled];"
        
        # 3. Meme 1: Shocked Cat (chromakey green out, overlay at t=28.5 to 32.2)
        "[1:v]colorkey=0x10E20D:0.35:0.10,scale=380:-1[cat_cutout];"
        "[vtitled][cat_cutout]overlay=660:1100:enable='between(t,28.5,32.2)'[vcat];"
        
        # 4. Meme 2: Emotional Damage (chromakey green out, overlay at t=53.5 to 56.7)
        "[2:v]colorkey=0x13FF07:0.35:0.10,scale=540:-1[damage_cutout];"
        "[vcat][damage_cutout]overlay=(W-w)/2:1120:enable='between(t,53.5,56.7)'[vmemes];"
        
        # 5. Safe-zone subtitles
        f"[vmemes]subtitles='{escaped_ass}'[vfinal];"
        
        # 6. Audio delay & mix
        "[1:a]adelay=28500|28500,volume=1.2[acat];"
        "[2:a]adelay=53500|53500,volume=1.4[adamage];"
        "[0:a][acat][adamage]amix=inputs=3:duration=first:dropout_transition=2,"
        "loudnorm=I=-14:LRA=7:tp=-1.0[afinal]"
    )
    
    cmd = [
        BIN_FFMPEG, "-y",
        "-i", str(CLIP_SRC),
        "-i", str(MEME_CAT),
        "-i", str(MEME_DAMAGE),
        "-filter_complex", fc,
        "-map", "[vfinal]",
        "-map", "[afinal]",
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-crf", "18",
        "-c:a", "aac",
        "-b:a", "192k",
        str(OUT_MP4)
    ]
    
    print("Rendering TikTok Meme Master with audio sync & chromakeying...")
    res = subprocess.run(cmd, env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, encoding="utf-8", errors="replace")
    if res.returncode == 0:
        mb = OUT_MP4.stat().st_size / (1024 * 1024)
        print(f"[SUCCESS] Exported: {OUT_MP4} ({mb:.1f} MB)")
    else:
        print(f"[ERROR]: {res.stderr[:600]}")

if __name__ == "__main__":
    render_vertical_clip_with_memes()
