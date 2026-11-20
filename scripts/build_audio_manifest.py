#!/usr/bin/env python3
"""
Audio Manifest Generator
Project: The Dark Truth Behind the Children's Crusade (1212)
Outputs: The Dark Truth Behind the Children's Crusade (1212)/AUDIO_MANIFEST.md
"""

import os
import sys
import wave
from pathlib import Path

# Add project root to sys.path
root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

def get_wav_info(p: Path):
    if not p.exists():
        return None
    try:
        with wave.open(str(p), "rb") as w:
            frames = w.getnframes()
            rate = w.getframerate()
            channels = w.getnchannels()
            width = w.getsampwidth()
            dur = frames / float(rate)
            return {
                "duration": dur,
                "frames_30fps": int(round(dur * 30)),
                "rate": rate,
                "channels": "Mono" if channels == 1 else "Stereo",
                "bit_depth": width * 8,
                "size_mb": p.stat().st_size / (1024 * 1024),
                "size_kb": p.stat().st_size / 1024,
            }
    except Exception as e:
        return None

def main():
    root = Path(__file__).resolve().parent.parent
    audio_dir = root / "remotion" / "public" / "childrens_crusade" / "audio"
    sfx_dir = audio_dir / "sfx"
    scenes_dir = audio_dir / "scenes"
    chunks_dir = audio_dir / "audio_chunks"
    master_wav = audio_dir / "master_voiceover.wav"
    manifest_file = root / "The Dark Truth Behind the Children's Crusade (1212)" / "AUDIO_MANIFEST.md"

    master_info = get_wav_info(master_wav)

    # SFX Library info
    sfx_items = [
        {
            "name": "Low D-Minor Cello Tension Drone",
            "filename": "sfx_d_minor_cello_tension_drone.wav",
            "desc": "Deep harmonic cello bowing (D1/D2/A2/F2) with warm room resonance. Sustains ominous investigative gravity.",
            "cues": "Scenes 1, 8, 12, 16, 23 (The Hook, Rotten Europe, Saint-Denis confrontation)"
        },
        {
            "name": "Dry Gravel Footsteps Cadence",
            "filename": "sfx_dry_gravel_footsteps_cadence.wav",
            "desc": "Weary, rhythmic footsteps on sun-baked dirt and crushed gravel (64 BPM march cadence, stereo panning).",
            "cues": "Scenes 1, 2, 20 (Peasants marching south across French roads)"
        },
        {
            "name": "Monastic Funeral Chant Resonance",
            "filename": "sfx_monastic_funeral_chant_resonance.wav",
            "desc": "Solemn D-minor medieval choral vocal drone with long 3.8s Gothic abbey acoustic reverb decay.",
            "cues": "Scenes 13, 21, 23 (Flagellant street processions, Latin chanting, Saint-Denis)"
        },
        {
            "name": "Ambient Dry Summer Wind",
            "filename": "sfx_ambient_dry_summer_wind.wav",
            "desc": "Scorched summer heat breeze rustling through dead wheat fields and dry pastures of Cloyes.",
            "cues": "Scenes 1, 2, 16 (Sun-bleached road, abandoned fields, Cloyes pasture)"
        },
        {
            "name": "Heavy Wooden Plow Drop Impact",
            "filename": "sfx_heavy_wooden_plow_drop_impact.wav",
            "desc": "Multi-layer impact: sub-bass ground thud, dense oak timber clatter, dry earth crunch, and dull iron plowshare ping.",
            "cues": "Scene 2 (Peasant hands letting go of plow; plow crashing into earth)"
        },
        {
            "name": "Cold-Case Investigative Theme",
            "filename": "cold_case_investigative_theme.wav",
            "desc": "Full cold-case investigative music bed with low cello pulses, felt piano notes, clockwork ticking, and brooding sub-drone.",
            "cues": "Continuous overarching documentary score (master bed)"
        },
        {
            "name": "Investigative Sub-Drone Bed",
            "filename": "sfx_investigative_drone_bed.wav",
            "desc": "Continuous low-frequency tension pad underpinning spoken narrative segments.",
            "cues": "Continuous atmospheric background"
        },
        {
            "name": "Sub-Bass Concussion Drop",
            "filename": "sfx_sub_bass_concussion_drop.wav",
            "desc": "Heavy low-end impact hit marking dramatic thematic turning points and revelations.",
            "cues": "Scenes 2C, 9B, 15A, 24A, 32B"
        },
        {
            "name": "Winter Steppe Wind Howl",
            "filename": "sfx_winter_steppe_wind_howl.mp3",
            "desc": "Biting high-altitude freezing wind for Alpine pass ascents.",
            "cues": "Scenes 29, 30 (The Swiss Alps crossing)"
        },
        {
            "name": "Film Shutter Transition",
            "filename": "sfx_film_shutter_transition.wav",
            "desc": "Tactile archival camera shutter / manuscript snap for historiographical cutaways.",
            "cues": "Scenes 7B, 24C, 38B, 45A"
        }
    ]

    # Script scene lines
    from scripts.synthesize_crusade_scenes_1_to_24 import SCENES

    lines = []
    lines.append("# Master Audio Timing Manifest: Voiceover & Sound Design")
    lines.append("**Project:** The Dark Truth Behind the Children's Crusade (1212)  ")
    lines.append("**Voice Persona:** The Cold-Case Investigative Specialist (BOP Voice - LEMMiNO / Fern Edition / `Charon`)  ")
    lines.append("**TTS Engine:** Gemini TTS (`Charon`), 24,000 Hz, 16-bit Mono PCM WAV  ")
    lines.append("**Acoustic Profile:** Dead studio vocal booth, anechoic, zero room reflections, Shure SM7B broadcast intimacy, anti-box notch, presence lift, air sheen, opto limiter @ -1.0dB  ")
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("## 1. Master Continuous Voiceover")
    if master_info:
        dur_m = master_info['duration'] / 60.0
        lines.append(f"* **Master File:** [`master_voiceover.wav`](file:///{master_wav.as_posix()})")
        lines.append(f"* **Remotion Static URI:** `childrens_crusade/audio/master_voiceover.wav`")
        lines.append(f"* **Duration:** **{master_info['duration']:.2f} seconds** ({dur_m:.2f} minutes | {master_info['frames_30fps']:,} frames @ 30 FPS)")
        lines.append(f"* **Format:** {master_info['rate']:,} Hz, {master_info['bit_depth']}-bit {master_info['channels']} WAV ({master_info['size_mb']:.2f} MB)")
        lines.append(f"* **Word Count:** 2,159 spoken words across 18 mastered clauses")
    lines.append("")
    lines.append("### Continuous Voiceover Chunks (Stitched into Master):")
    lines.append("| Chunk | File | Duration | Frames (30fps) | File Size |")
    lines.append("| :--- | :--- | :--- | :--- | :--- |")
    
    chunk_files = sorted(chunks_dir.glob("chunk_*.wav"))
    for cf in chunk_files:
        info = get_wav_info(cf)
        if info:
            lines.append(f"| **{cf.stem.upper()}** | `{cf.name}` | {info['duration']:.2f}s | {info['frames_30fps']} | {info['size_kb']:.1f} KB |")

    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("## 2. Per-Scene Audio Chunks (Scenes 1 to 24 - Act I Production Suite)")
    lines.append("*Each scene file is independently mastered and calibrated for frame-accurate invocation inside Remotion `<Sequence>` components.*")
    lines.append("")
    lines.append("| Scene ID | Audio File | Duration | Remotion Frames (@ 30fps) | Script Narration Excerpt | Recommended SFX Bed |")
    lines.append("| :--- | :--- | :--- | :--- | :--- | :--- |")

    total_scene_dur = 0.0
    for s_id in range(1, 25):
        sf = scenes_dir / f"scene_{s_id:02d}.wav"
        info = get_wav_info(sf)
        text = SCENES.get(s_id, "")
        trunc_text = text[:80] + "..." if len(text) > 80 else text
        
        # Recommended SFX bed for scene
        sfx_rec = "Ambient Summer Wind + Drone"
        if s_id in [1, 2]:
            sfx_rec = "Dry Gravel Footsteps + Wind"
        elif s_id == 2:
            sfx_rec = "Wooden Plow Drop Impact"
        elif s_id in [3, 4, 5]:
            sfx_rec = "Cello Tension Drone"
        elif s_id in [9, 11]:
            sfx_rec = "Sub-Bass Concussion + War Drums"
        elif s_id in [12, 13]:
            sfx_rec = "Monastic Funeral Chant"
        elif s_id in [16, 17, 18]:
            sfx_rec = "Pastoral Summer Wind + Cello"
        elif s_id in [20, 21]:
            sfx_rec = "Footsteps Cadence + Monastic Chant"
        elif s_id in [23, 24]:
            sfx_rec = "Cello Tension + Royal Chamber Silence"

        if info:
            dur = info['duration']
            frames = info['frames_30fps']
            total_scene_dur += dur
            lines.append(f"| **Scene {s_id:02d}** | [`{sf.name}`](file:///{sf.as_posix()}) | **{dur:.2f}s** | **{frames}f** | *\"{trunc_text}\"* | {sfx_rec} |")
        else:
            lines.append(f"| **Scene {s_id:02d}** | `{sf.name}` | Pending | Pending | *\"{trunc_text}\"* | {sfx_rec} |")

    lines.append("")
    lines.append(f"* **Total Act I (Scenes 1–24) Voiceover Runtime:** **{total_scene_dur:.2f} seconds** ({total_scene_dur/60.0:.2f} minutes | {int(round(total_scene_dur*30)):,} frames @ 30 FPS)")
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("## 3. Atmospheric Sound Effects (SFX) Library")
    lines.append("All SFX are stored in `remotion/public/childrens_crusade/audio/sfx/` and calibrated for 24kHz/44.1kHz studio output.")
    lines.append("")
    lines.append("| Atmospheric SFX Name | Filename | Duration | Acoustic Role & Profile | Storyboard Scene Cues |")
    lines.append("| :--- | :--- | :--- | :--- | :--- |")

    for sfx in sfx_items:
        sfx_path = sfx_dir / sfx['filename']
        dur_str = "N/A"
        if sfx_path.exists():
            if sfx_path.suffix.lower() == ".wav":
                wi = get_wav_info(sfx_path)
                if wi:
                    dur_str = f"{wi['duration']:.2f}s"
            else:
                dur_str = f"{sfx_path.stat().st_size / 1024:.1f} KB"
        lines.append(f"| **{sfx['name']}** | [`{sfx['filename']}`](file:///{sfx_path.as_posix()}) | {dur_str} | {sfx['desc']} | {sfx['cues']} |")

    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("## 4. Remotion Implementation Architecture")
    lines.append("To trigger scene audio chunks or continuous voiceover in Remotion, reference via `staticFile`:")
    lines.append("")
    lines.append("```tsx")
    lines.append("import { Audio, Sequence, staticFile } from 'remotion';")
    lines.append("")
    lines.append("// Option A: Continuous Master Voiceover Bed")
    lines.append("<Audio")
    lines.append("  src={staticFile('childrens_crusade/audio/master_voiceover.wav')}")
    lines.append("  volume={1.0}")
    lines.append("/>")
    lines.append("")
    lines.append("// Option B: Per-Scene Synchronized Invocation (Scene 2 Example)")
    lines.append("<Sequence from={120} durationInFrames={360}>")
    lines.append("  <Audio")
    lines.append("    src={staticFile('childrens_crusade/audio/scenes/scene_02.wav')}")
    lines.append("    volume={1.0}")
    lines.append("  />")
    lines.append("  {/* Heavy wooden plow drop impact right on handle release (Frame 200) */}")
    lines.append("  <Sequence from={80} durationInFrames={96}>")
    lines.append("    <Audio")
    lines.append("      src={staticFile('childrens_crusade/audio/sfx/sfx_heavy_wooden_plow_drop_impact.wav')}")
    lines.append("      volume={0.85}")
    lines.append("    />")
    lines.append("  </Sequence>")
    lines.append("</Sequence>")
    lines.append("```")
    lines.append("")

    manifest_file.write_text("\n".join(lines), encoding="utf-8")
    print(f"[+] Audio Timing Manifest generated successfully at: {manifest_file}")

if __name__ == "__main__":
    main()
