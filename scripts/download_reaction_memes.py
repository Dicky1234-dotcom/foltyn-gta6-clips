import subprocess
from pathlib import Path

WORKSPACE = Path(r"c:\Users\HP\Desktop\clipping")
MEMES_DIR = WORKSPACE / "assets" / "reaction_memes"
FFMPEG_BIN = str(WORKSPACE / "bin")

MEME_CATALOG = {
    "cats": [
        {"id": "lyrzrAZFZUE", "filename": "huh_cat.mp4", "title": "Huh Cat Confused"},
        {"id": "EL23DevJY_I", "filename": "huh_cat_screaming.mp4", "title": "Huh Cat Screaming"},
        {"id": "I68Ehtbu84M", "filename": "spinning_cat_oiia.mp4", "title": "Spinning OIIA Cat"},
        {"id": "NSU2hJ5wT08", "filename": "happy_cat.mp4", "title": "Happy Happy Cat"},
        {"id": "36kI8XZlxUI", "filename": "shocked_cat.mp4", "title": "Shocked Cat"},
        {"id": "nbM55YAaREk", "filename": "banana_cat_crying.mp4", "title": "Banana Cat Crying"}
    ],
    "dogs": [
        {"id": "DH7-qVPmUBA", "filename": "side_eye_dog_judging.mp4", "title": "Dog Side Eye Judging"},
        {"id": "2qCFqQcUN0M", "filename": "scared_dog.mp4", "title": "Scared Dog Trembling"}
    ],
    "reactions": [
        {"id": "MJm5WTOeFVM", "filename": "pedro_pascal_laugh_cry.mp4", "title": "Pedro Pascal Laugh and Cry"},
        {"id": "iwFsfBjIJhM", "filename": "emotional_damage.mp4", "title": "Emotional Damage"},
        {"id": "To4jb0JXjCE", "filename": "why_are_you_running.mp4", "title": "Why Are You Running"},
        {"id": "n8kdzGPsbMg", "filename": "walter_white_falling.mp4", "title": "Walter White Falling"}
    ]
}

def download_library():
    print("=== DOWNLOADING VIRAL REACTION MEME LIBRARY ===")
    for category, items in MEME_CATALOG.items():
        cat_dir = MEMES_DIR / category
        cat_dir.mkdir(parents=True, exist_ok=True)
        
        for item in items:
            out_file = cat_dir / item["filename"]
            if out_file.exists() and out_file.stat().st_size > 10000:
                print(f"[EXISTS] {category}/{item['filename']}")
                continue
                
            url = f"https://www.youtube.com/watch?v={item['id']}"
            print(f"[DOWNLOADING] {item['title']} -> {category}/{item['filename']}...")
            
            cmd = [
                "yt-dlp",
                "-f", "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080]/best",
                "--merge-output-format", "mp4",
                "--ffmpeg-location", FFMPEG_BIN,
                "-o", str(out_file),
                url
            ]
            
            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, errors="replace")
            if res.returncode == 0:
                mb = out_file.stat().st_size / (1024 * 1024)
                print(f"  [DONE] {item['filename']} ({mb:.2f} MB)")
            else:
                print(f"  [ERROR] {item['filename']}: {res.stderr[:200]}")

if __name__ == "__main__":
    download_library()
