import json
import re

def parse_subs():
    with open('FOLTYN PLAYING GTA 6!!/subs.en.json3', 'r', encoding='utf-8') as f:
        data = json.load(f)

    events = data.get('events', [])
    clean_lines = []
    
    for ev in events:
        if 'segs' not in ev:
            continue
        t_start = ev.get('tStartMs', 0) / 1000.0
        d_dur = ev.get('dDurationMs', 0) / 1000.0
        text = "".join(s.get('utf8', '') for s in ev['segs']).replace('\n', ' ').strip()
        text = re.sub(r'>>\s*', '', text)
        if text:
            clean_lines.append({
                'start': round(t_start, 2),
                'end': round(t_start + d_dur, 2),
                'text': text
            })

    # Merge very close lines into coherent dialogue phrases
    merged = []
    for l in clean_lines:
        if not merged:
            merged.append(l)
        else:
            prev = merged[-1]
            if l['start'] <= prev['end'] + 0.3 and (l['end'] - prev['start']) < 8.0:
                prev['end'] = max(prev['end'], l['end'])
                prev['text'] += " " + l['text']
            else:
                merged.append(l)

    print(f"Total merged sentences/lines: {len(merged)}")
    with open('FOLTYN PLAYING GTA 6!!/clean_transcript.json', 'w', encoding='utf-8') as f:
        json.dump(merged, f, indent=2)

if __name__ == '__main__':
    parse_subs()
