import json

with open("FOLTYN PLAYING GTA 6!!/clean_transcript.json", "r", encoding="utf-8") as f:
    data = json.load(f)

for item in data:
    if 3340.0 <= item['start'] <= 3380.0:
        print(f"{item['start']:.1f}s - {item['end']:.1f}s: {item['text']}")
