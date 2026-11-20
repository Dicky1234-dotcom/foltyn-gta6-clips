"""
Instant Background Stripper & RGBA Cutout Generator for Act 1
Converts raw #FFFFFF white background generations into 100% transparent PNGs
"""

import os
from PIL import Image
import numpy as np

def strip_white_background(input_path, output_path, threshold=245):
    img = Image.open(input_path).convert("RGBA")
    data = np.array(img)
    
    # Identify near-white background
    r, g, b, a = data[:, :, 0], data[:, :, 1], data[:, :, 2], data[:, :, 3]
    white_mask = (r >= threshold) & (g >= threshold) & (b >= threshold)
    
    # Make white pixels transparent
    data[white_mask, 3] = 0
    
    out_img = Image.fromarray(data)
    out_img.save(output_path, "PNG")
    print(f"[OK] Created transparent cutout: {output_path}")

def process_act1_folder():
    raw_dir = "assets/act1/raw"
    trans_dir = "assets/act1/transparent"
    os.makedirs(trans_dir, exist_ok=True)
    
    if not os.path.exists(raw_dir):
        print(f"Directory {raw_dir} does not exist yet.")
        return
        
    for fname in os.listdir(raw_dir):
        if fname.endswith((".png", ".jpg", ".jpeg")):
            in_p = os.path.join(raw_dir, fname)
            out_p = os.path.join(trans_dir, os.path.splitext(fname)[0] + "_transparent.png")
            strip_white_background(in_p, out_p)

if __name__ == "__main__":
    process_act1_folder()
