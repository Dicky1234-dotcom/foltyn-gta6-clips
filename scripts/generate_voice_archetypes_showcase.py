#!/usr/bin/env python3
"""
Generates 6 History Channel Voice Archetype Audio Samples
=========================================================
Synthesizes 6 distinct first-second hook archetypes using the Gemini TTS API
and keys from .env so the user can compare their tone, cadence, and authority.
"""

import sys
import time
import wave
from pathlib import Path
from google import genai
from google.genai import types

# Import key loader and WAV stitcher from synthesize_bop_voice
sys.path.insert(0, str(Path(__file__).resolve().parent))
from synthesize_bop_voice import load_api_keys, stitch_pcm_to_wav

ARCHETYPES = [
    {
        "id": "01_cold_case_investigator_BOP_Charon",
        "title": "1. The Cold-Case Investigator (BOP Voice - Charon)",
        "voice": "Charon",
        "directive": (
            "Audio Profile: Young adult male investigative documentary filmmaker and narrator (styled after Fern / Simplicissimus). "
            "Accent: Sleek, neutral modern European-English with crisp, subtle continental precision. "
            "Pitch & Tone: Calm, resonant lower-mid baritone with intimate close-mic broadcast proximity effect. "
            "Cool, investigative, objective, quietly gripping, deadpan curiosity, completely devoid of hype or melodrama. "
            "Delivery: Measured, deliberate pacing, surgical pauses between clauses, subtle downward inflection at the end of sentences."
        ),
        "text": (
            "On the morning of April twelfth... seven men walked into a room in Vienna that officially didn't exist. "
            "They carried no weapons. No briefcases. Just a single ledger bound in black leather. "
            "By midnight, three empires had been signed away... and every witness in that room had vanished from the historical record."
        ),
    },
    {
        "id": "02_weathered_war_correspondent_Orus",
        "title": "2. The Weathered War Correspondent (Gritty Gravitas - Orus)",
        "voice": "Orus",
        "directive": (
            "Audio Profile: Seasoned military historian and frontline war correspondent. "
            "Pitch & Tone: Deep, heavy chest-voice baritone with weathered grit, solemn weight, and close-mic warmth. "
            "Delivery: Deliberate, unhurried, and authoritative cadence. Every sentence lands like a permanent historical record carved in stone. "
            "Zero theatrical hype; pure grounded military authority."
        ),
        "text": (
            "By November... the mud outside Passchendaele was no longer earth. It was a grave. "
            "For ninety days, half a million men fought for a ridge barely forty feet high. "
            "When the guns finally went silent... the map had moved less than five miles."
        ),
    },
    {
        "id": "03_deadpan_cynic_Puck",
        "title": "3. The Deadpan Cynic (Dry Wit & Absurdist Contrast - Puck)",
        "voice": "Puck",
        "directive": (
            "Audio Profile: Sharp, witty historical narrator with bone-dry deadpan delivery (styled after OverSimplified and Historia Civilis). "
            "Pitch & Tone: Crisp, conversational mid-baritone. Effortlessly smart, slightly amused by human stupidity, matter-of-fact understatement. "
            "Delivery: Brisk, clean articulation with sudden flat, deadpan pauses right before absurd punchlines."
        ),
        "text": (
            "In thirteen twenty-five, two rival Italian cities went to war over a wooden bucket. "
            "Not a golden bucket. Not a magical relic. Just an ordinary oak bucket stolen from a well. "
            "Naturally, they mobilized forty thousand troops... and two thousand people died. Here is how that happened."
        ),
    },
    {
        "id": "04_midnight_archivist_Achird",
        "title": "4. The Midnight Archivist (Velvet Nocturnal Mystery - Achird)",
        "voice": "Achird",
        "directive": (
            "Audio Profile: Intimate late-night archival documentary narrator (styled after Nexpo and Barely Sociable). "
            "Pitch & Tone: Soft, velvety low register with heavy close-mic proximity warmth. Quietly unsettling, deeply curious, nocturnal atmosphere. "
            "Delivery: Slow, hypnotic, measured tempo with lingering pauses that draw the listener in like a secret told at two in the morning."
        ),
        "text": (
            "Deep inside the Vatican's fourteenth-century archive... there is a ledger with a single page torn out. "
            "For six hundred years, historians assumed it was lost to fire. "
            "Until last winter... when the missing parchment turned up bricked inside the wall of an abandoned monastery in Prague."
        ),
    },
    {
        "id": "05_prestigious_storyteller_Schedar",
        "title": "5. The Prestigious Storyteller (BBC / Fall of Civilizations - Schedar)",
        "voice": "Schedar",
        "directive": (
            "Audio Profile: Prestige BBC historical documentary narrator (styled after Paul Cooper's Fall of Civilizations). "
            "Pitch & Tone: Warm, lyrical, theatre-trained baritone with crisp classical articulation and rich dynamic depth. "
            "Delivery: Poetic, empathetic, solemn, and cinematic cadence that paints vivid imagery with quiet tragedy and timeless gravitas."
        ),
        "text": (
            "If you dig beneath the stones of Carthage today, your spade will strike a thin, black line of ash. "
            "Inside that layer lie melted bronze coins, shattered pottery, and the silence of a civilization erased in a single week. "
            "This is the story of how Rome didn't just defeat an empire... it deleted a world."
        ),
    },
    {
        "id": "06_kinetic_essayist_Fenrir",
        "title": "6. The High-Velocity Kinetic Essayist (Modern Retention Engine - Fenrir)",
        "voice": "Fenrir",
        "directive": (
            "Audio Profile: Engaging, high-retention investigative video essayist (styled after Johnny Harris and Vox). "
            "Pitch & Tone: Urgent, textured, dynamic mid-register voice driven by intense curiosity and real-time discovery. "
            "Delivery: Punchy, conversational pacing with sharp emphasis on key numbers and tactile micro-pauses that hook the listener immediately."
        ),
        "text": (
            "Look at this straight line right here. Five hundred years ago, a Spanish pope drew it across an uncharted map with a brass ruler. "
            "He had never seen the ocean. He didn't even know South America existed. "
            "Yet that single stroke of ink is the exact reason two hundred million people speak Portuguese today."
        ),
    },
]


def synthesize_archetype(archetype: dict, keys: list[str], key_idx: int) -> tuple[bytes, int]:
    models_to_try = ["gemini-2.5-flash-preview-tts"]
    num_keys = len(keys)
    attempts = 0
    max_attempts = num_keys * 3

    prompt = (
        f"Speak the following transcript aloud using this exact vocal style and delivery.\n"
        f"Style instructions: {archetype['directive']}\n"
        f"Do not read the style instructions aloud. Only speak the transcript below:\n\n"
        f"\"{archetype['text']}\""
    )

    while attempts < max_attempts:
        key = keys[key_idx]
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
                for p in response.candidates[0].content.parts:
                    if getattr(p, "inline_data", None) and p.inline_data.data:
                        return p.inline_data.data, (key_idx + 1) % num_keys
            except Exception as e:
                err_str = str(e)
                print(f" [Key {key_idx} err: {err_str[:80]}]", end="", flush=True)
                time.sleep(1.0)
                break

        key_idx = (key_idx + 1) % num_keys
        attempts += 1
        time.sleep(0.5)

    raise RuntimeError(f"Failed to synthesize {archetype['id']}")


def main():
    keys = load_api_keys()
    if not keys:
        print("[!] No GEMINI_API_KEY found in .env")
        sys.exit(1)

    out_dir = Path("assets/audio/voice_references/archetypes")
    out_dir.mkdir(parents=True, exist_ok=True)

    print(f"[*] Loaded {len(keys)} API key(s). Generating 6 Voice Archetype samples...")
    key_idx = 0
    all_pcm = []

    for arch in ARCHETYPES:
        out_wav = out_dir / f"{arch['id']}.wav"
        print(f"\n-> Synthesizing {arch['title']}...", end="", flush=True)
        pcm_data, key_idx = synthesize_archetype(arch, keys, key_idx)
        dur = stitch_pcm_to_wav([pcm_data], out_wav, pause_seconds=0.0)
        all_pcm.append(pcm_data)
        print(f" Saved! ({dur:.2f}s) -> {out_wav}")
        time.sleep(0.8)

    master_reel = out_dir / "00_ALL_6_ARCHETYPES_COMPARISON_REEL.wav"
    total_dur = stitch_pcm_to_wav(all_pcm, master_reel, pause_seconds=1.5)
    print(f"\n[+] All 6 archetypes generated! Combined comparison reel ({total_dur:.2f}s): {master_reel}")


if __name__ == "__main__":
    main()
