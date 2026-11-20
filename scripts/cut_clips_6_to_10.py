import subprocess
from pathlib import Path

WORKSPACE = Path(r"c:\Users\HP\Desktop\clipping")
BIN_FFMPEG = str(WORKSPACE / "bin" / "ffmpeg.exe")
MASTER_VOD = WORKSPACE / "FOLTYN PLAYING GTA 6!!" / "FOLTYN PLAYING GTA 6!!.mp4"
CURATED_DIR = WORKSPACE / "FOLTYN PLAYING GTA 6!!" / "curated_clips"
CURATED_DIR.mkdir(parents=True, exist_ok=True)

NEW_CLIPS = [
    {
        "id": "Clip_06_Florida_Crocodile_Encounter.mp4",
        "ss": "00:27:58.0",
        "t": "45.0",
        "title": "Florida Crocodile / Alligator Swamp Encounter"
    },
    {
        "id": "Clip_07_NPC_Rizz_Rejection.mp4",
        "ss": "00:57:58.0",
        "t": "47.0",
        "title": "Talking to Female NPC & Getting Rejected"
    },
    {
        "id": "Clip_08_Road_Rage_Red_Lights.mp4",
        "ss": "00:48:30.0",
        "t": "52.0",
        "title": "Road Rage & Running Red Lights"
    },
    {
        "id": "Clip_09_Street_Brawl_Fight_NPC.mp4",
        "ss": "00:56:58.0",
        "t": "50.0",
        "title": "Trying to Start a Street Fight with NPC"
    },
    {
        "id": "Clip_10_Miami_Vice_City_Graphics_Reaction.mp4",
        "ss": "00:19:12.0",
        "t": "46.0",
        "title": "First Look at Miami Vice City Skyline Graphics"
    }
]

print("Cutting 5 new viral moments from master VOD...")

for item in NEW_CLIPS:
    out_path = CURATED_DIR / item["id"]
    print(f"\nExtracting {item['id']} ({item['title']}) at {item['ss']} for {item['t']}s...")
    
    # We re-encode fast with libx264 veryfast crf 18 to ensure perfect keyframe cuts and no audio desync
    cmd = [
        BIN_FFMPEG, "-y", "-nostdin",
        "-ss", item["ss"],
        "-i", str(MASTER_VOD),
        "-t", item["t"],
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-crf", "18",
        "-c:a", "aac",
        "-b:a", "192k",
        str(out_path)
    ]
    
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if res.returncode == 0:
        mb = out_path.stat().st_size / (1024 * 1024)
        print(f"[SUCCESS] Saved: {out_path} ({mb:.1f} MB)")
    else:
        print(f"[ERROR]: {res.stderr[:400]}")

print("\n[ALL DONE] All 5 new clips extracted to curated_clips/")
