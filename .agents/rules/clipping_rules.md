# Autonomous Clipping & Video Editing Rules

## 1. Platform & Format Standards
- **Aspect Ratio:** 9:16 Vertical (1080×1920).
- **Framerate & Codec:** 60 FPS, H.264 (CRF 18, `veryfast` preset), AAC stereo audio (192 kbps).
- **Framing Composition:**
  - Main gameplay placed centered at `overlay=0:(H-h)/2-100`.
  - Background: Fast cinematic bokeh blur created via downscaling (`scale=270:480:force_original_aspect_ratio=increase,crop=270:480,boxblur=10:2,scale=1080:1920:flags=bilinear`).
- **Broadcast Audio:** Strict normalization to platform standard `-14 LUFS` (`loudnorm=I=-14:LRA=7:tp=-1.0`).

## 2. Retention Hook Header (First 3.5s)
- **Position & Styling:** Centered at `y=240`, font size 46–50pt Impact yellow (`#FFFF00`).
- **Backing Plate:** 80% opacity black box with 18px padding (`box=1:boxcolor=black@0.80:boxborderw=18`).
- **Timing:** Active strictly between `t=0` and `t=3.5` seconds (`enable='between(t,0,3.5)'`).
- **Purpose:** Immediate curiosity gap and pattern interrupt before the user scrolls.

## 3. Safe-Zone Subtitles & Captions
- **Safe-Zone Constraint:** Vertical margin `MarginV=420` from the bottom to prevent obstruction by TikTok/Shorts UI buttons (like, share, comments, sound disc, profile).
- **Subtitle Styling:**
  - Font: Impact, size 54, uppercase.
  - Colors: White primary text with yellow accents (`&H00FFFFFF` / `&H0000FFFF`).
  - Outline: 6px black outline (`&H00000000`), 3px soft shadow (`&H80000000`).
- **Pacing:** 2 to 3 words per subtitle event for rapid reading cadence.

## 4. Editing Style & Meme Policy
- **No Memes by Default:** Keep gameplay, facecam, and streamer audio 100% clean and authentic. Do NOT insert third-party meme cutaways (cats, dogs, green-screen reaction clips) unless explicitly requested by the user.
- **Visual Resets (Every 3–5s):** Use subtle digital punch-in zooms (1.15x–1.25x) on high-emotion moments (screams, crashes, close calls) to reset viewer subconscious attention.
- **Facecam Focus:** Highlight Foltyn’s facial expressions and emotional reactions.
- **Audio Foley:** Clean, impactful audio; remove any dead silences longer than 0.35s.
- **Infinite Looping:** Where possible, time the ending phrase so it loops cleanly into the opening hook to push Average Watch Time (AWT) above 100%.

## 5. Campaign Rules & Compliance (Foltyn Campaign)
- **Mandatory Attribution:** First line of every caption MUST include:
  `@realkfoltyn @FoltynFamily @realfoltyn`
- **Zero Toxicity:** Zero negative or derogatory framing towards Foltyn.
- **Zero Gambling/Casino:** Absolutely no external casino, betting, or promo logos.
- **Engagement Driver:** Always pin a high-polarity or open question in the comments to exceed the target 0.75% engagement threshold.

## 6. Project & File Management
- **Master Outputs:** All client-ready vertical videos and master cover images must be saved directly into `final clips/`.
- **Git Safety:** NEVER commit or push raw `.mp4` video files, heavy assets, or binaries to GitHub. Keep `.gitignore` strictly enforced.
