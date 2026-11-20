# Clipping & Video Editing Workspace

This workspace is configured for fast video clipping, reformatting, audio sound design, and programmatic motion editing.

---

## 📁 Workspace Layout

```
clipping/
├── input/             # Drop your raw video/audio source files here
├── output/            # Exported clips and rendered videos
├── scripts/
│   ├── clip_master.py # Fast CLI for trimming, cropping to 9:16, concatenating, & audio extraction
│   ├── synthesize_bop_voice.py # Cold-case investigative TTS voice synthesizer
│   └── ...            # Additional color grading, plate assembly, and audio tools
├── remotion/          # React-based programmatic video editing framework
├── assets/
│   └── audio/sfx/     # Whoosh transitions, shutter clicks, drone beds, tape stops
└── .agents/skills/    # Motion graphics & animation reference skills
```

---

## 🛠️ CLI Tools & Quick Commands

### 1. Fast Video Trimming
```bash
python scripts/clip_master.py trim input/my_video.mp4 output/clip1.mp4 --start 00:01:15 --duration 15
```

### 2. Convert Landscape (16:9) to Vertical (9:16) for Shorts/TikTok
```bash
# Blur background with centered video:
python scripts/clip_master.py crop_vertical input/my_video.mp4 output/vertical_blur.mp4 --mode blur

# Center crop:
python scripts/clip_master.py crop_vertical input/my_video.mp4 output/vertical_crop.mp4 --mode center
```

### 3. Inspect Video Metrics Safely (FFprobe)
```bash
python scripts/clip_master.py info input/my_video.mp4
```

### 4. Extract Audio Track
```bash
python scripts/clip_master.py extract_audio input/my_video.mp4 output/audio.wav
```

### 5. Retime / Speed Up Clip (e.g. 1.25x, 1.5x, 0.75x)
```bash
python scripts/clip_master.py speed input/my_video.mp4 output/fast.mp4 --speed 1.5
```

### 6. Stitch Multiple Clips Together
```bash
python scripts/clip_master.py concat output/clip1.mp4 output/clip2.mp4 -o output/stitched.mp4
```
