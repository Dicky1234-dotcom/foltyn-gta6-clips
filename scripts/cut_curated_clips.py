import os
import subprocess
from pathlib import Path

ffmpeg = r"c:\Users\HP\Desktop\clipping\bin\ffmpeg.exe"
input_vid = r"c:\Users\HP\Desktop\clipping\FOLTYN PLAYING GTA 6!!\FOLTYN PLAYING GTA 6!!.mp4"
out_dir = Path(r"c:\Users\HP\Desktop\clipping\FOLTYN PLAYING GTA 6!!\curated_clips")
out_dir.mkdir(parents=True, exist_ok=True)

clips = [
    {
        "name": "Clip_01_Six_Star_Police_Chase.mp4",
        "start": 819.5,
        "dur": 59.5,
        "title": "6-STAR POLICE CHASE & ARREST"
    },
    {
        "name": "Clip_02_First_Time_Driving_Chaos.mp4",
        "start": 2599.0,
        "dur": 59.5,
        "title": "FIRST TIME DRIVING IN GTA 6"
    },
    {
        "name": "Clip_03_Stealth_Takedown_Barber_Banter.mp4",
        "start": 1901.0,
        "dur": 49.0,
        "title": "STEALTH TAKEDOWN & STREAM ROAST"
    },
    {
        "name": "Clip_04_Gunfight_Plane_Escape.mp4",
        "start": 2117.0,
        "dur": 44.0,
        "title": "INTENSE SHOOTOUT & PLANE ESCAPE"
    },
    {
        "name": "Clip_05_Roof_Jump_Physics_Test.mp4",
        "start": 3344.5,
        "dur": 32.5,
        "title": "TESTING GTA 6 ROOF JUMP PHYSICS"
    }
]

for c in clips:
    out_file = out_dir / c["name"]
    cmd = [
        ffmpeg, "-y",
        "-ss", str(c["start"]),
        "-i", input_vid,
        "-t", str(c["dur"]),
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-crf", "18",
        "-c:a", "aac",
        "-b:a", "192k",
        str(out_file)
    ]
    print(f"Cutting {c['name']} ({c['dur']}s from {c['start']}s)...")
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if res.returncode == 0:
        mb = out_file.stat().st_size / (1024 * 1024)
        print(f"  [SUCCESS] {out_file.name} ({mb:.1f} MB)")
    else:
        print(f"  [ERROR] {c['name']}: {res.stderr.decode('utf-8', errors='ignore')[:300]}")

print("\nAll 5 curated clips have been exported!")
