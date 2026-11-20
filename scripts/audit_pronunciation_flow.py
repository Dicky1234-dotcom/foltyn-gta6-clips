#!/usr/bin/env python3
"""
Deep Forensic Review: Pronunciation, Flow, and Acoustic Integrity
Audits word pronunciation, cadence shifts, pauses, and script fidelity.
"""

import re
import json
import numpy as np
from pathlib import Path

WORKSPACE = Path(__file__).resolve().parent.parent
EP_DIR = WORKSPACE / "The Man Who Blinded the Soviet Air Force"

with open(EP_DIR / "full_narration_clean.txt", "r", encoding="utf-8") as f:
    clean_script = f.read()

with open(EP_DIR / "audio_timestamps.json", "r", encoding="utf-8") as f:
    ts_data = json.load(f)

segments = ts_data["segments"]

# 1. Pacing & WPM per section
sections_stats = {}
for s in segments:
    sec = s["section"]
    if sec not in sections_stats:
        sections_stats[sec] = {"words": 0, "duration": 0.0, "segments": 0, "start": s["start"], "end": s["end"]}
    sections_stats[sec]["words"] += s["word_count"]
    sections_stats[sec]["duration"] += s["duration"]
    sections_stats[sec]["segments"] += 1
    sections_stats[sec]["end"] = s["end"]

print("=" * 70)
print("  1. FLOW & PACING DYNAMICS ACROSS SECTIONS")
print("=" * 70)
for sec, data in sections_stats.items():
    effective_time = (data["end"] - data["start"]) / 60.0
    wpm = data["words"] / effective_time if effective_time > 0 else 0
    print(f"[{sec}]")
    print(f"   Words: {data['words']:<4} | Net Duration: {data['duration']:>5.1f}s | Span: {data['start']:>5.1f}s - {data['end']:>5.1f}s")
    print(f"   Speaking Velocity: {wpm:.1f} WPM (Target: 135-150 WPM)")

# 2. Pause & Breathing Distribution
pauses = []
for i in range(len(segments) - 1):
    gap = segments[i+1]["start"] - segments[i]["end"]
    if gap > 0:
        pauses.append(gap)

pauses = np.array(pauses)
print("\n" + "=" * 70)
print("  2. PAUSE & BREATHING RHYTHM")
print("=" * 70)
print(f"Total Inter-Clause Pauses: {len(pauses)}")
print(f"Median Pause Duration:     {np.median(pauses):.2f}s (Target: 0.30 - 0.45s)")
print(f"Mean Pause Duration:       {np.mean(pauses):.2f}s")
print(f"Standard Deviation:        {np.std(pauses):.2f}s")
print(f"Min Pause:                 {np.min(pauses):.2f}s")
print(f"Max Pause (Section Gaps):  {np.max(pauses):.2f}s")

# 3. Proper Nouns & Foreign Pronunciation Audit
key_terms = [
    ("Adolf Tolkachev", ["Adolf", "Tolkachev"]),
    ("Aktyubinsk", ["Aktyubinsk", "Octubinsk", "Aktobe"]),
    ("Kazakhstan", ["Kazakhstan"]),
    ("NIIR", ["NIIR", "NER", "Near"]),
    ("Phazotron", ["Phazotron", "Fazotron", "Phasotron"]),
    ("Solzhenitsyn", ["Solzhenitsyn"]),
    ("Sakharov", ["Sakharov"]),
    ("KGB", ["KGB"]),
    ("CIA", ["CIA"]),
    ("Pentax", ["Pentax"]),
    ("Jack-in-the-Box", ["Jack-in-the-Box", "Jack in the box"]),
    ("MiG-29", ["MiG-29", "MIG", "29"]),
    ("MiG-31", ["MiG-31", "31"]),
    ("Su-27", ["Su-27", "SU"]),
    ("David Hoffman", ["David", "Hoffman"]),
    ("The Billion Dollar Spy", ["Billion", "Dollar", "Spy"]),
    ("Edward Lee Howard", ["Edward", "Lee", "Howard"]),
    ("Aldrich Ames", ["Aldrich", "Ames"]),
    ("Lubyanka", ["Lubyanka"])
]

print("\n" + "=" * 70)
print("  3. PROPER NOUN & TECHNICAL PRONUNCIATION AUDIT")
print("=" * 70)
for formal_name, variants in key_terms:
    found_matches = []
    for s in segments:
        for v in variants:
            if re.search(rf"\b{re.escape(v)}\b", s["text"], re.IGNORECASE):
                found_matches.append((s["id"], s["timecode"], s["text"]))
                break
    print(f"• Term: {formal_name:<22} | Transcribed Instances: {len(found_matches)}")
    for sid, tc, txt in found_matches[:2]:
        # Highlight in text
        print(f"    [#{sid} @ {tc}]: \"{txt.strip()}\"")

# 4. Word fidelity check (Original words vs Whisper words)
orig_clean = re.sub(r"\[[A-Z0-9]+\]", "", clean_script)
orig_tokens = [w.lower().strip(".,!?;:\"'()[]") for w in orig_clean.split() if w.strip()]
trans_tokens = [w["word"].lower().strip(".,!?;:\"'()[]") for s in segments for w in s["words"] if w["word"].strip()]

print("\n" + "=" * 70)
print("  4. SCRIPT FIDELITY & WORD COMPLETENESS")
print("=" * 70)
print(f"Original Script Word Count:    {len(orig_tokens)} words")
print(f"Transcribed Word Count:        {len(trans_tokens)} words")
print(f"Completeness Ratio:            {(len(trans_tokens)/len(orig_tokens))*100:.1f}%")

print("\n=== SEGMENTS 45 to 55 ===")
for s in segments[45:55]:
    print(f"#{s['id']} @ {s['timecode']}: {s['text']}")
