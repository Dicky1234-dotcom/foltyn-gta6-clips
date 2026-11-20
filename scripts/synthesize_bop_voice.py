#!/usr/bin/env python3
"""
Master Voiceover Synthesizer: BOP VOICE (Bad on Paper Voice)
=============================================================
The official channel voice of "Bad on Paper".
Acoustic Identity:
  Modeled 1:1 on the calm, investigative documentary narrator from YouTube's "Fern"
  (David / Simplicissimus).
  Synthesized via Gemini TTS (Charon) at 24kHz studio PCM WAV.

Acoustic Profile:
- Name: BOP VOICE
- Voice Actor / Engine: Gemini TTS `Charon` (24kHz Mono 16-bit PCM WAV)
- Maturity: Young adult male investigative documentary filmmaker and narrator.
- Accent: Sleek, neutral modern European-English with crisp, subtle continental precision and broadcast clarity.
- Pitch: Calm, resonant lower-mid baritone with intimate close-mic broadcast proximity effect.
- Tone: Cool, investigative, objective, quietly gripping, mysterious, deadpan curiosity, grounded gravitas, completely devoid of hype or melodrama.
- Delivery: Measured, deliberate pacing, surgical pauses between clauses, subtle downward inflection at the end of sentences, clinical yet compelling video essay cadence.

Features:
- Automatic key rotation across all GEMINI_API_KEY entries in .env
- Natural sentence- and clause-bounded chunking with 0.35s breathing pauses
- Clean script extraction (stripping markdown headers, metadata & SFX cues)
- Command-line generation for single lines or full documentary scripts

Usage:
  1. Single Line / Text:
     python scripts/synthesize_bop_voice.py "Text to speak" output.wav

  2. Full Script File:
     python scripts/synthesize_bop_voice.py --script episodes/dancing_plague_1518/The_Dancing_Plague_1518_Script.md --output episodes/dancing_plague_1518/The_Dancing_Plague_1518_Master_Voiceover.wav
"""

import os
import re
import sys
import time
import wave
import argparse
from pathlib import Path

try:
    from google import genai
    from google.genai import types
except ImportError:
    print("[!] google-genai SDK not installed. Install with: pip install google-genai")
    sys.exit(1)

# Official BOP VOICE Directive: The Cold-Case Investigative Specialist (LEMMiNO / Fern Edition - FULL DEFAULT)
BOP_VOICE_DIRECTIVE = (
    "Acoustic Environment: Dry professional recording studio vocal booth, completely isolated, zero room reverb, zero echo, zero room reflections, dead room acoustic foam, anechoic, direct Shure SM7B broadcast microphone feed with pristine close-mic intimacy. "
    "Audio Profile: Young adult male investigative documentary filmmaker and narrator (styled 1:1 after Fern and LEMMiNO). "
    "Accent: Sleek, neutral modern European-English with crisp, subtle continental precision and broadcast clarity. "
    "Pitch & Tone: Calm, resonant lower-mid baritone, cool, investigative, objective, quietly gripping, mysterious, deadpan curiosity, completely devoid of hype or melodrama. "
    "Delivery: Measured, deliberate pacing, surgical pauses between clauses, razor-sharp crisp consonants, subtle downward inflection at the end of sentences."
)

DEFAULT_VOICE = "Charon"  # Official master voice: The Cold-Case Investigative Specialist


def load_api_keys() -> list[str]:
    """Loads all Gemini API keys from local .env and environment variables."""
    keys = []
    
    # Check workspace .env
    env_file = Path(__file__).resolve().parent.parent / ".env"
    if env_file.exists():
        with open(env_file, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                # Support rotation pool
                if line.startswith("GEMINI_API_KEYS="):
                    pool = line.split("=", 1)[1].strip().strip("\"'")
                    for k in pool.split(","):
                        k = k.strip()
                        if k and k not in keys:
                            keys.append(k)
                # Support single keys and fallbacks
                elif "GEMINI_API_KEY" in line and "=" in line:
                    val = line.split("=", 1)[1].strip().strip("\"'")
                    if val and len(val) > 10 and val not in keys:
                        keys.append(val)

    # Check process environment
    env_var = os.environ.get("GEMINI_API_KEY")
    if env_var and env_var not in keys:
        keys.append(env_var)

    return keys


def extract_spoken_script(script_path: Path) -> str:
    """Extracts continuous spoken narration text from markdown, stripping headers & stage cues."""
    with open(script_path, "r", encoding="utf-8") as f:
        text = f.read()

    lines = []
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or line.startswith("---"):
            continue
        if any(line.startswith(prefix) for prefix in [
            "Target Runtime:", "Narrator Persona:", "Script Style:", "Visual Engine:",
            "**Target Runtime:**", "**Narrator Persona:**", "**Script Style:**", "**Visual Engine:**",
            "* **Runtime:**", "* **Narrator Persona:**", "* **Visual Engine:**", "* **Target Runtime:**",
            "* **Script Style:**",
            "Nov ", "Oct ", "Sep ", "Aug ", "Jul ", "Jun ", "May ", "Apr ", "Mar ", "Feb ", "Jan ", "December ", "November "
        ]) or line.startswith("* **") or ("@" in line and len(line) < 40):
            continue

        if line.startswith(">"):
            line = line[1:].strip()

        # Remove bracketed SFX and stage directions: [Record scratch], *[Pause]*, *(whispering)*
        line = re.sub(r"\[.*?\]", "", line)
        line = re.sub(r"\*\[.*?\]\*", "", line)
        line = re.sub(r"\*\(.*?\)\*", "", line)

        # Remove markdown bold/italics
        line = re.sub(r"\*+", "", line).strip()
        if line:
            lines.append(line)

    full_text = " ".join(lines)
    full_text = re.sub(r"\s+", " ", full_text).strip()
    return full_text


def split_into_chunks(text: str, max_chars: int = 800) -> list[str]:
    """Splits text into natural clause- and sentence-bounded chunks for stable synthesis."""
    sentences = re.split(r'(?<=[.!?])\s+', text)
    chunks = []
    current_chunk = []
    current_len = 0

    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence:
            continue
        if current_len + len(sentence) + 1 > max_chars and current_chunk:
            chunks.append(" ".join(current_chunk))
            current_chunk = [sentence]
            current_len = len(sentence)
        else:
            current_chunk.append(sentence)
            current_len += len(sentence) + 1

    if current_chunk:
        chunks.append(" ".join(current_chunk))

    return chunks


def synthesize_chunk_pcm(chunk_text: str, keys: list[str], current_key_idx: int, voice_name: str = DEFAULT_VOICE) -> tuple[bytes, int]:
    """Synthesizes a chunk of text into 24kHz raw PCM bytes, rotating keys upon rate limits."""
    models_to_try = ["gemini-2.5-flash-preview-tts", "gemini-3.8-flash-tts"]
    num_keys = len(keys)
    attempts = 0
    max_attempts = num_keys * 3

    prompt = (
        f"Speak the following historical narration text aloud.\n"
        f"Strict Acoustic & Vocal Directive:\n{BOP_VOICE_DIRECTIVE}\n"
        f"Do not read the instructions. Speak only the text in quotes:\n\n"
        f"\"{chunk_text}\""
    )

    while attempts < max_attempts:
        key = keys[current_key_idx]
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
                                prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name=voice_name)
                            )
                        )
                    )
                )
                for p in response.candidates[0].content.parts:
                    if getattr(p, "inline_data", None) and p.inline_data.data:
                        return p.inline_data.data, (current_key_idx + 1) % num_keys

            except Exception as e:
                err_str = str(e)
                if any(x in err_str for x in ["429", "RESOURCE_EXHAUSTED", "503", "UNAVAILABLE"]):
                    time.sleep(1)
                    break
                else:
                    time.sleep(0.5)
                    break

        current_key_idx = (current_key_idx + 1) % num_keys
        attempts += 1
        time.sleep(0.5)

    raise RuntimeError(f"Exhausted all API keys synthesizing text: {chunk_text[:50]}...")


def stitch_pcm_to_wav(pcm_chunks: list[bytes], output_wav: Path, pause_seconds: float = 0.35) -> float:
    """Combines raw 24kHz PCM chunks with a 0.35s breathing pause into a standard master WAV file."""
    output_wav.parent.mkdir(parents=True, exist_ok=True)
    silence_frames = int(24000 * pause_seconds)
    silence_bytes = b"\x00" * (silence_frames * 2)

    with wave.open(str(output_wav), "wb") as outfile:
        outfile.setnchannels(1)      # Mono
        outfile.setsampwidth(2)      # 16-bit
        outfile.setframerate(24000)  # 24 kHz

        for i, chunk in enumerate(pcm_chunks):
            outfile.writeframes(chunk)
            if i < len(pcm_chunks) - 1:
                outfile.writeframes(silence_bytes)

    with wave.open(str(output_wav), "rb") as w:
        duration = w.getnframes() / float(w.getframerate())

    return duration


def apply_studio_broadcast_mastering(raw_wav: Path):
    """Applies Cold-Case Investigator broadcast mastering: anti-box notch, presence boost, air sheen, and clean opto leveling."""
    import shutil
    import subprocess
    temp_wav = raw_wav.with_suffix(".unmastered.wav")
    shutil.move(str(raw_wav), str(temp_wav))
    cmd = [
        "ffmpeg", "-y", "-i", str(temp_wav),
        "-af", (
            "afftdn=nf=-25,"
            "equalizer=f=90:width_type=q:w=1:g=1.5,"
            "equalizer=f=320:width_type=q:w=1.2:g=-3.5,"
            "equalizer=f=500:width_type=q:w=1.0:g=-1.5,"
            "equalizer=f=3600:width_type=q:w=1.0:g=3.0,"
            "equalizer=f=9200:width_type=q:w=1.0:g=2.2,"
            "acompressor=threshold=-16dB:ratio=2.5:attack=5:release=60,"
            "alimiter=limit=-1.0dB"
        ),
        "-ar", "24000", str(raw_wav)
    ]
    res = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    if res.returncode == 0 and raw_wav.exists():
        temp_wav.unlink(missing_ok=True)
    else:
        if temp_wav.exists():
            shutil.move(str(temp_wav), str(raw_wav))


def voice_text_or_script(input_text_or_path: str, output_path: str, voice_name: str = DEFAULT_VOICE, apply_mastering: bool = True):
    keys = load_api_keys()
    if not keys:
        print("[!] Error: No GEMINI_API_KEY found in .env. Please check your .env file.")
        sys.exit(1)

    out_file = Path(output_path).resolve()
    input_p = Path(input_text_or_path)

    if input_p.exists() and input_p.is_file():
        print(f"[*] Extracting spoken text from script: {input_p}")
        spoken_text = extract_spoken_script(input_p)
    else:
        spoken_text = input_text_or_path

    words = len(spoken_text.split())
    chunks = split_into_chunks(spoken_text, max_chars=800)
    print(f"[*] Official Voice Persona: BOP VOICE - The Cold-Case Investigative Specialist (LEMMiNO / Fern Edition) [Voice: {voice_name}, 24kHz Ultra-Dry Studio PCM]")
    print(f"[*] Total script length: {len(spoken_text)} characters, {words} words across {len(chunks)} chunks.")

    chunk_dir = out_file.parent / "audio_chunks"
    chunk_dir.mkdir(parents=True, exist_ok=True)

    key_idx = 0
    pcm_chunks = []
    t0 = time.time()

    for idx, chunk in enumerate(chunks, 1):
        chunk_file = chunk_dir / f"chunk_{idx:02d}.wav"
        if chunk_file.exists() and chunk_file.stat().st_size > 44:
            print(f"  -> Loading cached chunk {idx}/{len(chunks)} ({chunk_file.name})...", flush=True)
            with wave.open(str(chunk_file), "rb") as wf:
                pcm_data = wf.readframes(wf.getnframes())
            pcm_chunks.append(pcm_data)
            continue

        print(f"  -> Synthesizing chunk {idx}/{len(chunks)} ({len(chunk)} chars)...", end="", flush=True)
        pcm_data, key_idx = synthesize_chunk_pcm(chunk, keys, key_idx, voice_name=voice_name)
        pcm_chunks.append(pcm_data)
        with wave.open(str(chunk_file), "wb") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(24000)
            wf.writeframes(pcm_data)
        print(f" Done ({len(pcm_data)} bytes).")
        time.sleep(0.5)

    duration = stitch_pcm_to_wav(pcm_chunks, out_file)
    if apply_mastering:
        print("  -> Applying Ultra-Dry Broadcast Mastering (Anti-Room Notch + Presence + Air Sheen)...", end="", flush=True)
        apply_studio_broadcast_mastering(out_file)
        print(" Done.")
        with wave.open(str(out_file), "rb") as w:
            duration = w.getnframes() / float(w.getframerate())
    elapsed = time.time() - t0
    print(f"\n[+] Master Voiceover generated successfully!")
    print(f"    File: {out_file}")
    print(f"    Duration: {duration:.2f} seconds ({duration/60:.2f} minutes)")
    print(f"    Elapsed Time: {elapsed:.2f} seconds")
    print(f"    Sample Rate: 24,000 Hz, 16-bit Mono PCM WAV")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Master Voiceover Synthesizer: BOP VOICE Persona")
    parser.add_argument("text", nargs="?", default="", help="Single string of text to speak")
    parser.add_argument("output", nargs="?", default="output_bop.wav", help="Output .wav path")
    parser.add_argument("--script", type=str, help="Path to markdown script file")
    parser.add_argument("--output", "-o", dest="output_flag", type=str, help="Output .wav path for script mode")
    parser.add_argument("--voice", type=str, default=DEFAULT_VOICE, help=f"Prebuilt voice name (default: {DEFAULT_VOICE})")

    args = parser.parse_args()

    if args.script:
        out = args.output_flag if args.output_flag else "master_voiceover.wav"
        voice_text_or_script(args.script, out, voice_name=args.voice)
    elif args.text:
        voice_text_or_script(args.text, args.output, voice_name=args.voice)
    else:
        sample_line = (
            "In July of 1518, a woman named Frau Troffea stepped out into a narrow cobblestone street in Strasbourg... and began to dance. "
            "There was no music. No celebration. Just the sound of her slip shoes dragging across the stones. "
            "Within days, dozens joined her. Within a month, hundreds. Their feet bled, their hearts strained to failure, yet they could not stop. "
            "This is the story of how an entire medieval city literally danced itself to death."
        )
        voice_text_or_script(sample_line, "assets/audio/voice_references/bop_voice_master_sample.wav", voice_name=DEFAULT_VOICE)
