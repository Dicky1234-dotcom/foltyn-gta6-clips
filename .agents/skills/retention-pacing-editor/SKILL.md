---
name: retention-pacing-editor
description: Micro-pacing, silence stripping, 9:16 safe-zone framing, dynamic camera punch-ins, and high-retention animated captions for TikTok and Shorts.
---

# Retention Pacing Editor: Editing Rules & Playbook

This skill governs the micro-pacing, visual resets, safe-zone framing, and audio mastering required to keep viewer watch-time above 80% on TikTok, YouTube Shorts, and Instagram Reels.

---

## 1. Breath-Aware Silence & Filler Removal
* **Threshold:** Cut any dead air / silence longer than **0.35 seconds** (`silenceremove=stop_periods=-1:stop_duration=0.35:stop_threshold=-35dB`).
* **Preserve Punchlines:** When a joke or shocking climax lands, deliberately preserve a 0.5s–0.8s reaction gap so the moment lands with comedic timing. Never cut the trailing laughter or gasp.
* **Strip Filler Words:** Remove verbal stumbling (`"uh"`, `"um"`, `"like"`, `"you know"`) if they break narrative rhythm.

---

## 2. The 3-to-5 Second Visual Reset Rule
The human eye fatigues after 3 seconds of a static crop. Enforce a visual change every **3.0 to 5.0 seconds**:
1. **Dynamic Punch-In:** $108\%\text{–}115\%$ zoom scale on hard-hitting keywords, accompanied by a subtle whoosh SFX.
2. **Face / Action Pan:** Anchor `transformOrigin` on the speaker's face when speaking, then slide to gameplay/action when the event occurs.
3. **Stacked Split-Screen Layout (Gaming / Streamers):**
   - **Top 45%:** Webcam / Facecam (zoomed in on reaction).
   - **Bottom 55%:** Gameplay / In-game action.
   - **Seam:** Place captions right along the boundary so neither the face nor critical HUD elements are covered.

---

## 3. High-Contrast TikTok Safe-Zone Captions
* **Word Grouping:** **2 to 4 words per frame** maximum. Never display full sentences or paragraphs.
* **Timing:** Exact word-level audio sync via Whisper timestamps.
* **Placement & Safe Zone:**
  - Vertically positioned at **$62\%\text{–}72\%$ down the 1920px screen** (Y: $1190\text{px}\text{–}1380\text{px}$).
  - **Forbidden Overlap Zones:**
    - Bottom $320\text{px}$ (occupied by account handle, description text, and sound title).
    - Right-side $140\text{px}$ (occupied by like, comment, bookmark, and share icons).
    - Top $180\text{px}$ (occupied by search icon and tab bars).
* **Styling Lock:**
  - Font: Bold sans-serif (Montserrat, Impact, The Bold Font, Inter Black).
  - Colors: Pure white (`#FFFFFF`) with $3\text{px}$ black outline (`#000000`) and yellow (`#FFE600`) or lime (`#2DFE54`) active-word karaoke highlight.

---

## 4. Audio Mastering & Sound Bed Architecture
* **Dialogue Normalization:** Normalize dialogue to **-14 LUFS** integrated loudness with a -1.0 dB true-peak ceiling using FFmpeg loudnorm (`-af loudnorm=I=-14:LRA=7:tp=-1.0`).
* **Background Music Bed:**
  - High-energy copyright-safe track (lo-fi hip-hop, phonk, or suspense riser).
  - Ducked **$-20\text{ dB}$ to $-24\text{ dB}$** beneath the primary dialogue so words remain crystal clear.
* **Punctuation SFX:**
  - Subtle bass drop or vinyl tape-stop on awkward pauses.
  - Quick whoosh / swoosh on zoom transitions and camera angle switches.
