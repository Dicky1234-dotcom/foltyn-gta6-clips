import os
import numpy as np
from PIL import Image
import scipy.ndimage as ndi
from skimage.restoration import inpaint_biharmonic

INPUT_PATH = r"C:/Users/HP/.gemini/antigravity/brain/77955d73-2d56-4b41-a672-44749fb0d0ed/previews/03_midnight_indigo_amber.jpg"
LAYERS_DIR = r"C:/Users/HP/.gemini/antigravity/brain/77955d73-2d56-4b41-a672-44749fb0d0ed/layers"
os.makedirs(LAYERS_DIR, exist_ok=True)

img = Image.open(INPUT_PATH).convert("RGB")
arr = np.array(img)
H, W, _ = arr.shape
print(f"Loaded image: {W}x{H}")

# =========================================================================
# 1. LAYER 1: FOREGROUND ARCHWAY & OVERHANGING FOLIAGE
# =========================================================================
# The archway stones are on the left (x < 155), right (x > 865), 
# top connecting arch (y < 125 with parabolic curve), and foreground shrubs at bottom corners.
arch_mask = np.zeros((H, W), dtype=bool)

# Left column
for y in range(H):
    # Left arch edge
    # Arch curves inward at the top
    if y < 140:
        x_limit = int(145 + (140 - y) * 0.45)
    elif y > 350:
        x_limit = int(160 + (y - 350) * 0.4) # bottom bush
    else:
        x_limit = 145
    arch_mask[y, :min(x_limit, W)] = True

# Right column
for y in range(H):
    if y < 140:
        x_start = int(865 - (140 - y) * 0.45)
    elif y > 340:
        x_start = int(850 - (y - 340) * 0.5) # bottom bush
    else:
        x_start = 865
    arch_mask[y, max(x_start, 0):] = True

# Top arch bridge
for x in range(W):
    # Parabolic arch top
    # Vertex around y=25 at x=512
    dx = (x - W / 2.0) / (W / 2.0)
    top_y = int(22 + 65 * (dx ** 2))
    arch_mask[:top_y, x] = True

# Refine with edge darkness threshold: arch stones have dark outer borders
# Smooth edges with distance transform for anti-aliasing
arch_dist = ndi.distance_transform_edt(arch_mask) - ndi.distance_transform_edt(~arch_mask)
arch_alpha = np.clip(arch_dist + 1.5, 0.0, 3.0) / 3.0

layer_arch = np.zeros((H, W, 4), dtype=np.uint8)
layer_arch[..., :3] = arr
layer_arch[..., 3] = (arch_alpha * 255).astype(np.uint8)
Image.fromarray(layer_arch).save(os.path.join(LAYERS_DIR, "layer1_archway.png"))
print("Saved layer1_archway.png")

# =========================================================================
# 2. LAYER 2: HERO MIDGROUND - THE QUEEN
# =========================================================================
queen_box = np.zeros((H, W), dtype=bool)
# Queen coordinates: y: 80 to 415, x: 410 to 600
# Refine boundary using color warmth & brightness
qy1, qy2 = 75, 415
qx1, qx2 = 415, 595

r = arr[qy1:qy2, qx1:qx2, 0].astype(float)
g = arr[qy1:qy2, qx1:qx2, 1].astype(float)
b = arr[qy1:qy2, qx1:qx2, 2].astype(float)
warmth = (r - b) + 0.4 * (g - b)
lum = 0.2126 * r + 0.7152 * g + 0.0722 * b

# Gown is warm gold, collar is white, face is warm skin
q_cand = (warmth > 8) | (lum > 55) | ((r > 35) & (g > 25) & (b < 35))
q_filled = ndi.binary_fill_holes(ndi.binary_closing(q_cand, structure=np.ones((9, 9))))
# Clean boundary
q_clean = ndi.binary_opening(q_filled, structure=np.ones((3, 3)))

queen_mask_full = np.zeros((H, W), dtype=bool)
queen_mask_full[qy1:qy2, qx1:qx2] = q_clean

# Anti-alias mask
q_dist = ndi.distance_transform_edt(queen_mask_full) - ndi.distance_transform_edt(~queen_mask_full)
q_alpha = np.clip(q_dist + 1.2, 0.0, 2.5) / 2.5

layer_queen = np.zeros((H, W, 4), dtype=np.uint8)
layer_queen[..., :3] = arr
layer_queen[..., 3] = (q_alpha * 255).astype(np.uint8)
Image.fromarray(layer_queen).save(os.path.join(LAYERS_DIR, "layer2_queen.png"))
print("Saved layer2_queen.png")

# =========================================================================
# 3. LAYER 3: MIDGROUND LEFT - GUARD & INVESTIGATOR
# =========================================================================
gy1, gy2 = 160, 390
gx1, gx2 = 225, 420

gr = arr[gy1:gy2, gx1:gx2, 0].astype(float)
gg = arr[gy1:gy2, gx1:gx2, 1].astype(float)
gb = arr[gy1:gy2, gx1:gx2, 2].astype(float)
g_lum = 0.2126 * gr + 0.7152 * gg + 0.0722 * gb

# Torch flame + guard + investigator
# Torch has extreme warmth and brightness
torch = (gr > 120) & (gg > 80)
# Armor and clothing
figures = (g_lum > 22) | ((gr - gb) > 5)
g_cand = torch | figures
g_filled = ndi.binary_fill_holes(ndi.binary_closing(g_cand, structure=np.ones((7, 7))))

guards_mask_full = np.zeros((H, W), dtype=bool)
guards_mask_full[gy1:gy2, gx1:gx2] = g_filled

# Exclude overlap with archway
guards_mask_full = guards_mask_full & (~arch_mask)

g_dist = ndi.distance_transform_edt(guards_mask_full) - ndi.distance_transform_edt(~guards_mask_full)
g_alpha = np.clip(g_dist + 1.2, 0.0, 2.5) / 2.5

layer_guards = np.zeros((H, W, 4), dtype=np.uint8)
layer_guards[..., :3] = arr
layer_guards[..., 3] = (g_alpha * 255).astype(np.uint8)
Image.fromarray(layer_guards).save(os.path.join(LAYERS_DIR, "layer3_guards.png"))
print("Saved layer3_guards.png")

# =========================================================================
# 4. LAYER 4: MIDGROUND RIGHT - VICTIM & LANTERN
# =========================================================================
vy1, vy2 = 305, 430
vx1, vx2 = 595, 835

vr = arr[vy1:vy2, vx1:vx2, 0].astype(float)
vg = arr[vy1:vy2, vx1:vx2, 1].astype(float)
vb = arr[vy1:vy2, vx1:vx2, 2].astype(float)
v_lum = 0.2126 * vr + 0.7152 * vg + 0.0722 * vb

# Cloak + lantern + staff
v_cand = (v_lum > 15) | ((vr - vb) > 2)
v_filled = ndi.binary_fill_holes(ndi.binary_closing(v_cand, structure=np.ones((7, 7))))

victim_mask_full = np.zeros((H, W), dtype=bool)
victim_mask_full[vy1:vy2, vx1:vx2] = v_filled
victim_mask_full = victim_mask_full & (~arch_mask) & (~queen_mask_full)

v_dist = ndi.distance_transform_edt(victim_mask_full) - ndi.distance_transform_edt(~victim_mask_full)
v_alpha = np.clip(v_dist + 1.2, 0.0, 2.5) / 2.5

layer_victim = np.zeros((H, W, 4), dtype=np.uint8)
layer_victim[..., :3] = arr
layer_victim[..., 3] = (v_alpha * 255).astype(np.uint8)
Image.fromarray(layer_victim).save(os.path.join(LAYERS_DIR, "layer4_victim.png"))
print("Saved layer4_victim.png")

# =========================================================================
# 5. LAYER 5: CLEAN BACKGROUND PLATE (INPAINTED BEHIND ALL FIGURES)
# =========================================================================
# Combine all character masks to create inpaint mask
inpaint_mask = queen_mask_full | guards_mask_full | victim_mask_full
# Dilate slightly so inpaint covers boundary pixels cleanly
inpaint_mask_dilated = ndi.binary_dilation(inpaint_mask, structure=np.ones((9, 9)))

print("Inpainting background behind Queen, Guards, and Victim...")
# Normalize float in [0, 1] for scikit-image
arr_float = arr.astype(np.float32) / 255.0
bg_inpainted = inpaint_biharmonic(arr_float, inpaint_mask_dilated, channel_axis=-1)
bg_inpainted_u8 = np.clip(bg_inpainted * 255.0, 0, 255).astype(np.uint8)

Image.fromarray(bg_inpainted_u8).save(os.path.join(LAYERS_DIR, "layer5_clean_background.jpg"), quality=95)
print("Saved layer5_clean_background.jpg")

print("\nAll depth layers created successfully!")
