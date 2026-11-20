import json
import os
import re
import subprocess
from pathlib import Path

WORKSPACE = Path(r"c:\Users\HP\Desktop\clipping")
BIN_FFMPEG = str(WORKSPACE / "bin" / "ffmpeg.exe")
SUBS_SRC = WORKSPACE / "FOLTYN PLAYING GTA 6!!" / "subs.en.json3"
FINAL_DIR = WORKSPACE / "final clips"
FINAL_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR = WORKSPACE / "output"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

FONT_IMPACT = r"C\:/Windows/Fonts/impact.ttf"

env = os.environ.copy()
env["FONTCONFIG_PATH"] = r"C:\Windows\Fonts"

CLIPS = [
    {
        "id": "06",
        "raw_file": "Clip_06_Florida_Crocodile_Encounter.mp4",
        "out_file": "Clip_06_Florida_Crocodile_Encounter_TikTok.mp4",
        "cover_file": "Clip_06_Cover_Master.jpg",
        "start_ms": 1678000,
        "end_ms": 1723000,
        "hook": "FOUND A REAL ALLIGATOR IN GTA 6?! 🐊💀",
        "hook_size": 46,
        "cover_time": "00:00:10.0",
        "cover_top": "FOUND AN ALLIGATOR IN GTA 6?! 🐊",
        "cover_sub": "LEONIDA SWAMP WILDLIFE 💀"
    },
    {
        "id": "07",
        "raw_file": "Clip_07_NPC_Rizz_Rejection.mp4",
        "out_file": "Clip_07_NPC_Rizz_Rejection_TikTok.mp4",
        "cover_file": "Clip_07_Cover_Master.jpg",
        "start_ms": 3478000,
        "end_ms": 3525000,
        "hook": "BRO GOT REJECTED BY A GTA 6 NPC 😭💀",
        "hook_size": 46,
        "cover_time": "00:00:16.0",
        "cover_top": "BRO GOT REJECTED BY AN NPC 😭",
        "cover_sub": "GTA 6 AI IS TOO REAL 💀"
    },
    {
        "id": "08",
        "raw_file": "Clip_08_Road_Rage_Red_Lights.mp4",
        "out_file": "Clip_08_Road_Rage_Red_Lights_TikTok.mp4",
        "cover_file": "Clip_08_Cover_Master.jpg",
        "start_ms": 2910000,
        "end_ms": 2962000,
        "hook": "AVERAGE GTA 6 DRIVER ROAD RAGE 💀🚗💨",
        "hook_size": 46,
        "cover_time": "00:00:18.0",
        "cover_top": "AVERAGE GTA 6 DRIVER 💀🚗",
        "cover_sub": "RUNNING EVERY RED LIGHT 💨"
    },
    {
        "id": "09",
        "raw_file": "Clip_09_Street_Brawl_Fight_NPC.mp4",
        "out_file": "Clip_09_Street_Brawl_Fight_NPC_TikTok.mp4",
        "cover_file": "Clip_09_Cover_Master.jpg",
        "start_ms": 3418000,
        "end_ms": 3468000,
        "hook": "HE PICKED A FIGHT WITH THE WRONG NPC 💀🥊",
        "hook_size": 44,
        "cover_time": "00:00:22.0",
        "cover_top": "WRONG NPC TO MESS WITH 💀🥊",
        "cover_sub": "GTA 6 STREET BRAWL TEST"
    },
    {
        "id": "10",
        "raw_file": "Clip_10_Miami_Vice_City_Graphics_Reaction.mp4",
        "out_file": "Clip_10_Miami_Vice_City_Graphics_Reaction_TikTok.mp4",
        "cover_file": "Clip_10_Cover_Master.jpg",
        "start_ms": 1152000,
        "end_ms": 1198000,
        "hook": "GTA 6 GRAPHICS ARE ACTUALLY UNREAL 🌴🔥",
        "hook_size": 46,
        "cover_time": "00:00:12.0",
        "cover_top": "GTA 6 GRAPHICS ARE UNREAL 🌴",
        "cover_sub": "MIAMI VICE CITY SKYLINE 🔥"
    }
]

def generate_ass(clip_meta):
    start_ms = clip_meta["start_ms"]
    end_ms = clip_meta["end_ms"]
    ass_path = OUTPUT_DIR / f"clip_{clip_meta['id']}_subtitles.ass"
    
    with open(SUBS_SRC, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    events = data.get("events", [])
    dialogues = []
    
    for ev in events:
        t = ev.get("tStartMs", 0)
        dur = ev.get("dDurationMs", 0)
        if t >= start_ms - 500 and t <= end_ms:
            rel_start = max(0.0, (t - start_ms) / 1000.0)
            rel_end = (t + dur - start_ms) / 1000.0
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

    with open(ass_path, "w", encoding="utf-8") as f:
        f.write(ass_header + "\n".join(ass_lines))
    print(f"Generated {len(ass_lines)} subtitles for Clip {clip_meta['id']} at {ass_path}")
    return ass_path

def generate_cover(clip_meta):
    src_clip = WORKSPACE / "FOLTYN PLAYING GTA 6!!" / "curated_clips" / clip_meta["raw_file"]
    cover_out = FINAL_DIR / clip_meta["cover_file"]
    raw_frame = OUTPUT_DIR / f"cover_{clip_meta['id']}_raw.jpg"
    
    # 1. Extract raw frame
    subprocess.run([
        BIN_FFMPEG, "-y", "-ss", clip_meta["cover_time"], "-i", str(src_clip),
        "-frames:v", "1", "-q:v", "2", str(raw_frame)
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    
    # 2. Build 1080x1920 cover image with title card
    vf = (
        "split=2[bg][fg];"
        "[bg]scale=270:480:force_original_aspect_ratio=increase,crop=270:480,boxblur=10:2,scale=1080:1920:flags=bilinear[bgblur];"
        "[fg]scale=1080:-1[fgscaled];"
        "[bgblur][fgscaled]overlay=0:(H-h)/2-100,"
        f"drawtext=fontfile='{FONT_IMPACT}':text='{clip_meta['cover_top']}':fontcolor=yellow:fontsize=65:"
        "box=1:boxcolor=black@0.85:boxborderw=24:x=(w-text_w)/2:y=380,"
        f"drawtext=fontfile='{FONT_IMPACT}':text='{clip_meta['cover_sub']}':fontcolor=white:fontsize=48:"
        "box=1:boxcolor=black@0.85:boxborderw=18:x=(w-text_w)/2:y=500"
    )
    
    subprocess.run([
        BIN_FFMPEG, "-y", "-i", str(raw_frame),
        "-vf", vf, "-q:v", "2", str(cover_out)
    ], env=env, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f"Created Cover: {cover_out}")

def render_vertical(clip_meta):
    src_clip = WORKSPACE / "FOLTYN PLAYING GTA 6!!" / "curated_clips" / clip_meta["raw_file"]
    out_mp4 = FINAL_DIR / clip_meta["out_file"]
    ass_path = OUTPUT_DIR / f"clip_{clip_meta['id']}_subtitles.ass"
    escaped_ass = f"output/clip_{clip_meta['id']}_subtitles.ass"
    
    print(f"\n==========================================")
    print(f"Rendering Master for Clip {clip_meta['id']} (NO MEMES)...")
    print(f"Output: {out_mp4}")
    print(f"==========================================")
    
    fc = (
        "[0:v]split=2[bg][fg];"
        "[bg]scale=270:480:force_original_aspect_ratio=increase,crop=270:480,boxblur=10:2,scale=1080:1920:flags=bilinear[bgblur];"
        "[fg]scale=1080:-1[fgscaled];"
        "[bgblur][fgscaled]overlay=0:(H-h)/2-100[vbase];"
        f"[vbase]drawtext=fontfile='{FONT_IMPACT}':text='{clip_meta['hook']}':fontcolor=yellow:fontsize={clip_meta['hook_size']}:"
        "box=1:boxcolor=black@0.80:boxborderw=18:"
        "x=(w-text_w)/2:y=240:enable='between(t,0,3.5)'[vtitled];"
        f"[vtitled]subtitles='{escaped_ass}'[vfinal];"
        "[0:a]loudnorm=I=-14:LRA=7:tp=-1.0[afinal]"
    )
    
    cmd = [
        BIN_FFMPEG, "-y", "-nostdin",
        "-i", str(src_clip),
        "-filter_complex", fc,
        "-map", "[vfinal]",
        "-map", "[afinal]",
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-crf", "18",
        "-c:a", "aac",
        "-b:a", "192k",
        str(out_mp4)
    ]
    
    log_file = OUTPUT_DIR / f"ffmpeg_clip_{clip_meta['id']}.log"
    with open(log_file, "w", encoding="utf-8") as log_f:
        res = subprocess.run(cmd, env=env, stdout=log_f, stderr=subprocess.STDOUT)
        
    if res.returncode == 0:
        mb = out_mp4.stat().st_size / (1024 * 1024)
        print(f"[SUCCESS] Exported Clip {clip_meta['id']}: {out_mp4} ({mb:.1f} MB)")
    else:
        print(f"[ERROR Clip {clip_meta['id']}]: Return code {res.returncode}. See {log_file}")

if __name__ == "__main__":
    for c in CLIPS:
        generate_ass(c)
        generate_cover(c)
        render_vertical(c)
    print("\n[ALL COMPLETE] All 5 clips (06 through 10) rendered to 'final clips/'!")
