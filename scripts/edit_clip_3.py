import json
import os
import re
import subprocess
from pathlib import Path

WORKSPACE = Path(r"c:\Users\HP\Desktop\clipping")
BIN_FFMPEG = str(WORKSPACE / "bin" / "ffmpeg.exe")
CLIP_SRC = WORKSPACE / "FOLTYN PLAYING GTA 6!!" / "curated_clips" / "Clip_03_Stealth_Takedown_Barber_Banter.mp4"
SUBS_SRC = WORKSPACE / "FOLTYN PLAYING GTA 6!!" / "subs.en.json3"
MEME_DOG = WORKSPACE / "assets" / "reaction_memes" / "dogs" / "side_eye_dog_judging.mp4"
MEME_RUNNING = WORKSPACE / "assets" / "reaction_memes" / "reactions" / "why_are_you_running.mp4"
MEME_DAMAGE = WORKSPACE / "assets" / "reaction_memes" / "reactions" / "emotional_damage.mp4"

FINAL_DIR = WORKSPACE / "final clips"
FINAL_DIR.mkdir(parents=True, exist_ok=True)
OUT_MP4 = FINAL_DIR / "Clip_03_Stealth_Takedown_Barber_Banter_TikTok.mp4"
ASS_PATH = WORKSPACE / "output" / "clip_03_subtitles.ass"

START_MS = 1901000
END_MS = 1950000

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

def render_clip_3():
    generate_ass_subtitles()
    
    env = os.environ.copy()
    env["FONTCONFIG_PATH"] = r"C:\Windows\Fonts"
    font_impact = r"C\:/Windows/Fonts/impact.ttf"
    escaped_ass = "output/clip_03_subtitles.ass"
    
    # Inputs:
    # 0:v - Base Clip (49.0s)
    # 1:v - side_eye_dog (t=2.2 to 5.5) -> colorkey=0x1DFF1B
    # 2:v - why_are_you_running (t=19.0 to 22.5) -> colorkey=0x13FF09
    # 3:v - emotional_damage (t=45.5 to 48.5) -> colorkey=0x13FF07
    
    fc = (
        # 1. Base vertical 9:16 layout (downscale background before blur for 15x faster encode & smooth bokeh)
        "[0:v]split=2[bg][fg];"
        "[bg]scale=270:480:force_original_aspect_ratio=increase,crop=270:480,boxblur=10:2,scale=1080:1920:flags=bilinear[bgblur];"
        "[fg]scale=1080:-1[fgscaled];"
        "[bgblur][fgscaled]overlay=0:(H-h)/2-100[vbase];"
        
        # 2. Hook header banner (first 3.5s)
        f"[vbase]drawtext=fontfile='{font_impact}':text='HE DID NOT LET CHAT ROAST HIS CUT 💀💇‍♂️':fontcolor=yellow:fontsize=46:"
        "box=1:boxcolor=black@0.80:boxborderw=18:"
        "x=(w-text_w)/2:y=240:enable='between(t,0,3.5)'[vtitled];"
        
        # 3. Meme 1: Side-Eye Dog (t=2.2 to 5.5)
        "[1:v]colorkey=0x1DFF1B:0.35:0.10,scale=380:-1[dog_cutout];"
        "[vtitled][dog_cutout]overlay=640:1100:enable='between(t,2.2,5.5)'[vdog];"
        
        # 4. Meme 2: Why Are You Running (t=19.0 to 22.5)
        "[2:v]colorkey=0x13FF09:0.35:0.10,scale=480:-1[running_cutout];"
        "[vdog][running_cutout]overlay=(W-w)/2:1120:enable='between(t,19.0,22.5)'[vrun];"
        
        # 5. Meme 3: Emotional Damage (t=45.5 to 48.5)
        "[3:v]colorkey=0x13FF07:0.35:0.10,scale=500:-1[damage_cutout];"
        "[vrun][damage_cutout]overlay=(W-w)/2:1120:enable='between(t,45.5,48.5)'[vmemes];"
        
        # 6. Safe-zone subtitles
        f"[vmemes]subtitles='{escaped_ass}'[vfinal];"
        
        # 7. Audio mixing
        "[1:a]adelay=2200|2200,volume=1.0[adog];"
        "[2:a]adelay=19000|19000,volume=1.3[arun];"
        "[3:a]adelay=45500|45500,volume=1.4[adamage];"
        "[0:a][adog][arun][adamage]amix=inputs=4:duration=first:dropout_transition=2,"
        "loudnorm=I=-14:LRA=7:tp=-1.0[afinal]"
    )
    
    cmd = [
        BIN_FFMPEG, "-y", "-nostdin",
        "-i", str(CLIP_SRC),
        "-i", str(MEME_DOG),
        "-i", str(MEME_RUNNING),
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
    
    print("\nRendering TikTok Master for Clip 3 into 'final clips'...")
    with open(WORKSPACE / "output" / "ffmpeg_clip3.log", "w", encoding="utf-8") as log_f:
        res = subprocess.run(cmd, env=env, stdout=log_f, stderr=subprocess.STDOUT)
    if res.returncode == 0:
        mb = OUT_MP4.stat().st_size / (1024 * 1024)
        print(f"[SUCCESS] Exported: {OUT_MP4} ({mb:.1f} MB)")
    else:
        print(f"[ERROR]: Return code {res.returncode}. See output/ffmpeg_clip3.log")

if __name__ == "__main__":
    render_clip_3()
