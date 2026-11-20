import json
import re

with open('FOLTYN PLAYING GTA 6!!/clean_transcript.json', 'r', encoding='utf-8') as f:
    lines = json.load(f)

# Keywords with weighting
INTERRUPT_KEYWORDS = {
    'gta 6': 20, 'rockstar': 15, 'omg': 15, 'no way': 15, 'bro': 12, 'what the': 15,
    'glitch': 15, 'secret': 15, 'cops': 12, 'police': 12, 'insane': 12, 'crazy': 12,
    'look at': 14, 'wait wait': 14, 'run': 10, 'shoot': 10, 'kill': 10, 'died': 12,
    'car': 8, 'graphics': 12, 'real': 8, 'money': 10, 'banned': 15, 'hack': 15,
    'impossible': 12, 'holy': 12, 'funny': 10, 'caught': 12, 'heist': 15
}

HOOK_OPENERS = [
    'look at this', 'no way', 'what is this', 'wait', 'bro', 'omg',
    'did you see', 'what happened', 'how did', 'why is', 'i swear',
    'check this out', 'is that'
]

candidates = []

for i in range(len(lines)):
    start_time = lines[i]['start']
    first_text = lines[i]['text'].lower()
    
    # Opening hook score
    opener_score = 0
    for opener in HOOK_OPENERS:
        if opener in first_text:
            opener_score += 25
            break
            
    for j in range(i, len(lines)):
        end_time = lines[j]['end']
        dur = end_time - start_time
        
        if 25.0 <= dur <= 60.0:
            window_lines = lines[i:j+1]
            full_text = " ".join([l['text'] for l in window_lines])
            full_text_lower = full_text.lower()
            
            score = opener_score
            for kw, weight in INTERRUPT_KEYWORDS.items():
                count = len(re.findall(r'\b' + re.escape(kw) + r'\b', full_text_lower))
                score += count * weight
                
            # Density of speech
            word_count = len(full_text.split())
            wps = word_count / dur
            if wps > 2.2: # High energy/fast dialogue
                score += 15
                
            candidates.append({
                'start': start_time,
                'end': end_time,
                'duration': round(dur, 1),
                'score': score,
                'hook': lines[i]['text'][:60],
                'full_text': full_text
            })
            
        elif dur > 60.0:
            break

# Sort by score descending and deduplicate overlapping segments
candidates.sort(key=lambda x: x['score'], reverse=True)
selected = []

for c in candidates:
    overlap = False
    for s in selected:
        # Check overlap
        if not (c['end'] <= s['start'] or c['start'] >= s['end']):
            overlap = True
            break
    if not overlap:
        selected.append(c)
        if len(selected) >= 12:
            break

print(f"Found {len(selected)} top moments:")
for idx, s in enumerate(selected, 1):
    m_start = int(s['start'] // 60)
    s_start = int(s['start'] % 60)
    m_end = int(s['end'] // 60)
    s_end = int(s['end'] % 60)
    print(f"\n--- CLIP {idx} ---")
    print(f"Timecode: {m_start:02d}:{s_start:02d} -> {m_end:02d}:{s_end:02d} ({s['start']:.1f}s - {s['end']:.1f}s, dur: {s['duration']}s)")
    print(f"Score: {s['score']}")
    print(f"Hook Opening: \"{s['hook']}...\"")
    print(f"Transcript: {s['full_text']}")

with open('FOLTYN PLAYING GTA 6!!/top_clips.json', 'w', encoding='utf-8') as f:
    json.dump(selected, f, indent=2)
