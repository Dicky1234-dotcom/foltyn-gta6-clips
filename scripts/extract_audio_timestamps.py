#!/usr/bin/env python3
"""
Audio Timestamp Extractor for 'The Dancing Plague of 1518'
Extracts sentence- and word-level timestamps using local Whisper (base.en).
Runs 100% locally with ZERO network/hotspot data usage.
Outputs:
  - episodes/dancing_plague_1518/audio_timestamps.json
  - episodes/dancing_plague_1518/audio_timestamps.md
"""

import os
import sys
import json
import time
from pathlib import Path
import torch
import whisper

def format_time(seconds: float) -> str:
    m = int(seconds // 60)
    s = int(seconds % 60)
    ms = int((seconds - int(seconds)) * 100)
    return f"{m:02d}:{s:02d}.{ms:02d}"

def format_time_clean(seconds: float) -> str:
    m = int(seconds // 60)
    s = int(seconds % 60)
    return f"{m:02d}:{s:02d}"

def main():
    torch.set_num_threads(os.cpu_count() or 4)
    audio_path = Path("episodes/dancing_plague_1518/The_Dancing_Plague_1518_Master_Voiceover.wav")
    
    if not audio_path.exists():
        print(f"[!] Audio file not found: {audio_path}")
        sys.exit(1)

    print(f"[*] Loading local Whisper model 'base.en' (threads: {torch.get_num_threads()})...")
    t0 = time.time()
    model = whisper.load_model("base.en")
    print(f"[*] Whisper model loaded in {time.time() - t0:.2f}s")

    print(f"[*] Transcribing master audio ({audio_path.name})...")
    t_start = time.time()
    result = model.transcribe(
        str(audio_path),
        word_timestamps=True,
        verbose=False,
        language="en"
    )
    t_elapsed = time.time() - t_start
    print(f"[*] Transcription complete in {t_elapsed:.2f}s ({t_elapsed/60:.2f} min)")

    segments = result.get("segments", [])
    print(f"[*] Extracted {len(segments)} segments.")

    # Script section markers to align
    SECTION_MARKERS = [
        ("Act 1: Hook", ["Strasbourg. July, 1518", "The summer heat hangs"]),
        ("Act 2: Strasbourg, 1518", ["To understand how something this strange could happen", "understand the city", "busy trading city in the Holy Roman Empire"]),
        ("Act 3: The First Dancer", ["The spark came on July", "Frau Troffea walked out", "Not a celebration"]),
        ("Act 4: The Dancing Spreads", ["dancing did not end with her", "thirty-four more people had joined in", "Thirty-four more"]),
        ("Act 5: The Council's Plan", ["city council", "turned to the doctors", "natural illness", "hot blood"]),
        ("Act 6: The Plan Backfires", ["how very wrong they were", "Instead of fading, the plague grew"]),
        ("Act 7: The Shrine at Saverne", ["council gave its order", "worst-affected dancers", "shrine of Saint Vitus in Saverne"]),
        ("Act 8: What Really Caused It?", ["What could drive so many people", "first suspect is a fungus called ergot"]),
        ("Act 9: Why It Still Matters", ["Why does this story still matter", "shows how powerful fear"])
    ]

    # Process and build clean structured data
    processed_segments = []
    for idx, seg in enumerate(segments):
        start = round(seg["start"], 2)
        end = round(seg["end"], 2)
        txt = seg["text"].strip()
        words = []
        for w in seg.get("words", []):
            words.append({
                "word": w.get("word", "").strip(),
                "start": round(w.get("start", 0.0), 2),
                "end": round(w.get("end", 0.0), 2)
            })

        processed_segments.append({
            "id": idx + 1,
            "start": start,
            "end": end,
            "duration": round(end - start, 2),
            "timecode": f"{format_time_clean(start)} - {format_time_clean(end)}",
            "timecode_exact": f"{format_time(start)} - {format_time(end)}",
            "text": txt,
            "words": words
        })

    # Save JSON
    json_out = Path("episodes/dancing_plague_1518/audio_timestamps.json")
    with open(json_out, "w", encoding="utf-8") as f:
        json.dump({
            "audio_file": str(audio_path),
            "total_segments": len(processed_segments),
            "transcription_time_seconds": round(t_elapsed, 2),
            "segments": processed_segments
        }, f, indent=2)
    print(f"[OK] Saved structured timestamps: {json_out}")

    # Generate Markdown Table
    md_out = Path("episodes/dancing_plague_1518/audio_timestamps.md")
    with open(md_out, "w", encoding="utf-8") as f:
        f.write("# Master Audio Timestamps: The Dancing Plague of 1518\n\n")
        f.write(f"> **Audio Source:** `{audio_path.name}` (24kHz Mono 16-bit PCM WAV)\n")
        f.write(f"> **Narrator:** BOP VOICE (`Charon` / David from *Fern*)\n")
        f.write(f"> **Total Runtime:** {format_time_clean(processed_segments[-1]['end'] if processed_segments else 0)} ({processed_segments[-1]['end'] if processed_segments else 0:.1f}s)\n")
        f.write(f"> **Total Speech Segments:** {len(processed_segments)}\n\n")
        f.write("---\n\n")
        f.write("## Clause & Sentence Timestamps Table\n\n")
        f.write("| # | Timecode | Start (s) | End (s) | Duration (s) | Spoken Narration Cue |\n")
        f.write("| :-: | :---: | :---: | :---: | :---: | :--- |\n")
        for s in processed_segments:
            f.write(f"| {s['id']} | `{s['timecode']}` | `{s['start']:.2f}` | `{s['end']:.2f}` | `{s['duration']:.2f}` | {s['text']} |\n")

    print(f"[OK] Saved Markdown timestamp ledger: {md_out}")

if __name__ == "__main__":
    main()
