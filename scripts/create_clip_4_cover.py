import subprocess
import os
from pathlib import Path

WORKSPACE = Path(r"c:\Users\HP\Desktop\clipping")
BIN_FFMPEG = str(WORKSPACE / "bin" / "ffmpeg.exe")
CLIP_SRC = WORKSPACE / "FOLTYN PLAYING GTA 6!!" / "curated_clips" / "Clip_04_Gunfight_Plane_Escape.mp4"
FINAL_DIR = WORKSPACE / "final clips"
COVER_OUT = FINAL_DIR / "Clip_04_Cover_Master.jpg"
RAW_FRAME = WORKSPACE / "output" / "cover_clip4_raw.jpg"

env = os.environ.copy()
env["FONTCONFIG_PATH"] = r"C:\Windows\Fonts"
font_impact = r"C\:/Windows/Fonts/impact.ttf"

# Extract frame at 28.0s (sprinting to the plane with gunfire)
subprocess.run([
    BIN_FFMPEG, "-y", "-ss", "00:00:28.0", "-i", str(CLIP_SRC),
    "-frames:v", "1", "-q:v", "2", str(RAW_FRAME)
], check=True)

# Build vertical 1080x1920 cover image with high-contrast text badges
vf = (
    "split=2[bg][fg];"
    "[bg]scale=270:480:force_original_aspect_ratio=increase,crop=270:480,boxblur=10:2,scale=1080:1920:flags=bilinear[bgblur];"
    "[fg]scale=1080:-1[fgscaled];"
    "[bgblur][fgscaled]overlay=0:(H-h)/2-100,"
    f"drawtext=fontfile='{font_impact}':text='HOW WE ESCAPED GTA 6':fontcolor=yellow:fontsize=70:"
    "box=1:boxcolor=black@0.85:boxborderw=24:x=(w-text_w)/2:y=380,"
    f"drawtext=fontfile='{font_impact}':text='PLANE HIJACK UNDER FIRE! ✈️💀':fontcolor=white:fontsize=50:"
    "box=1:boxcolor=black@0.85:boxborderw=18:x=(w-text_w)/2:y=500"
)

subprocess.run([
    BIN_FFMPEG, "-y", "-i", str(RAW_FRAME),
    "-vf", vf, "-q:v", "2", str(COVER_OUT)
], env=env, check=True)

print(f"[SUCCESS] Created Cover: {COVER_OUT}")
