#!/usr/bin/env python3
"""
Generate 5 Voice Previews Shootout
==================================
Synthesizes a 3-line historical test text across all 5 master YouTube archetypes:
1. The Epic British Chronicler (Charles Nove / Epic History TV Edition) - Charon (Mastered)
2. The Cold-Case Investigative Specialist (LEMMiNO / Fern Edition) - Charon (Native)
3. The Poetic Archival Storyteller (Fall of Civilizations / Paul Cooper Edition) - Schedar
4. The Gritty Frontline War Correspondent (Dan Carlin / Hardcore History Edition) - Orus
5. The Deadpan Cynic & Modern Wit (OverSimplified / Historia Civilis Edition) - Puck
"""

import os
import sys
import time
import wave
import subprocess
from pathlib import Path
import numpy as np

# Load local environment
SCRIPTS_DIR = Path(__file__).resolve().parent
WORKSPACE_DIR = SCRIPTS_DIR.parent
OUTPUT_DIR = WORKSPACE_DIR / "assets" / "audio" / "voice_references" / "showdown_5_archetypes"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

sys.path.insert(0, str(SCRIPTS_DIR))
from synthesize_bop_voice import load_api_keys

try:
    from google import genai
    from google.genai import types
except ImportError:
    print("[!] google-genai SDK not installed.")
    sys.exit(1)

# The Unified 3-Line Historical Test Passage
TEST_LINES = (
    "In the winter of nineteen forty-two, a solitary courier slipped across the frozen border carrying a single forged ledger. "
    "Inside were the exact tactical plans and radio codes for thirty-four divisions. "
    "By daybreak, an entire empire had walked straight into a trap... and neither commander realized it yet."
)

ARCHETYPES = [
    {
        "id": "01_epic_british_chronicler_charles_nove",
        "title": "The Epic British Chronicler (Charles Nove / Epic History TV Edition)",
        "voice": "Charon",
        "directive": (
            "Audio Profile: Senior BBC historical documentary narrator and broadcaster, modeled precisely on Charles Nove (Epic History TV). "
            "Accent: Flawless, authentic British English (crisp classical BBC / RP accent with subtle aristocratic warmth, deep solemnity, and zero casual or robotic inflections). "
            "Register & Timbre: Rich, resonant lower-mid baritone with gravitas and commanding authority (~123 Hz acoustic fundamental). "
            "Pacing & Cadence: Deliberate historical essay pacing (approx 120-125 WPM), with dramatic breathing pauses between clauses that give weight to epic historical events."
        ),
        "post_master": "charles_nove",
    },
    {
        "id": "02_cold_case_investigator_fern_lemmino",
        "title": "The Cold-Case Investigative Specialist (LEMMiNO / Fern Edition)",
        "voice": "Charon",
        "directive": (
            "Audio Profile: Young adult male investigative documentary filmmaker and narrator (styled after Fern and LEMMiNO). "
            "Accent: Sleek, neutral modern European-English with crisp, subtle continental precision and broadcast clarity. "
            "Pitch & Tone: Calm, resonant lower-mid baritone with intimate close-mic broadcast proximity effect. "
            "Cool, investigative, objective, quietly gripping, mysterious, deadpan curiosity, completely devoid of hype or melodrama. "
            "Delivery: Measured, deliberate pacing, surgical pauses between clauses, subtle downward inflection at the end of sentences."
        ),
        "post_master": "close_mic",
    },
    {
        "id": "03_poetic_archival_storyteller_fall_of_civilizations",
        "title": "The Poetic Archival Storyteller (Fall of Civilizations / Paul Cooper Edition)",
        "voice": "Schedar",
        "directive": (
            "Audio Profile: Prestige BBC historical documentary narrator (styled after Paul Cooper's Fall of Civilizations). "
            "Accent: Classical British English with refined, lyrical theatre-trained articulation. "
            "Pitch & Tone: Warm, lyrical baritone with rich dynamic depth and empathetic gravitas. "
            "Delivery: Poetic, reflective, solemn, and cinematic cadence that paints vivid imagery with quiet tragedy and timeless authority."
        ),
        "post_master": "cinematic_hall",
    },
    {
        "id": "04_gritty_frontline_chronicle_dan_carlin",
        "title": "The Gritty Frontline War Correspondent (Dan Carlin / Hardcore History Edition)",
        "voice": "Orus",
        "directive": (
            "Audio Profile: Seasoned military historian and frontline war correspondent (styled after Dan Carlin and Hardcore History). "
            "Pitch & Tone: Deep, heavy chest-voice baritone with weathered grit, solemn weight, and close-mic warmth. "
            "Delivery: Deliberate, unhurried, and authoritative cadence. Every sentence lands like a permanent historical record carved in stone. "
            "Zero theatrical hype; pure grounded military authority."
        ),
        "post_master": "heavy_chest",
    },
    {
        "id": "05_deadpan_cynic_oversimplified",
        "title": "The Deadpan Cynic & Modern Wit (OverSimplified / Historia Civilis Edition)",
        "voice": "Puck",
        "directive": (
            "Audio Profile: Sharp, witty historical narrator with bone-dry deadpan delivery (styled after OverSimplified and Historia Civilis). "
            "Pitch & Tone: Crisp, conversational mid-baritone. Effortlessly smart, slightly amused by human stupidity, matter-of-fact understatement. "
            "Delivery: Brisk, clean articulation with sudden flat, deadpan pauses right before absurd revelations."
        ),
        "post_master": "snappy_broadcast",
    },
]


def synthesize_raw_pcm(text: str, voice: str, directive: str, keys: list[str], key_idx: int) -> tuple[bytes, int]:
    models = ["gemini-2.5-flash-preview-tts", "gemini-3.8-flash-tts"]
    prompt = (
        f"Speak the following historical narration text aloud.\n"
        f"Vocal delivery style & tone: {directive}\n"
        f"Do not read the instructions. Speak only the text in quotes:\n\n"
        f"\"{text}\""
    )

    num_keys = len(keys)
    attempts = 0
    max_attempts = num_keys * 4

    while attempts < max_attempts:
        k = keys[key_idx]
        for model in models:
            try:
                client = genai.Client(api_key=k)
                resp = client.models.generate_content(
                    model=model,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_modalities=["AUDIO"],
                        speech_config=types.SpeechConfig(
                            voice_config=types.VoiceConfig(
                                prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name=voice)
                            )
                        )
                    )
                )
                for p in resp.candidates[0].content.parts:
                    if getattr(p, "inline_data", None) and p.inline_data.data:
                        return p.inline_data.data, (key_idx + 1) % num_keys
            except Exception as e:
                err = str(e)
                # Print short status
                if "429" in err or "RESOURCE_EXHAUSTED" in err:
                    break
                elif "503" in err or "UNAVAILABLE" in err:
                    time.sleep(1)
                    break
                else:
                    time.sleep(0.5)

        key_idx = (key_idx + 1) % num_keys
        attempts += 1
        time.sleep(0.5)

    raise RuntimeError(f"All keys exhausted for voice: {voice}")


def apply_mastering(raw_wav: Path, out_wav: Path, mode: str):
    if mode == "charles_nove":
        # Pitch easing to ~123Hz, 0.92 documentary cadence, broadcast warm EQ
        cmd = [
            "ffmpeg", "-y", "-i", str(raw_wav),
            "-af", (
                "rubberband=pitch=0.8706:tempo=0.92:formant=preserved:pitchq=quality,"
                "equalizer=f=120:width_type=q:w=1:g=2.5,"
                "equalizer=f=400:width_type=q:w=1:g=-1.5,"
                "equalizer=f=3500:width_type=q:w=1:g=1.5"
            ),
            "-ar", "24000", str(out_wav)
        ]
    elif mode == "close_mic":
        # Crisp close-mic proximity: slight low-mid presence, clean de-ess, subtle intimate compression
        cmd = [
            "ffmpeg", "-y", "-i", str(raw_wav),
            "-af", (
                "equalizer=f=110:width_type=q:w=1:g=2.0,"
                "equalizer=f=3200:width_type=q:w=1:g=1.2,"
                "acompressor=threshold=-18dB:ratio=3:attack=5:release=50"
            ),
            "-ar", "24000", str(out_wav)
        ]
    elif mode == "cinematic_hall":
        # Poetic BBC: warm acoustic depth, high-shelf air, very subtle natural ambience
        cmd = [
            "ffmpeg", "-y", "-i", str(raw_wav),
            "-af", (
                "equalizer=f=140:width_type=q:w=1:g=1.8,"
                "equalizer=f=8000:width_type=q:w=1:g=1.0,"
                "acompressor=threshold=-20dB:ratio=2.5:attack=10:release=100"
            ),
            "-ar", "24000", str(out_wav)
        ]
    elif mode == "heavy_chest":
        # Dan Carlin heavy chest gravitas: deep authoritative shelf (+3.2 dB @ 100 Hz), de-mud at 450 Hz
        cmd = [
            "ffmpeg", "-y", "-i", str(raw_wav),
            "-af", (
                "equalizer=f=95:width_type=q:w=1:g=3.2,"
                "equalizer=f=450:width_type=q:w=1:g=-2.0,"
                "equalizer=f=2800:width_type=q:w=1:g=1.8,"
                "acompressor=threshold=-16dB:ratio=3.5:attack=5:release=70"
            ),
            "-ar", "24000", str(out_wav)
        ]
    elif mode == "snappy_broadcast":
        # OverSimplified punchy deadpan: slight tempo lift, crisp clarity, clean punch
        cmd = [
            "ffmpeg", "-y", "-i", str(raw_wav),
            "-af", (
                "rubberband=tempo=1.03:formant=preserved:pitchq=quality,"
                "equalizer=f=150:width_type=q:w=1:g=1.0,"
                "equalizer=f=4000:width_type=q:w=1:g=2.2,"
                "acompressor=threshold=-15dB:ratio=3.2:attack=3:release=40"
            ),
            "-ar", "24000", str(out_wav)
        ]
    else:
        cmd = ["ffmpeg", "-y", "-i", str(raw_wav), "-ar", "24000", str(out_wav)]

    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)


def create_marker_tone(freq=520, duration_sec=0.15, sample_rate=24000):
    t = np.linspace(0, duration_sec, int(sample_rate * duration_sec), endpoint=False)
    envelope = np.sin(np.pi * t / duration_sec)
    wave_data = (np.sin(2 * np.pi * freq * t) * envelope * 8000).astype(np.int16)
    return wave_data.tobytes()


def create_silence(duration_sec, sample_rate=24000):
    num_samples = int(duration_sec * sample_rate)
    return np.zeros(num_samples, dtype=np.int16).tobytes()


def main():
    print("=" * 75)
    print("  SYNTHESIZING 5 MASTER YOUTUBE VOICE PREVIEWS")
    print("=" * 75)
    print(f"Text Passage (3 Lines):\n\"{TEST_LINES}\"\n")

    keys = load_api_keys()
    if not keys:
        print("[!] No API keys found in .env.")
        sys.exit(1)

    key_idx = 0
    generated_files = []

    for idx, arch in enumerate(ARCHETYPES, 1):
        out_wav = OUTPUT_DIR / f"{arch['id']}.wav"
        raw_wav = OUTPUT_DIR / f"{arch['id']}.raw.wav"

        print(f"[{idx}/5] Synthesizing: {arch['title']} (Voice: {arch['voice']})...", end="", flush=True)

        pcm_data, key_idx = synthesize_raw_pcm(
            TEST_LINES, arch["voice"], arch["directive"], keys, key_idx
        )

        with wave.open(str(raw_wav), "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(24000)
            w.writeframes(pcm_data)

        apply_mastering(raw_wav, out_wav, arch["post_master"])
        raw_wav.unlink(missing_ok=True)

        with wave.open(str(out_wav), "rb") as w:
            dur = w.getnframes() / float(w.getframerate())

        print(f" Done! -> {out_wav.name} ({dur:.2f}s)")
        generated_files.append((arch, out_wav, dur))
        time.sleep(1.0)

    # Now create the master comparison reel
    reel_path = OUTPUT_DIR / "00_ALL_5_VOICE_ARCHETYPES_SHOWDOWN_REEL.wav"
    print(f"\n[*] Concatenating full Showdown Reel: {reel_path.name}...")

    combined_audio = bytearray()
    sample_rate = 24000

    for arch, wav_p, dur in generated_files:
        # Pre-tone beeps (two pleasant indicator pings)
        combined_audio.extend(create_marker_tone(freq=440, duration_sec=0.1, sample_rate=sample_rate))
        combined_audio.extend(create_silence(0.08, sample_rate=sample_rate))
        combined_audio.extend(create_marker_tone(freq=660, duration_sec=0.14, sample_rate=sample_rate))
        combined_audio.extend(create_silence(0.5, sample_rate=sample_rate))

        with wave.open(str(wav_p), "rb") as in_w:
            combined_audio.extend(in_w.readframes(in_w.getnframes()))

        # 1.5s silence gap between candidates
        combined_audio.extend(create_silence(1.5, sample_rate=sample_rate))

    with wave.open(str(reel_path), "wb") as out_w:
        out_w.setnchannels(1)
        out_w.setsampwidth(2)
        out_w.setframerate(sample_rate)
        out_w.writeframes(combined_audio)

    total_dur = len(combined_audio) / (sample_rate * 2)
    print(f"[+] COMPLETE! Master Showdown Reel generated: {reel_path} ({total_dur:.2f}s)")


if __name__ == "__main__":
    main()
