import json
import os
import re
import subprocess
from pathlib import Path

WORKSPACE = Path(r"c:\Users\HP\Desktop\clipping")
BIN_FFMPEG = str(WORKSPACE / "bin" / "ffmpeg.exe")
CLIP_SRC = WORKSPACE / "FOLTYN PLAYING GTA 6!!" / "curated_clips" / "Clip_01_Six_Star_Police_Chase.mp4"
TRANSCRIPT_SRC = WORKSPACE / "FOLTYN PLAYING GTA 6!!" / "clean_transcript.json"

FINAL_DIR = WORKSPACE / "final clips"
OUT_MP4 = FINAL_DIR / "Clip_01_Six_Star_Police_Chase_TikTok.mp4"
ASS_PATH = WORKSPACE / "output" / "clip_01_rules_subtitles.ass"

FONT_IMPACT = r"C\:/Windows/Fonts/impact.ttf"

env = os.environ.copy()
env["FONTCONFIG_PATH"] = r"C:\Windows\Fonts"

START_SEC = 819.0
END_SEC = 878.5

def generate_clean_ass():
    with open(TRANSCRIPT_SRC, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    dialogues = []
    for d in data:
        t_start = d["start"]
        t_end = d["end"]
        if t_start >= START_SEC - 1.0 and t_start <= END_SEC:
            rel_start = max(0.0, t_start - START_SEC)
            rel_end = min(59.5, t_end - START_SEC)
            txt = d["text"].strip()
            txt = re.sub(r'>>\s*', '', txt)
            txt = re.sub(r'\[.*?\]', '', txt).strip()
            if txt and rel_end > rel_start:
                dialogues.append((rel_start, rel_end, txt))
                
    ass_header = """[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: TikTok,Impact,54,&H00FFFFFF,&H0000FFFF,&H00000000,&H80000000,-1,0,0,0,100,100,1,0,1,6,3,2,40,40,420,1
Style: TikTokHighlight,Impact,56,&H0000FFFF,&H00FFFFFF,&H00000000,&H80000000,-1,0,0,0,105,105,1,0,1,6,3,2,40,40,420,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    ass_lines = []
    
    # Highlight keywords in yellow (&H0000FFFF&)
    KEYWORDS = ["SIX STARS", "STARS", "ARRESTED", "CAUGHT", "SHOOTING", "COPS", "RUN", "DEAD", "INSANE", "CRAZY"]
    
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
            
            # Check for keyword highlighting
            style = "TikTok"
            for kw in KEYWORDS:
                if kw in c_text:
                    c_text = c_text.replace(kw, f"{{\\c&H0000FFFF&}}{kw}{{\\c&H00FFFFFF&}}")
                    style = "TikTokHighlight"
                    break
            
            def fmt_time(sec):
                m = int(sec // 60)
                s = int(sec % 60)
                cs = int(round((sec - int(sec)) * 100))
                return f"{m//60:01d}:{m%60:02d}:{s:02d}.{cs:02d}"
                
            ass_lines.append(f"Dialogue: 0,{fmt_time(w_start)},{fmt_time(w_end)},{style},,0,0,0,,{c_text}")

    with open(ASS_PATH, "w", encoding="utf-8") as f:
        f.write(ass_header + "\n".join(ass_lines))
    print(f"Generated {len(ass_lines)} non-overlapping subtitles at {ASS_PATH}")

def render_clip_1():
    generate_clean_ass()
    escaped_ass = "output/clip_01_rules_subtitles.ass"
    
    # Dynamic Timeline Zoom intervals (1.20x punch-ins for attention reset every 3-5s):
    # 1. t=10.5 to 14.5 ("Where do I go?! Lose the cops!")
    # 2. t=28.0 to 33.5 ("Look top right! There's six stars!")
    # 3. t=40.5 to 45.5 ("They're shooting me Lucia! Run!")
    # 4. t=52.0 to 57.5 ("We're caught! Officer please!")
    punch_condition = "between(t,10.5,14.5)+between(t,28.0,33.5)+between(t,40.5,45.5)+between(t,52.0,57.5)"
    
    # Facecam PIP spotlight intervals:
    # High-emotion moments where Foltyn's face is enlarged in the upper zone:
    # t=28.0 to 32.5 (Six stars reaction) & t=52.5 to 57.0 (Arrest scream)
    facecam_condition = "between(t,28.0,32.5)+between(t,52.5,57.0)"
    
    fc = (
        # 1. Background Blur (Rule 1: downscaled 270x480 boxblur for fast bokeh)
        "[0:v]split=3[bg][fg_raw][face_raw];"
        "[bg]scale=270:480:force_original_aspect_ratio=increase,crop=270:480,boxblur=10:2,scale=1080:1920:flags=bilinear[bgblur];"
        
        # 2. Foreground wide vs punch-in zoom (Rule 4: Visual Resets 1.2x)
        "[fg_raw]split=2[fg_normal][fg_punch_src];"
        "[fg_normal]scale=1080:608[fg_wide];"
        "[fg_punch_src]crop=1600:900:160:90,scale=1080:608[fg_punch];"
        
        # 3. Dynamic overlay for visual resets: wide when normal, punched when high-action
        f"[bgblur][fg_wide]overlay=0:(H-h)/2-100:enable='not({punch_condition})'[vstep1];"
        f"[vstep1][fg_punch]overlay=0:(H-h)/2-100:enable='{punch_condition}'[vstep2];"
        
        # 4. Facecam Spotlight (Rule 4: Facecam Focus)
        # Crop Foltyn's facecam (0,0,480,270), scale to 540x304 with border, place at upper third
        "[face_raw]crop=480:270:0:0,scale=540:304,drawbox=x=0:y=0:w=540:h=304:color=yellow@0.9:t=5[facecam];"
        f"[vstep2][facecam]overlay=(W-w)/2:200:enable='{facecam_condition}'[vstep3];"
        
        # 5. Retention Hook Header (Rule 2: Centered at y=240, Impact yellow 50pt, 80% black box, active 0 to 3.5s)
        f"[vstep3]drawtext=fontfile='{FONT_IMPACT}':text='HE GOT 6 STARS IN GTA 6?! 💀🚨':fontcolor=yellow:fontsize=50:"
        "box=1:boxcolor=black@0.80:boxborderw=18:"
        "x=(w-text_w)/2:y=240:enable='between(t,0,3.5)'[vtitled];"
        
        # 6. Safe-Zone Subtitles (Rule 3: MarginV=420, Impact 54, 2-3 words, safe zone)
        f"[vtitled]subtitles='{escaped_ass}'[vfinal];"
        
        # 7. Audio Normalization (Rule 1: Platform standard -14 LUFS)
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
    
    print("\n==========================================")
    print("Rendering Clip 1 strictly according to ALL rules...")
    print(f"Output: {OUT_MP4}")
    print("==========================================")
    
    log_file = WORKSPACE / "output" / "ffmpeg_clip1_rules.log"
    with open(log_file, "w", encoding="utf-8") as log_f:
        res = subprocess.run(cmd, env=env, stdout=log_f, stderr=subprocess.STDOUT)
        
    if res.returncode == 0:
        mb = OUT_MP4.stat().st_size / (1024 * 1024)
        print(f"[SUCCESS] Exported Clip 1 Master: {OUT_MP4} ({mb:.1f} MB)")
    else:
        print(f"[ERROR]: Return code {res.returncode}. See {log_file}")

if __name__ == "__main__":
    render_clip_1()
