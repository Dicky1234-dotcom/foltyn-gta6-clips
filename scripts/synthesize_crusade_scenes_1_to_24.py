#!/usr/bin/env python3
"""
Synthesizer for Scenes 1 to 24 Audio Chunks
Documentary: The Dark Truth Behind the Children's Crusade (1212)
Persona: BOP VOICE - The Cold-Case Investigative Specialist (Charon / 24kHz Studio PCM)
Output Directory: remotion/public/childrens_crusade/audio/scenes/
"""

import sys
import wave
import time
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from scripts.synthesize_bop_voice import (
    load_api_keys,
    synthesize_chunk_pcm,
    stitch_pcm_to_wav,
    apply_studio_broadcast_mastering,
    DEFAULT_VOICE,
    split_into_chunks
)

SCENES = {
    1: "In the blistering summer of 1212, something strange took over the roads of France and Germany.",
    2: "Thousands of people abandoned their villages, dropped their plows, and started walking south. They carried no swords. They wore no armor.",
    3: "They had no siege engines, no warhorses, and no backing from any king or pope. All they carried were wooden crosses, tattered banners, and an unshakable, terrifying conviction. They believed they were going to walk all the way to Jerusalem and take it back for Christendom.",
    4: "And when they reached the Mediterranean Sea? They didn't plan on buying passage on a fleet of ships. They believed that because they were pure of heart, God would literally part the ocean before them, just like he had for Moses, allowing them to walk across the seabed on dry land.",
    5: "History remembers this bizarre, doomed march as the Children's Crusade. For centuries, it has been told as one of the darkest tragedies of the Middle Ages.",
    6: "An army of starry-eyed little kids marched off to the coast, betrayed by wicked merchants, and sold into slavery across the sea.",
    7: "It is a haunting story. There is just one problem. A massive chunk of what you have probably heard about the Children's Crusade is a medieval ghost story, twisted by monks decades after the fact. The truth of what actually happened in the summer of 1212 is far stranger, far messier, and in its own way, even darker than the myth.",
    8: "To understand how thousands of ordinary people could lose their minds and march toward an ocean expecting it to split in half, you have to understand the sheer psychological pressure hanging over Europe in the year 1212. For the average medieval Christian, the world felt like it was rotting from the inside out.",
    9: "Twenty-five years earlier, in 1187, the Muslim sultan Saladin had crushed the Crusader armies at the Battle of Hattin. Not only did Jerusalem fall, but the Christians also lost their most sacred relic: the True Cross, the piece of wood they believed Jesus had been crucified on.",
    10: "The kings of Europe tried to fix it, and they failed miserably. The Third Crusade ended in a stalemate. Then came the Fourth Crusade in 1204, which was a complete moral catastrophe.",
    11: "Instead of fighting to reclaim Jerusalem, debt-ridden Christian knights got sidetracked and brutally sacked Constantinople, the greatest Christian city in the East.",
    12: "People were disgusted. They were terrified. By 1212, religious panic was everywhere. Out of that fever dream, a radical new idea took root among the common people.",
    13: "In southern France, the Church was waging a bloody war against heretics. In Spain, Christian kingdoms were bracing for a massive showdown with Muslim armies. Across Europe, the Church ordered huge, emotional street processions where people walked barefoot, wept, and begged God for mercy.",
    14: "Why had the kings and knights failed? Because they were greedy, sinful, and corrupt. God had abandoned the powerful. If Jerusalem was ever going to be reclaimed, it would not be by armored warlords. It would be by the poor, the humble, and the innocent.",
    15: "All it took was a spark. In the spring of 1212, two sparks hit dry tinder at almost the exact same time.",
    16: "The first spark appeared in June of 1212, in a quiet little French village called Cloyes. His name was Stephen. According to the earliest records, he was a young shepherd boy, roughly twelve years old.",
    17: "One day, while tending his flock, Stephen claimed he was approached by a ragged, poor pilgrim asking for bread. When the boy offered what he had, the stranger revealed his true identity. It was Jesus Christ.",
    18: "Before vanishing, Christ allegedly handed Stephen a sealed letter with strict instructions: deliver this directly to King Philip II of France. Word spread through the French countryside like wildfire.",
    19: "Stephen began marching north toward Saint-Denis, just outside Paris, where the king was holding court.",
    20: "As he walked, something eerie happened. Other young shepherds left their sheep in the fields and fell in line behind him. Townspeople, teenagers, and poor laborers joined the column. Medieval chroniclers claimed his following swelled to 30,000 people. Now, medieval writers loved exaggerating numbers, so the real crowd was almost certainly smaller, likely a few thousand.",
    21: "Still, imagine being a medieval villager watching thousands of dusty, ecstatic youths pouring down the road, waving crosses and chanting the same desperate lines over and over: Lord God, raise up Christendom! Lord God, return to us the True Cross!",
    22: "Some parents were horrified and literally locked their kids inside their houses to stop them from running off with the mob. According to the stories, the kids wept so violently, or simply broke out of their rooms, that nothing could hold them back.",
    23: "When Stephen and his massive, exhausted crowd finally reached Saint-Denis, King Philip II did not see a miracle. He saw a potential riot. Philip was a cold, calculating monarch. He consulted the theological masters at the University of Paris, who examined the situation and quickly told the king that this movement was unauthorized, erratic, and dangerous.",
    24: "Philip didn't even bother staging a grand confrontation. He simply issued a royal decree ordering Stephen and his followers to pack it up and go home. And here is the first big surprise of the real history. In the most reliable contemporary French records, Stephen of Cloyes obeys, the crowd breaks apart, and Stephen completely vanishes from history. No ships. No ocean. Just a quiet, anticlimactic fizzle outside Paris."
}

def main():
    keys = load_api_keys()
    if not keys:
        print("[!] Error: No API keys found in .env.")
        sys.exit(1)

    out_dir = Path("remotion/public/childrens_crusade/audio/scenes").resolve()
    out_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"[*] Synthesizing Scenes 1 to 24 into: {out_dir}")
    key_idx = 0
    manifest_data = []

    for s_id in range(1, 25):
        text = SCENES[s_id]
        wav_path = out_dir / f"scene_{s_id:02d}.wav"
        
        # Check cache
        if wav_path.exists() and wav_path.stat().st_size > 1000:
            with wave.open(str(wav_path), "rb") as w:
                dur = w.getnframes() / float(w.getframerate())
            print(f"  [Scene {s_id:02d}] Cached: {dur:.2f}s ({wav_path.name})")
            manifest_data.append((s_id, wav_path.name, dur, text))
            continue
            
        print(f"  [Scene {s_id:02d}] Synthesizing ({len(text)} chars)...", end="", flush=True)
        chunks = split_into_chunks(text, max_chars=800)
        pcm_chunks = []
        for c in chunks:
            pcm, key_idx = synthesize_chunk_pcm(c, keys, key_idx, voice_name=DEFAULT_VOICE)
            pcm_chunks.append(pcm)
            time.sleep(0.4)
            
        dur = stitch_pcm_to_wav(pcm_chunks, wav_path, pause_seconds=0.3)
        apply_studio_broadcast_mastering(wav_path)
        
        with wave.open(str(wav_path), "rb") as w:
            final_dur = w.getnframes() / float(w.getframerate())
            
        print(f" Done ({final_dur:.2f}s).")
        manifest_data.append((s_id, wav_path.name, final_dur, text))
        time.sleep(0.5)

    print("\n[+] All Scenes 1 to 24 synthesized successfully!")
    for s_id, fname, dur, txt in manifest_data:
        frames = int(round(dur * 30))
        print(f"Scene {s_id:02d} | {fname} | {dur:.2f}s ({frames} frames) | {txt[:50]}...")

if __name__ == "__main__":
    main()
