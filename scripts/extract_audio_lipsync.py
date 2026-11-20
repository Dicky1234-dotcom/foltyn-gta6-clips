import json
import math
import subprocess
from pathlib import Path
import numpy as np

# ============================================================================
# 24 FPS DISCRETE LIP-SYNC & SCENE DURATION EXTRACTOR
# Compliant with ANIMATION_CONSTRAINTS.md Section 5:
#   - RMS < 0.02        -> 0 (mouth_closed)
#   - 0.02 <= RMS < 0.08 -> 1 (mouth_mid)
#   - RMS >= 0.08       -> 2 (mouth_open)
#   - 2-frame hysteresis debounce to prevent mouth jitter
# ============================================================================
FPS = 24
SAMPLE_RATE = 16000
DEFAULT_SCENE_DURATIONS = {
    "scene_01": 65.0,
    "scene_02": 70.0,
    "scene_03": 70.0,
    "scene_04": 80.0,
    "scene_05": 65.0,
    "scene_06": 65.0,
    "scene_07": 70.0,
    "scene_08": 65.0,
    "scene_09": 65.0,
    "scene_10": 45.0,
}


def get_audio_duration(path: Path) -> float:
    cmd = [
        "ffprobe",
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-of",
        "default=noprint_wrappers=1:nokey=1",
        str(path),
    ]
    out = subprocess.check_output(cmd, text=True).strip()
    return float(out)


def extract_rms_states_from_audio(path: Path, fps: int = FPS):
    duration = get_audio_duration(path)
    total_frames = max(1, int(round(duration * fps)))
    cmd = [
        "ffmpeg",
        "-hide_banner",
        "-loglevel",
        "error",
        "-i",
        str(path),
        "-f",
        "s16le",
        "-ac",
        "1",
        "-ar",
        str(SAMPLE_RATE),
        "-",
    ]
    raw_pcm = subprocess.check_output(cmd)
    samples = np.frombuffer(raw_pcm, dtype=np.int16).astype(np.float32) / 32768.0
    samples_per_frame = max(1, int(SAMPLE_RATE / fps))

    raw_states = []
    rms_values = []
    for f in range(total_frames):
        s0 = f * samples_per_frame
        s1 = min(len(samples), s0 + samples_per_frame)
        chunk = samples[s0:s1]
        rms = float(np.sqrt(np.mean(chunk * chunk))) if len(chunk) > 0 else 0.0
        rms_values.append(round(rms, 4))
        if rms < 0.02:
            raw_states.append(0)
        elif rms < 0.08:
            raw_states.append(1)
        else:
            raw_states.append(2)

    # 2-frame hysteresis debounce (Section 5 of ANIMATION_CONSTRAINTS.md)
    debounced = []
    current_state = 0
    pending_state = 0
    pending_count = 0
    for st in raw_states:
        if st == current_state:
            pending_state = current_state
            pending_count = 0
        else:
            if st == pending_state:
                pending_count += 1
                if pending_count >= 2:
                    current_state = st
                    pending_count = 0
            else:
                pending_state = st
                pending_count = 1
        debounced.append(current_state)

    return duration, rms_values, debounced


def synthesize_fallback_envelope(duration: float, seed: int = 42):
    rng = np.random.default_rng(seed)
    total_frames = int(round(duration * FPS))
    raw_states = []
    rms_values = []
    for f in range(total_frames):
        t = f / FPS
        # Natural speech cadence with breathing pauses every ~4.5 seconds
        phrase_env = max(0.0, math.sin(2.0 * math.pi * (t / 4.5)))
        syllable = abs(math.sin(2.0 * math.pi * 4.2 * t + 0.5 * math.sin(2.0 * math.pi * 1.7 * t)))
        rms = (0.01 + 0.095 * syllable * (0.4 + 0.6 * rng.random())) * (1.0 if phrase_env > 0.15 else 0.05)
        rms_values.append(round(rms, 4))
        if rms < 0.02:
            raw_states.append(0)
        elif rms < 0.08:
            raw_states.append(1)
        else:
            raw_states.append(2)

    debounced = []
    current_state = 0
    pending_state = 0
    pending_count = 0
    for st in raw_states:
        if st == current_state:
            pending_state = current_state
            pending_count = 0
        else:
            if st == pending_state:
                pending_count += 1
                if pending_count >= 2:
                    current_state = st
                    pending_count = 0
            else:
                pending_state = st
                pending_count = 1
        debounced.append(current_state)

    return duration, rms_values, debounced


def build_lipsync_manifest():
    audio_dir = Path("media/audio")
    audio_dir.mkdir(parents=True, exist_ok=True)
    manifest = {"fps": FPS, "scenes": {}}

    # Check if user provided a single master voiceover file
    master_candidates = (
        list(audio_dir.glob("voiceover_master.*"))
        + list(audio_dir.glob("master.*"))
        + list(audio_dir.glob("full*.*"))
    )

    if master_candidates:
        master_path = master_candidates[0]
        print(f"Found master voiceover: {master_path}")
        total_dur, rms_all, states_all = extract_rms_states_from_audio(master_path)
        default_total = sum(DEFAULT_SCENE_DURATIONS.values())
        scale = total_dur / default_total
        cursor_frame = 0
        for idx, (sc, def_dur) in enumerate(DEFAULT_SCENE_DURATIONS.items()):
            sc_dur = round(def_dur * scale, 2) if idx < 9 else round(total_dur - (cursor_frame / FPS), 2)
            n_frames = max(1, int(round(sc_dur * FPS)))
            sc_rms = rms_all[cursor_frame : cursor_frame + n_frames]
            sc_states = states_all[cursor_frame : cursor_frame + n_frames]
            manifest["scenes"][sc] = {
                "audio_source": str(master_path),
                "start_sec": round(cursor_frame / FPS, 3),
                "duration": round(len(sc_states) / FPS, 3),
                "frames": len(sc_states),
                "mouth_states": sc_states,
                "rms": sc_rms,
            }
            cursor_frame += len(sc_states)
    else:
        for idx, (sc, def_dur) in enumerate(DEFAULT_SCENE_DURATIONS.items(), start=1):
            sc_files = list(audio_dir.glob(f"{sc}.*")) + list(audio_dir.glob(f"*{idx:02d}*.*"))
            sc_files = [f for f in sc_files if f.suffix.lower() in (".mp3", ".wav", ".m4a", ".aac", ".ogg", ".flac")]
            if sc_files:
                dur, rms_vals, states = extract_rms_states_from_audio(sc_files[0])
                src = str(sc_files[0])
                print(f"[{sc}] Extracted {len(states)} frames ({dur:.2f}s) from {src}")
            else:
                dur, rms_vals, states = synthesize_fallback_envelope(def_dur, seed=100 + idx)
                src = "synthetic_cadence_fallback"
                print(f"[{sc}] No audio file yet in media/audio/; generated {dur:.1f}s cadence envelope ({len(states)} frames)")

            manifest["scenes"][sc] = {
                "audio_source": src,
                "start_sec": 0.0,
                "duration": round(dur, 3),
                "frames": len(states),
                "mouth_states": states,
                "rms": rms_vals,
            }

    out_json = audio_dir / "lipsync_envelope.json"
    out_json.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"Saved lip-sync manifest -> {out_json}")


if __name__ == "__main__":
    build_lipsync_manifest()
