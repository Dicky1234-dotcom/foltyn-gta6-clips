#!/usr/bin/env python3
"""
Test Crisp Ultra-Dry Studio Polish for Archetype #2 (The Cold-Case Investigator)
"""
import sys
import wave
import subprocess
from pathlib import Path

SCRIPTS_DIR = Path(__file__).resolve().parent
WORKSPACE_DIR = SCRIPTS_DIR.parent
OUTPUT_DIR = WORKSPACE_DIR / "assets" / "audio" / "voice_references" / "showdown_5_archetypes"

sys.path.insert(0, str(SCRIPTS_DIR))
from synthesize_bop_voice import load_api_keys

try:
    from google import genai
    from google.genai import types
except ImportError:
    print("[!] google-genai SDK not installed.")
    sys.exit(1)

TEXT = (
    "In the winter of nineteen forty-two, a solitary courier slipped across the frozen border carrying a single forged ledger. "
    "Inside were the exact tactical plans and radio codes for thirty-four divisions. "
    "By daybreak, an entire empire had walked straight into a trap... and neither commander realized it yet."
)

DIRECTIVE_DRY_STUDIO = (
    "Acoustic Environment: Dry professional recording studio vocal booth, completely isolated, zero room reverb, zero echo, zero room reflections, dead room acoustic foam, anechoic, direct Shure SM7B broadcast microphone feed with pristine close-mic intimacy. "
    "Audio Profile: Young adult male investigative documentary filmmaker and narrator (styled 1:1 after Fern and LEMMiNO). "
    "Accent: Sleek, neutral modern European-English with crisp, subtle continental precision and broadcast clarity. "
    "Pitch & Tone: Calm, resonant lower-mid baritone, cool, investigative, objective, quietly gripping, mysterious, deadpan curiosity, completely devoid of hype or melodrama. "
    "Delivery: Measured, deliberate pacing, surgical pauses between clauses, razor-sharp crisp consonants, subtle downward inflection at the end of sentences."
)

def synthesize_dry():
    keys = load_api_keys()
    client = genai.Client(api_key=keys[0])
    prompt = (
        f"Speak the following historical narration text aloud.\n"
        f"Strict Acoustic & Vocal Directive:\n{DIRECTIVE_DRY_STUDIO}\n"
        f"Do not read the instructions. Speak only the text in quotes:\n\n"
        f"\"{TEXT}\""
    )
    resp = client.models.generate_content(
        model="gemini-2.5-flash-preview-tts",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_modalities=["AUDIO"],
            speech_config=types.SpeechConfig(
                voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name="Charon")
                )
            )
        )
    )
    raw_wav = OUTPUT_DIR / "02_cold_case_investigator_raw_dry.wav"
    out_wav = OUTPUT_DIR / "02_cold_case_investigator_crisp_studio_master.wav"
    pcm_data = resp.candidates[0].content.parts[0].inline_data.data

    with wave.open(str(raw_wav), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(24000)
        w.writeframes(pcm_data)

    # Master with Studio De-Mud & High-Frequency Air
    # 1. Notch out room resonance at 320 Hz (-3.5 dB)
    # 2. De-box at 500 Hz (-1.5 dB)
    # 3. High-presence boost at 3.6 kHz (+2.8 dB)
    # 4. Air boost at 9 kHz (+2.0 dB)
    # 5. Fast-acting expander/gate to kill floor reverb tails between words
    cmd = [
        "ffmpeg", "-y", "-i", str(raw_wav),
        "-af", (
            "afftdn=nf=-25,"  # subtle FFT noise/room denoiser
            "equalizer=f=90:width_type=q:w=1:g=1.5,"        # clean sub/proximity warmth
            "equalizer=f=320:width_type=q:w=1.2:g=-3.5,"    # NOTCH ROOM RESONANCE (anti-box)
            "equalizer=f=500:width_type=q:w=1.0:g=-1.5,"    # anti-hollow
            "equalizer=f=3600:width_type=q:w=1.0:g=3.0,"    # crisp vocal clarity & consonant definition
            "equalizer=f=9200:width_type=q:w=1.0:g=2.2,"    # studio air sheen
            "acompressor=threshold=-16dB:ratio=2.5:attack=5:release=60," # smooth optical leveling
            "alimiter=limit=-1.0dB"                         # broadcast ceiling
        ),
        "-ar", "24000", str(out_wav)
    ]
    subprocess.run(cmd, check=True)
    raw_wav.unlink(missing_ok=True)
    print(f"[+] Crisp dry studio master generated: {out_wav}")

if __name__ == "__main__":
    synthesize_dry()
