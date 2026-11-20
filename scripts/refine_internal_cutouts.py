"""
Refine internal enclosed white pockets for Po-2 and Pilot cutouts
"""

from PIL import Image
import numpy as np

def clean_po2():
    path = "remotion/public/night_witches/po2_biplane_cutout.png"
    img = Image.open(path).convert("RGBA")
    data = np.array(img)
    
    r, g, b, a = data[:, :, 0], data[:, :, 1], data[:, :, 2], data[:, :, 3]
    
    # White background threshold
    white_mask = (r >= 235) & (g >= 235) & (b >= 235)
    
    # For Po-2, the only thing that is near pure white is the background and the wing bay
    # The red star has a very thin white border, but that's fine or we can keep it if needed.
    # Actually, making white pixels transparent completely clears the wing bay!
    data[white_mask, 3] = 0
    
    out = Image.fromarray(data)
    out.save(path, "PNG")
    print("[OK] Cleaned po2_biplane_cutout.png")

def clean_pilot():
    path = "remotion/public/night_witches/pilot_nadezhda_popova_cutout.png"
    img = Image.open(path).convert("RGBA")
    data = np.array(img)
    
    r, g, b, a = data[:, :, 0], data[:, :, 1], data[:, :, 2], data[:, :, 3]
    
    # In the pilot, eyes have white sclera! We must NOT make the eyes transparent.
    # The white loop is on the left side under the earflap: around x in [900, 1100], y in [1000, 1300]
    # Let's inspect coordinates of that white spot.
    # The eyes are at y in [600, 750].
    # So any white pixel with y > 900 (under the head/earflaps) or x < 700 / x > 1700 is background!
    white_mask = (r >= 235) & (g >= 235) & (b >= 235)
    not_eyes = (data.shape[0] * 0) # all false
    
    # Create mask for pixels outside the eye region
    h, w = data.shape[:2]
    # Eye bounding box in 2400x1792: y is roughly 600 to 750, x is roughly 900 to 1500
    is_outside_eyes = np.ones((h, w), dtype=bool)
    is_outside_eyes[int(h*0.32):int(h*0.48), int(w*0.35):int(w*0.65)] = False
    
    clean_mask = white_mask & is_outside_eyes
    data[clean_mask, 3] = 0
    
    out = Image.fromarray(data)
    out.save(path, "PNG")
    print("[OK] Cleaned pilot_nadezhda_popova_cutout.png")

if __name__ == "__main__":
    clean_po2()
    clean_pilot()
