import numpy as np
from PIL import Image, ImageFilter, ImageEnhance, ImageOps

pristine_path = r"C:\Users\HP\.gemini\antigravity\brain\198bb7dd-462d-4e40-abc7-bb43088348f2\mature_scene_benchmark_1795120838410.jpg"
output_path = r"visual style/mature_scene_benchmark.jpg"

base_img = Image.open(pristine_path).convert("RGB")
w, h = base_img.size

# 1. Multi-octave physical paper fiber and tooth
np.random.seed(42)
# Fine paper tooth (micro grain)
tooth = np.random.normal(0, 1, (h, w)).astype(np.float32)

# Mid-frequency pulp fibers (clumping paper fibers)
pulp_raw = np.random.normal(0, 1, (h // 2, w // 2)).astype(np.float32)
pulp_img = Image.fromarray(pulp_raw).resize((w, h), Image.Resampling.BILINEAR)
pulp = np.array(pulp_img, dtype=np.float32)

# Low-frequency watercolor bloom stains (cauliflower drying rings)
bloom_raw = np.random.normal(0, 1, (h // 6, w // 6)).astype(np.float32)
bloom_img = Image.fromarray(bloom_raw).resize((w, h), Image.Resampling.BICUBIC)
bloom = np.array(bloom_img, dtype=np.float32)

# 2. Precise anatomical skin mask (Face, Neck, Chest, Hands)
base_np = np.array(base_img, dtype=np.float32)
r, g, b = base_np[:, :, 0], base_np[:, :, 1], base_np[:, :, 2]
y_indices, x_indices = np.indices((h, w))

# Spatial masks for anatomical landmarks (w=1376, h=768)
# Face: center (688, 205)
face_mask = np.exp(-(((x_indices - 688) / 38)**2 + ((y_indices - 208) / 48)**2))
# Neck & Throat: center (688, 268)
neck_mask = np.exp(-(((x_indices - 688) / 26)**2 + ((y_indices - 268) / 22)**2))
# Upper chest triangle (just above bodice)
chest_mask = np.exp(-(((x_indices - 688) / 28)**2 + ((y_indices - 295) / 16)**2))
# Hands: (640, 475) and (785, 470)
hand_l = np.exp(-(((x_indices - 640) / 24)**2 + ((y_indices - 475) / 35)**2))
hand_r = np.exp(-(((x_indices - 780) / 24)**2 + ((y_indices - 465) / 35)**2))

anatomy_weight = np.clip(face_mask * 1.3 + neck_mask * 1.5 + chest_mask * 1.1 + hand_l * 1.2 + hand_r * 1.2, 0.0, 1.0)

# Color condition for skin (excludes dark black ink lines so outlines remain razor sharp)
luminance = 0.299 * r + 0.587 * g + 0.114 * b
is_skin = (
    (luminance > 45) & (luminance < 235) &  # keep dark ink outlines intact
    (r > g) & (g >= b) &                    # warm tone
    (r - b > 14)                            # saturated skin
)

skin_mask = anatomy_weight * is_skin.astype(np.float32)
# Slightly blur mask for smooth natural feathering
skin_mask_img = Image.fromarray((skin_mask * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(radius=1.5))
skin_mask_f = np.array(skin_mask_img, dtype=np.float32) / 255.0

# 3. High-Intensity Graphite Cross-Hatching Strokes
# Natural hand angle 1: 44 degrees
rad1 = np.radians(44)
proj1 = x_indices * np.cos(rad1) + y_indices * np.sin(rad1)
# Natural hand angle 2: 126 degrees (cross)
rad2 = np.radians(126)
proj2 = x_indices * np.cos(rad2) + y_indices * np.sin(rad2)
# Steep vertical hatching for neck shadow: 82 degrees
rad3 = np.radians(82)
proj3 = x_indices * np.cos(rad3) + y_indices * np.sin(rad3)

# Add subtle organic jitter so lines look genuinely hand-drawn with a physical pencil
jitter1 = np.sin(y_indices * 0.12) * 1.2
jitter2 = np.cos(x_indices * 0.10) * 1.2

# Sharp pencil lines: power-curve creates crisp thin graphite cuts with paper spacing
hatch1 = np.power(np.maximum(0.0, np.sin((proj1 + jitter1) * 1.25)), 2.8)
hatch2 = np.power(np.maximum(0.0, np.sin((proj2 + jitter2) * 1.05)), 3.2)
hatch3 = np.power(np.maximum(0.0, np.sin((proj3) * 1.4)), 3.0)

# Depth modulation: Shadow areas get dense cross-hatch, lit areas get fine single tooth
shadow_intensity = np.clip((210.0 - luminance) / 95.0, 0.0, 1.0)
mid_intensity = np.clip((luminance - 110.0) / 80.0, 0.0, 1.0)

# Combine hatching layers with high amplitude
graphite_strokes = (
    hatch1 * 26.0 * shadow_intensity +
    hatch2 * 22.0 * np.power(shadow_intensity, 1.5) +
    hatch3 * 28.0 * (neck_mask * 1.2) +
    hatch1 * 8.0 * mid_intensity  # faint graphite grain in midtones
)

# 4. Heavy Gouache Pigment Pooling & Water Blooms
# Simulates dry pigment rings along drying boundaries
bloom_edges = np.abs(bloom) * 2.2
mottling = (bloom * 7.0 + bloom_edges * 4.0 + pulp * 5.0)

# 5. Rough Dry-Paper Flecks (pencil skipping over heavy cold-press vellum)
paper_fleck = np.where(tooth > 0.8, tooth * 12.0, tooth * 3.0)

# Combined High-Intensity Skin Weathering Delta
# Darkens shadow planes with dark charcoal/umber pencil strokes
delta_r = -graphite_strokes * 1.3 - mottling * 0.9 + paper_fleck * 0.8
delta_g = -graphite_strokes * 1.6 - mottling * 1.2 + paper_fleck * 0.7
delta_b = -graphite_strokes * 2.0 - mottling * 1.6 + paper_fleck * 0.6

# Apply to Queen's skin
base_np[:, :, 0] += delta_r * skin_mask_f
base_np[:, :, 1] += delta_g * skin_mask_f
base_np[:, :, 2] += delta_b * skin_mask_f

# 6. Global Archival Paper Overlay (binding print layer across entire plate)
global_paper = (tooth * 4.5 + pulp * 5.0) * 0.85
for c in range(3):
    base_np[:, :, c] += global_paper

# 7. Rich Print Contrast and Warmth (matching visual.jpg gouache tones)
base_np = np.clip(base_np, 0, 255).astype(np.uint8)
final_img = Image.fromarray(base_np, mode="RGB")
final_img = ImageEnhance.Contrast(final_img).enhance(1.05)
final_img = ImageEnhance.Color(final_img).enhance(0.98)

final_img.save(output_path, quality=96)
print(f"High-intensity physical texturing successfully applied to {output_path}")
