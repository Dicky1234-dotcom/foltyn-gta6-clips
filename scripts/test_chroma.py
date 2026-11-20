import subprocess
from PIL import Image

for name in ['cats/shocked_cat.mp4', 'reactions/why_are_you_running.mp4', 'reactions/emotional_damage.mp4', 'dogs/side_eye_dog_judging.mp4']:
    clean_name = name.replace('/', '_')
    out = f'output/test_{clean_name}.jpg'
    cmd = ['c:/Users/HP/Desktop/clipping/bin/ffmpeg.exe', '-y', '-ss', '00:00:01', '-i', f'assets/reaction_memes/{name}', '-vframes', '1', out]
    subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    im = Image.open(out)
    rgb = im.getpixel((20, 20))
    print(f'{name} pixel (20,20) RGB: {rgb}')
