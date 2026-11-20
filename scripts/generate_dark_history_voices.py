#!/usr/bin/env python3
"""
Generate Dark History Voice Options Showcase
============================================
Synthesizes and masters audio samples for 6 top-tier Dark History vocal archetypes
using the Gemini TTS API with key rotation and broadcast-grade FFmpeg mastering.
"""

import os
import sys
import time
import wave
import subprocess
from pathlib import Path

# Set paths
SCRIPTS_DIR = Path(__file__).resolve().parent
WORKSPACE_DIR = SCRIPTS_DIR.parent
OUTPUT_DIR = WORKSPACE_DIR / "assets" / "audio" / "voice_options_dark_history"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

sys.path.insert(0, str(SCRIPTS_DIR))
from synthesize_bop_voice import load_api_keys

try:
    from google import genai
    from google.genai import types
except ImportError:
    print("[!] google-genai SDK not installed.")
    sys.exit(1)

# Master Dark History Comparison Line
# Crafted with varied phonetics, tension, and natural dramatic pauses
TEST_LINE = (
    "Beneath the frozen mud of the Eastern Front, there is a trench the official maps forgot to name. "
    "In less than forty-eight hours, an entire regiment vanished inside it... "
    "not from enemy artillery, but from an order their own high command refused to sign."
)

ARCHETYPES = [
    {
        "id": "01_nocturnal_archivist_achird",
        "title": "Option 1: The Nocturnal Archivist (Velvet Mystery / Late-Night Dossier)",
        "voice": "Achird",
        "style_notes": "Modeled after Nexpo, Barely Sociable, Nick Crowley. Intimate, hushed, velvety lower register, 2 AM cold-case atmosphere.",
        "directive": (
            "Audio Profile: Intimate late-night archival documentary narrator (styled after Nexpo and Barely Sociable). "
            "Pitch & Tone: Soft, velvety low register with heavy close-mic proximity warmth. Quietly unsettling, deeply curious, nocturnal atmosphere. "
            "Delivery: Slow, hypnotic, measured tempo with lingering pauses that draw the listener into a chilling historical secret."
        ),
        "mastering_preset": "nocturnal_proximity"
    },
    {
        "id": "02_weathered_war_chronicler_orus",
        "title": "Option 2: The Weathered Battlefield Chronicler (Gritty Trench Gravitas)",
        "voice": "Orus",
        "style_notes": "Modeled after Dan Carlin (Hardcore History) and Wartime Stories. Deep, rugged, heavy chest baritone with solemn historical weight.",
        "directive": (
            "Audio Profile: Seasoned military historian and frontline war correspondent (styled after Dan Carlin). "
            "Pitch & Tone: Deep, heavy chest-voice baritone with weathered grit, solemn weight, and close-mic warmth. "
            "Delivery: Deliberate, unhurried, and authoritative cadence. Every sentence lands like an epitaph carved into stone. Zero theatrical hype; pure visceral gravitas."
        ),
        "mastering_preset": "heavy_chest"
    },
    {
        "id": "03_melancholic_elegist_schedar",
        "title": "Option 3: The Melancholic Elegist (Classical Archival Requiem)",
        "voice": "Schedar",
        "style_notes": "Modeled after Paul Cooper (Fall of Civilizations) and BBC Timeline. Poetic, tragic grandeur, theatre-trained baritone mourning lost worlds.",
        "directive": (
            "Audio Profile: Prestige BBC historical documentary narrator (styled after Paul Cooper's Fall of Civilizations). "
            "Accent: Classical British English with refined, lyrical articulation. "
            "Pitch & Tone: Warm, lyrical baritone with rich dynamic depth and empathetic gravitas. "
            "Delivery: Poetic, reflective, solemn, and cinematic cadence that paints vivid imagery with quiet tragedy and timeless authority."
        ),
        "mastering_preset": "cinematic_hall"
    },
    {
        "id": "04_clinical_forensic_charon",
        "title": "Option 4: The Cold Forensic Inquest (Clinical Autopsy)",
        "voice": "Charon",
        "style_notes": "Modeled after Fascinating Horror, Plainly Difficult, and Cold-Case Inquests. Unflinching, surgical precision, deadpan analytical realism.",
        "directive": (
            "Audio Profile: Forensic investigator and historical inquest specialist. "
            "Accent: Sleek, neutral modern European-English with crisp precision and broadcast clarity. "
            "Pitch & Tone: Calm, resonant lower-mid baritone, cool, investigative, objective, unflinching, completely devoid of melodrama. "
            "Delivery: Measured, deliberate clinical pacing, surgical pauses between clauses, razor-sharp crisp consonants, reciting grim facts with chilling detachment."
        ),
        "mastering_preset": "clinical_clean"
    },
    {
        "id": "05_velvet_gothic_requiem_kore",
        "title": "Option 5: The Velvet Gothic Requiem (Haunting Atmospheric Inquest)",
        "voice": "Kore",
        "style_notes": "Modeled after Nordic Noir, Lore (Aaron Mahnke), and historical true crime. Eerie, velvety, calm, hauntingly composed female presence.",
        "directive": (
            "Audio Profile: Prestige dark historical investigator and Gothic documentary narrator. "
            "Pitch & Tone: Rich, velvety, calm lower-mid register with quiet, haunting solemnity. Intimate close-mic warmth. "
            "Delivery: Unnervingly composed, hypnotic, slow, measured cadence with delicate pauses that let the eerie historical reality linger in the air."
        ),
        "mastering_preset": "velvet_warmth"
    },
    {
        "id": "06_investigative_insider_fenrir",
        "title": "Option 6: The Urgent Conspiratorial Insider (Declassified Whistleblower)",
        "voice": "Fenrir",
        "style_notes": "Modeled after Wendigoon and investigative video essayists. Textured, punchy, high-retention mid-register driven by intense discovery.",
        "directive": (
            "Audio Profile: Engaging, high-retention investigative documentary filmmaker (styled after Wendigoon and modern video essays). "
            "Pitch & Tone: Textured, urgent, dynamic mid-register voice driven by intense curiosity and suppressed alarm. "
            "Delivery: Punchy, conversational pacing with sharp emphasis and tactile micro-pauses that pull the listener directly into the room."
        ),
        "mastering_preset": "punchy_broadcast"
    }
]


def synthesize_voice(archetype: dict, keys: list[str], start_key_idx: int) -> tuple[bytes, int]:
    """Synthesizes text with key rotation and robust retry logic."""
    models_to_try = ["gemini-2.5-flash-preview-tts", "gemini-3.8-flash-tts"]
    num_keys = len(keys)
    attempts = 0
    max_attempts = num_keys * 3

    prompt = (
        f"Speak the following historical narration text aloud.\n"
        f"Strict Vocal Style & Delivery Instructions:\n{archetype['directive']}\n"
        f"Do not read the instructions aloud. Speak only the exact text in quotes below:\n\n"
        f"\"{TEST_LINE}\""
    )

    current_idx = start_key_idx
    while attempts < max_attempts:
        key = keys[current_idx]
        for model in models_to_try:
            try:
                client = genai.Client(api_key=key)
                response = client.models.generate_content(
                    model=model,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_modalities=["AUDIO"],
                        speech_config=types.SpeechConfig(
                            voice_config=types.VoiceConfig(
                                prebuilt_voice_config=types.PrebuiltVoiceConfig(
                                    voice_name=archetype["voice"]
                                )
                            )
                        ),
                    ),
                )
                for part in response.candidates[0].content.parts:
                    if getattr(part, "inline_data", None) and part.inline_data.data:
                        next_idx = (current_idx + 1) % num_keys
                        return part.inline_data.data, next_idx
            except Exception as e:
                err_msg = str(e)
                # If rate limit or connection issue, move to next key
                if any(x in err_msg for x in ["429", "RESOURCE_EXHAUSTED", "10060", "503", "UNAVAILABLE"]):
                    time.sleep(1.0)
                    break
                else:
                    time.sleep(0.5)
                    break

        current_idx = (current_idx + 1) % num_keys
        attempts += 1
        time.sleep(0.5)

    raise RuntimeError(f"All keys exhausted synthesizing {archetype['title']}")


def apply_dark_history_mastering(raw_wav: Path, mastered_wav: Path, preset: str):
    """Applies archetype-specific EQ, dynamics, and broadcast mastering."""
    if preset == "nocturnal_proximity":
        # Heavy intimate proximity effect, gentle anti-box, velvety smooth air
        filter_str = (
            "afftdn=nf=-25,"
            "equalizer=f=110:width_type=q:w=1.2:g=3.0,"
            "equalizer=f=350:width_type=q:w=1.0:g=-2.5,"
            "equalizer=f=3600:width_type=q:w=1.0:g=2.2,"
            "equalizer=f=9500:width_type=q:w=1.0:g=1.8,"
            "acompressor=threshold=-18dB:ratio=2.8:attack=6:release=70,"
            "alimiter=limit=-1.0dB"
        )
    elif preset == "heavy_chest":
        # Heavy chest resonance for Dan Carlin war correspondent gravitas
        filter_str = (
            "afftdn=nf=-25,"
            "equalizer=f=95:width_type=q:w=1.0:g=3.8,"
            "equalizer=f=320:width_type=q:w=1.2:g=-3.0,"
            "equalizer=f=480:width_type=q:w=1.0:g=-2.0,"
            "equalizer=f=2800:width_type=q:w=1.0:g=2.0,"
            "acompressor=threshold=-16dB:ratio=3.2:attack=5:release=80,"
            "alimiter=limit=-1.0dB"
        )
    elif preset == "cinematic_hall":
        # Fall of Civilizations: lyrical depth, warm body, delicate high-shelf air
        filter_str = (
            "afftdn=nf=-25,"
            "equalizer=f=130:width_type=q:w=1.0:g=2.0,"
            "equalizer=f=380:width_type=q:w=1.2:g=-2.0,"
            "equalizer=f=4200:width_type=q:w=1.0:g=1.8,"
            "equalizer=f=9000:width_type=q:w=1.0:g=2.5,"
            "acompressor=threshold=-19dB:ratio=2.4:attack=8:release=90,"
            "alimiter=limit=-1.0dB"
        )
    elif preset == "clinical_clean":
        # Fascinating Horror: surgical flat response, crisp consonants, zero mud
        filter_str = (
            "afftdn=nf=-25,"
            "equalizer=f=90:width_type=q:w=1.0:g=1.5,"
            "equalizer=f=320:width_type=q:w=1.2:g=-3.5,"
            "equalizer=f=500:width_type=q:w=1.0:g=-1.5,"
            "equalizer=f=3600:width_type=q:w=1.0:g=3.0,"
            "equalizer=f=9200:width_type=q:w=1.0:g=2.2,"
            "acompressor=threshold=-16dB:ratio=2.5:attack=5:release=60,"
            "alimiter=limit=-1.0dB"
        )
    elif preset == "velvet_warmth":
        # Haunting female velvet tone: warm mid-lows, smooth de-essing, intimate presence
        filter_str = (
            "afftdn=nf=-25,"
            "equalizer=f=150:width_type=q:w=1.0:g=2.2,"
            "equalizer=f=400:width_type=q:w=1.2:g=-2.0,"
            "equalizer=f=3200:width_type=q:w=1.0:g=1.8,"
            "equalizer=f=8500:width_type=q:w=1.0:g=2.0,"
            "acompressor=threshold=-18dB:ratio=2.6:attack=7:release=75,"
            "alimiter=limit=-1.0dB"
        )
    elif preset == "punchy_broadcast":
        # High retention insider: punchy midrange, rapid attack leveling, crisp presence
        filter_str = (
            "afftdn=nf=-25,"
            "equalizer=f=120:width_type=q:w=1.0:g=1.8,"
            "equalizer=f=350:width_type=q:w=1.2:g=-2.5,"
            "equalizer=f=3800:width_type=q:w=1.0:g=2.5,"
            "acompressor=threshold=-15dB:ratio=3.0:attack=4:release=50,"
            "alimiter=limit=-1.0dB"
        )
    else:
        filter_str = "alimiter=limit=-1.0dB"

    cmd = [
        "ffmpeg", "-y", "-i", str(raw_wav),
        "-af", filter_str,
        "-ar", "24000", str(mastered_wav)
    ]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)


def main():
    print("=" * 75)
    print("  DARK HISTORY VOICE RECOMMENDATION & SYNTHESIS SUITE")
    print("=" * 75)
    print(f"Master Dark History Comparison Passage:\n\"{TEST_LINE}\"\n")

    keys = load_api_keys()
    if not keys:
        print("[!] No Gemini API keys found in .env.")
        sys.exit(1)

    print(f"[*] Loaded {len(keys)} API keys for rotation.")
    print(f"[*] Target Directory: {OUTPUT_DIR}\n")

    key_idx = 0
    results = []

    for i, arch in enumerate(ARCHETYPES, 1):
        print(f"[{i}/{len(ARCHETYPES)}] Processing: {arch['title']} (Voice: {arch['voice']})...")
        raw_wav = OUTPUT_DIR / f"{arch['id']}_raw.wav"
        mastered_wav = OUTPUT_DIR / f"{arch['id']}.wav"

        t0 = time.time()
        try:
            pcm_data, key_idx = synthesize_voice(arch, keys, key_idx)
            
            # Save raw WAV
            with wave.open(str(raw_wav), "wb") as w:
                w.setnchannels(1)
                w.setsampwidth(2)
                w.setframerate(24000)
                w.writeframes(pcm_data)

            # Apply broadcast mastering
            apply_dark_history_mastering(raw_wav, mastered_wav, arch["mastering_preset"])
            
            # Clean up raw wav
            raw_wav.unlink(missing_ok=True)

            with wave.open(str(mastered_wav), "rb") as w:
                duration = w.getnframes() / float(w.getframerate())

            elapsed = time.time() - t0
            print(f"    -> Generated in {elapsed:.1f}s | Duration: {duration:.2f}s | Path: {mastered_wav.name}")
            results.append({
                "id": arch["id"],
                "title": arch["title"],
                "voice": arch["voice"],
                "file": mastered_wav,
                "duration": duration,
                "notes": arch["style_notes"]
            })
        except Exception as e:
            print(f"    [!] Error synthesizing {arch['title']}: {e}")

        # Sleep between requests to protect RPM quotas
        time.sleep(2.0)

    print("\n" + "=" * 75)
    print("  SYNTHESIS SUMMARY")
    print("=" * 75)
    for res in results:
        print(f"- {res['title']}: {res['file'].name} ({res['duration']:.2f}s)")
    print("=" * 75)


if __name__ == "__main__":
    main()
