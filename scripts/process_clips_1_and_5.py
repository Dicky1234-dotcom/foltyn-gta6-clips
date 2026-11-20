import json
import os
import re
import subprocess
from pathlib import Path

WORKSPACE = Path(r"c:\Users\HP\Desktop\clipping")
BIN_FFMPEG = str(WORKSPACE / "bin" / "ffmpeg.exe")
FINAL_DIR = WORKSPACE / "final clips"
FONT_IMPACT = r"C\:/Windows/Fonts/impact.ttf"
SUBS_SRC = WORKSPACE / "FOLTYN PLAYING GTA 6!!" / "subs.en.json3"

env = os.environ.copy()
env["FONTCONFIG_PATH"] = r"C:\Windows\Fonts"

def generate_clip_5_subtitles():
    START_MS = 3344000
    END_MS = 3377000
    ASS_PATH = WORKSPACE / "output" / "clip_05_subtitles.ass"
    
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

def create_clip_5_cover():
    CLIP_SRC = WORKSPACE / "FOLTYN PLAYING GTA 6!!" / "curated_clips" / "Clip_05_Roof_Jump_Physics_Test.mp4"
    COVER_OUT = FINAL_DIR / "Clip_05_Cover_Master.jpg"
    RAW_FRAME = WORKSPACE / "output" / "cover_clip5_raw.jpg"
    
    # Extract frame at 17.5s (mid-air jump / ragdoll impact)
    subprocess.run([
        BIN_FFMPEG, "-y", "-ss", "00:00:17.5", "-i", str(CLIP_SRC),
        "-frames:v", "1", "-q:v", "2", str(RAW_FRAME)
    ], check=True)
    
    vf = (
        "split=2[bg][fg];"
        "[bg]scale=270:480:force_original_aspect_ratio=increase,crop=270:480,boxblur=10:2,scale=1080:1920:flags=bilinear[bgblur];"
        "[fg]scale=1080:-1[fgscaled];"
        "[bgblur][fgscaled]overlay=0:(H-h)/2-100,"
        f"drawtext=fontfile='{FONT_IMPACT}':text='CAN YOU SURVIVE THIS FALL?!':fontcolor=yellow:fontsize=65:"
        "box=1:boxcolor=black@0.85:boxborderw=24:x=(w-text_w)/2:y=380,"
        f"drawtext=fontfile='{FONT_IMPACT}':text='GTA 6 RAGDOLL PHYSICS TEST 💀🏢':fontcolor=white:fontsize=48:"
        "box=1:boxcolor=black@0.85:boxborderw=18:x=(w-text_w)/2:y=500"
    )
    
    subprocess.run([
        BIN_FFMPEG, "-y", "-i", str(RAW_FRAME),
        "-vf", vf, "-q:v", "2", str(COVER_OUT)
    ], env=env, check=True)
    print(f"[SUCCESS] Created Cover: {COVER_OUT}")

def render_clip(clip_id, src_file, ass_file, out_file, hook_text, fontsize):
    print(f"\n==========================================")
    print(f"Rendering Clip {clip_id} WITHOUT MEMES...")
    print(f"==========================================")
    
    fc = (
        "[0:v]split=2[bg][fg];"
        "[bg]scale=270:480:force_original_aspect_ratio=increase,crop=270:480,boxblur=10:2,scale=1080:1920:flags=bilinear[bgblur];"
        "[fg]scale=1080:-1[fgscaled];"
        "[bgblur][fgscaled]overlay=0:(H-h)/2-100[vbase];"
        f"[vbase]drawtext=fontfile='{FONT_IMPACT}':text='{hook_text}':fontcolor=yellow:fontsize={fontsize}:"
        "box=1:boxcolor=black@0.80:boxborderw=18:"
        "x=(w-text_w)/2:y=240:enable='between(t,0,3.5)'[vtitled];"
        f"[vtitled]subtitles='{ass_file}'[vfinal];"
        "[0:a]loudnorm=I=-14:LRA=7:tp=-1.0[afinal]"
    )
    
    cmd = [
        BIN_FFMPEG, "-y", "-nostdin",
        "-i", str(src_file),
        "-filter_complex", fc,
        "-map", "[vfinal]",
        "-map", "[afinal]",
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-crf", "18",
        "-c:a", "aac",
        "-b:a", "192k",
        str(out_file)
    ]
    
    log_file = WORKSPACE / "output" / f"ffmpeg_clip{clip_id}_nomemes.log"
    with open(log_file, "w", encoding="utf-8") as log_f:
        res = subprocess.run(cmd, env=env, stdout=log_f, stderr=subprocess.STDOUT)
        
    if res.returncode == 0:
        mb = out_file.stat().st_size / (1024 * 1024)
        print(f"[SUCCESS] Exported Clip {clip_id}: {out_file} ({mb:.1f} MB)")
    else:
        print(f"[ERROR Clip {clip_id}]: Return code {res.returncode}. Check {log_file}")

if __name__ == "__main__":
    # 1. Render Clip 1 (clean, no memes)
    render_clip(
        1,
        WORKSPACE / "FOLTYN PLAYING GTA 6!!" / "curated_clips" / "Clip_01_Six_Star_Police_Chase.mp4",
        "output/clip_01_subtitles.ass",
        FINAL_DIR / "Clip_01_Six_Star_Police_Chase_TikTok.mp4",
        "HE GOT 6 STARS IN GTA 6?! 💀🚨",
        50
    )
    
    # 2. Subtitles & Cover for Clip 5
    generate_clip_5_subtitles()
    create_clip_5_cover()
    
    # 3. Render Clip 5 (clean, no memes)
    render_clip(
        5,
        WORKSPACE / "FOLTYN PLAYING GTA 6!!" / "curated_clips" / "Clip_05_Roof_Jump_Physics_Test.mp4",
        "output/clip_05_subtitles.ass",
        FINAL_DIR / "Clip_05_Roof_Jump_Physics_Test_TikTok.mp4",
        "CAN YOU SURVIVE THIS FALL IN GTA 6?! 💀🏢",
        46
    )
    
    print("\n[ALL DONE] Clips 1 and 5 completed cleanly.")
