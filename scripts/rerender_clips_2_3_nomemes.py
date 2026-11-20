import os
import subprocess
from pathlib import Path

WORKSPACE = Path(r"c:\Users\HP\Desktop\clipping")
BIN_FFMPEG = str(WORKSPACE / "bin" / "ffmpeg.exe")
FINAL_DIR = WORKSPACE / "final clips"
FONT_IMPACT = r"C\:/Windows/Fonts/impact.ttf"

env = os.environ.copy()
env["FONTCONFIG_PATH"] = r"C:\Windows\Fonts"

CLIPS = [
    {
        "id": 2,
        "src": WORKSPACE / "FOLTYN PLAYING GTA 6!!" / "curated_clips" / "Clip_02_First_Time_Driving_Chaos.mp4",
        "ass": "output/clip_02_subtitles.ass",
        "out": FINAL_DIR / "Clip_02_First_Time_Driving_Chaos_TikTok.mp4",
        "hook": "BRO CANNOT DRIVE IN GTA 6 💀🚗",
        "fontsize": 48
    },
    {
        "id": 3,
        "src": WORKSPACE / "FOLTYN PLAYING GTA 6!!" / "curated_clips" / "Clip_03_Stealth_Takedown_Barber_Banter.mp4",
        "ass": "output/clip_03_subtitles.ass",
        "out": FINAL_DIR / "Clip_03_Stealth_Takedown_Barber_Banter_TikTok.mp4",
        "hook": "HE DID NOT LET CHAT ROAST HIS CUT 💀💇‍♂️",
        "fontsize": 46
    }
]

def render_clip(item):
    print(f"\n==========================================")
    print(f"Re-rendering Clip {item['id']} WITHOUT MEMES...")
    print(f"==========================================")
    
    fc = (
        "[0:v]split=2[bg][fg];"
        "[bg]scale=270:480:force_original_aspect_ratio=increase,crop=270:480,boxblur=10:2,scale=1080:1920:flags=bilinear[bgblur];"
        "[fg]scale=1080:-1[fgscaled];"
        "[bgblur][fgscaled]overlay=0:(H-h)/2-100[vbase];"
        f"[vbase]drawtext=fontfile='{FONT_IMPACT}':text='{item['hook']}':fontcolor=yellow:fontsize={item['fontsize']}:"
        "box=1:boxcolor=black@0.80:boxborderw=18:"
        "x=(w-text_w)/2:y=240:enable='between(t,0,3.5)'[vtitled];"
        f"[vtitled]subtitles='{item['ass']}'[vfinal];"
        "[0:a]loudnorm=I=-14:LRA=7:tp=-1.0[afinal]"
    )
    
    cmd = [
        BIN_FFMPEG, "-y", "-nostdin",
        "-i", str(item["src"]),
        "-filter_complex", fc,
        "-map", "[vfinal]",
        "-map", "[afinal]",
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-crf", "18",
        "-c:a", "aac",
        "-b:a", "192k",
        str(item["out"])
    ]
    
    log_file = WORKSPACE / "output" / f"ffmpeg_clip{item['id']}_nomemes.log"
    with open(log_file, "w", encoding="utf-8") as log_f:
        res = subprocess.run(cmd, env=env, stdout=log_f, stderr=subprocess.STDOUT)
        
    if res.returncode == 0:
        mb = item["out"].stat().st_size / (1024 * 1024)
        print(f"[SUCCESS] Exported Clip {item['id']}: {item['out']} ({mb:.1f} MB)")
    else:
        print(f"[ERROR Clip {item['id']}]: Return code {res.returncode}. Check {log_file}")

if __name__ == "__main__":
    for c in CLIPS:
        render_clip(c)
    print("\n[ALL DONE] Clips 2 and 3 re-rendered with NO MEMES.")
