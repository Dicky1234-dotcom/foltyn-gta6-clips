import json
import os
import re
import subprocess
from pathlib import Path

WORKSPACE = Path(r"c:\Users\HP\Desktop\clipping")
BIN_FFMPEG = str(WORKSPACE / "bin" / "ffmpeg.exe")
CLIP_SRC = WORKSPACE / "FOLTYN PLAYING GTA 6!!" / "curated_clips" / "Clip_04_Gunfight_Plane_Escape.mp4"
SUBS_SRC = WORKSPACE / "FOLTYN PLAYING GTA 6!!" / "subs.en.json3"

FINAL_DIR = WORKSPACE / "final clips"
FINAL_DIR.mkdir(parents=True, exist_ok=True)
OUT_MP4 = FINAL_DIR / "Clip_04_Gunfight_Plane_Escape_TikTok.mp4"
ASS_PATH = WORKSPACE / "output" / "clip_04_subtitles.ass"

START_MS = 2117000
END_MS = 2161000

def generate_ass_subtitles():
    with open(SUBS_SRC, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    events = data.get("events", [])
    dialogues = []
    
    for ev in events:
        t = ev.get("tStartMs", 0)
        dur = ev.get("dDurationMs", 0)
        if t >= START_MS - 500 and t <= END_MS:
            rel_start = max(0.0, (t - START_MS) / 1000.0)
            rel_end = (t + dur - START_MS) / 1000.0
            segs = ev.get("segs", [])
            txt = "".join([s.get("utf8", "") for s in segs]).replace("\n", " ").strip()
            txt = re.sub(r'>>\s*', '', txt)
            txt = re.sub(r'\[.*?\]', '', txt).strip()
            if txt:
                dialogues.append((rel_start, rel_end, txt))
                
    ass_header = """[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: TikTok,Impact,54,&H00FFFFFF,&H0000FFFF,&H00000000,&H80000000,-1,0,0,0,100,100,1,0,1,6,3,2,40,40,420,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    ass_lines = []
    for s_start, s_end, text in dialogues:
        words = text.split()
        if not words:
            continue
        chunk_size = 3
        chunk_count = (len(words) + chunk_size - 1) // chunk_size
        chunk_dur = (s_end - s_start) / max(1, chunk_count)
        
        for idx in range(chunk_count):
            c_words = words[idx*chunk_size : (idx+1)*chunk_size]
            c_text = " ".join(c_words).upper()
            w_start = s_start + idx * chunk_dur
            w_end = s_start + (idx + 1) * chunk_dur
            
            def fmt_time(sec):
                m = int(sec // 60)
                s = int(sec % 60)
                cs = int(round((sec - int(sec)) * 100))
                return f"{m//60:01d}:{m%60:02d}:{s:02d}.{cs:02d}"
                
            ass_lines.append(f"Dialogue: 0,{fmt_time(w_start)},{fmt_time(w_end)},TikTok,,0,0,0,,{c_text}")

    with open(ASS_PATH, "w", encoding="utf-8") as f:
        f.write(ass_header + "\n".join(ass_lines))
    print(f"Generated {len(ass_lines)} subtitle frames at {ASS_PATH}")

def render_clip_4():
    generate_ass_subtitles()
    
    env = os.environ.copy()
    env["FONTCONFIG_PATH"] = r"C:\Windows\Fonts"
    font_impact = r"C\:/Windows/Fonts/impact.ttf"
    escaped_ass = "output/clip_04_subtitles.ass"
    
    # Filter graph: NO MEMES (as requested by user)
    # 1. 9:16 vertical layout (downscaled background for fast bokeh blur)
    # 2. Hook header banner (0 to 3.5s)
    # 3. Synchronized Safe-zone Subtitles
    # 4. Normalized -14 LUFS Audio
    
    fc = (
        "[0:v]split=2[bg][fg];"
        "[bg]scale=270:480:force_original_aspect_ratio=increase,crop=270:480,boxblur=10:2,scale=1080:1920:flags=bilinear[bgblur];"
        "[fg]scale=1080:-1[fgscaled];"
        "[bgblur][fgscaled]overlay=0:(H-h)/2-100[vbase];"
        
        f"[vbase]drawtext=fontfile='{font_impact}':text='HOW WE ESCAPED IN GTA 6 ✈️💀🔥':fontcolor=yellow:fontsize=48:"
        "box=1:boxcolor=black@0.80:boxborderw=18:"
        "x=(w-text_w)/2:y=240:enable='between(t,0,3.5)'[vtitled];"
        
        f"[vtitled]subtitles='{escaped_ass}'[vfinal];"
        
        "[0:a]loudnorm=I=-14:LRA=7:tp=-1.0[afinal]"
    )
    
    cmd = [
        BIN_FFMPEG, "-y", "-nostdin",
        "-i", str(CLIP_SRC),
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
    
    print("\nRendering TikTok Master for Clip 4 (NO MEMES) into 'final clips'...")
    log_file = WORKSPACE / "output" / "ffmpeg_clip4.log"
    with open(log_file, "w", encoding="utf-8") as log_f:
        res = subprocess.run(cmd, env=env, stdout=log_f, stderr=subprocess.STDOUT)
        
    if res.returncode == 0:
        mb = OUT_MP4.stat().st_size / (1024 * 1024)
        print(f"[SUCCESS] Exported: {OUT_MP4} ({mb:.1f} MB)")
    else:
        print(f"[ERROR]: Return code {res.returncode}. Check {log_file}")

if __name__ == "__main__":
    render_clip_4()
