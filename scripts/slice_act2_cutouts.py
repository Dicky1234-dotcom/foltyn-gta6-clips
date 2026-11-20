"""
Extract cropped clean cutouts for Marina Raskova and Major Bershanskaya
"""

from PIL import Image
import numpy as np
import sys
sys.path.append('scripts')
from extract_clean_cutout import extract_cutout

def extract_marina():
    in_path = "assets/generated_images/Marina Raskova (Hero Aviator Cutout.jpg"
    img = Image.open(in_path).convert("RGBA")
    w, h = img.size
    
    # Crop the center 3/4 standing figure (roughly x from 38% to 68%, y from 10% to 98%)
    crop_box = (int(w * 0.38), int(h * 0.08), int(w * 0.68), int(h * 0.98))
    cropped = img.crop(crop_box)
    
    temp_crop = "remotion/public/night_witches/temp_marina.jpg"
    cropped.convert("RGB").save(temp_crop, "JPEG")
    
    out_path = "remotion/public/night_witches/marina_raskova_cutout.png"
    extract_cutout(temp_crop, out_path, threshold=235)
    print(f"[OK] Extracted Marina Raskova Cutout: {out_path}")

def extract_bershanskaya():
    in_path = "assets/generated_images/Major Yevdokiya Bershanskaya.jpg"
    img = Image.open(in_path).convert("RGBA")
    w, h = img.size
    
    # Crop the second figure (3/4 view): roughly x from 27% to 50%, y from 10% to 98%
    crop_box = (int(w * 0.27), int(h * 0.09), int(w * 0.50), int(h * 0.98))
    cropped = img.crop(crop_box)
    
    temp_crop = "remotion/public/night_witches/temp_bershanskaya.jpg"
    cropped.convert("RGB").save(temp_crop, "JPEG")
    
    out_path = "remotion/public/night_witches/major_bershanskaya_cutout.png"
    extract_cutout(temp_crop, out_path, threshold=235)
    print(f"[OK] Extracted Major Bershanskaya Cutout: {out_path}")

def copy_schematic():
    in_path = "assets/generated_images/Polikarpov Po-2 Plywood & Fabric Cutaway Schematic.jpg"
    out_path = "remotion/public/night_witches/po2_cutaway_schematic.jpg"
    img = Image.open(in_path)
    img.save(out_path, "JPEG")
    print(f"[OK] Copied Po-2 Schematic Plate: {out_path}")

if __name__ == "__main__":
    extract_marina()
    extract_bershanskaya()
    copy_schematic()
