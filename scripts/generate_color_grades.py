import os
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter

INPUT_PATH = r"C:/Users/HP/.gemini/antigravity/brain/77955d73-2d56-4b41-a672-44749fb0d0ed/.user_uploaded/media_1795120051721_95e406b1.jpg"
OUTPUT_DIR = r"C:/Users/HP/.gemini/antigravity/brain/77955d73-2d56-4b41-a672-44749fb0d0ed/previews"
os.makedirs(OUTPUT_DIR, exist_ok=True)

def load_image(path):
    img = Image.open(path).convert("RGB")
    return np.array(img, dtype=np.float32) / 255.0

def save_image(arr, path):
    arr_clipped = np.clip(arr * 255.0, 0, 255).astype(np.uint8)
    Image.fromarray(arr_clipped).save(path, quality=96)
    print(f"Saved: {path}")

def get_luminance(rgb):
    return 0.2126 * rgb[..., 0] + 0.7152 * rgb[..., 1] + 0.0722 * rgb[..., 2]

def adjust_saturation(rgb, factor):
    lum = get_luminance(rgb)[..., None]
    return np.clip(lum + factor * (rgb - lum), 0.0, 1.0)

def filmic_s_curve(x, contrast=1.20, pivot=0.30):
    # Filmic S-curve anchored around visual pivot
    x = np.clip(x, 0.0, 1.0)
    # Smooth Hermite-like transition
    shifted = x - pivot
    curved = pivot + np.sign(shifted) * (np.abs(shifted) ** (1.0 / contrast) if contrast < 1.0 else np.abs(shifted) ** contrast)
    return np.clip(curved, 0.0, 1.0)

def create_vignette(shape, intensity=0.60, start_radius=0.38, center=None):
    H, W = shape[:2]
    if center is None:
        cy, cx = H * 0.48, W * 0.52
    else:
        cy, cx = center
    y, x = np.ogrid[:H, :W]
    dist = np.sqrt(((x - cx) / (W * 0.60)) ** 2 + ((y - cy) / (H * 0.60)) ** 2)
    vignette = np.clip((dist - start_radius) / (1.25 - start_radius), 0.0, 1.0)
    vignette = vignette * vignette * (3.0 - 2.0 * vignette)
    return (1.0 - vignette[..., None] * intensity).astype(np.float32)

def add_film_grain(rgb, intensity=0.030, seed=42):
    rng = np.random.default_rng(seed)
    noise = rng.normal(0.0, 1.0, rgb.shape)
    noise = gaussian_filter(noise, sigma=(0.55, 0.55, 0))
    lum = get_luminance(rgb)[..., None]
    # Organic response curve: Grain is most visible in midtones, less in deep blacks or peak highlights
    grain_mask = np.sin(np.pi * np.clip(lum, 0.05, 0.95))
    return np.clip(rgb + noise * (intensity * (0.35 + 0.65 * grain_mask)), 0.0, 1.0)

def torch_falloff(shape, center=(199, 314), radius=480):
    H, W = shape[:2]
    y, x = np.ogrid[:H, :W]
    dist = np.sqrt((x - center[1]) ** 2 + ((y - center[0]) * 1.25) ** 2)
    falloff = np.clip(1.0 - (dist / radius), 0.0, 1.0)
    return (falloff ** 1.8)[..., None].astype(np.float32)

# =====================================================================
# PRESET 1: THE TENEBRIST NOCTURNE (Baroque Chiaroscuro / Caravaggesque)
# =====================================================================
def grade_tenebrist_nocturne(base):
    # Style: Caravaggio / Georges de La Tour / Fincher Zodiac Night
    # Rich chiaroscuro with motivated torch warmth brushing across the Queen
    lum = get_luminance(base)[..., None]
    
    # 1. Subtle exposure curve: preserve midtone facial readability while deepening shadows
    contrast_pass = np.where(base < 0.25, base * 0.88, base ** 1.10)
    
    # 2. Motivated Torchlight Bloom
    t_mask = torch_falloff(base.shape, center=(199, 314), radius=520)
    warm_amber = np.array([1.0, 0.64, 0.18], dtype=np.float32)
    # Light illuminates midtones and highlights organically
    torch_light = t_mask * warm_amber * 0.22 * (0.2 + 0.8 * lum)
    
    # 3. Deep bituminous shadows with warm umber undertones
    shadow_mask = np.clip((0.30 - lum) / 0.30, 0.0, 1.0) ** 1.3
    umber_shadow = np.array([0.08, 0.06, 0.05], dtype=np.float32)
    
    graded = contrast_pass * (1.0 - shadow_mask * 0.20) + umber_shadow * shadow_mask * 0.20
    graded = graded + torch_light
    
    # 4. Selective pop on the Queen's golden brocade gown
    r, g, b = base[..., 0], base[..., 1], base[..., 2]
    gold_mask = np.clip((r - b) * 2.2 * (g - b) * 3.0, 0.0, 1.0)[..., None]
    graded = graded + gold_mask * np.array([0.08, 0.05, 0.01], dtype=np.float32)
    
    # 5. Vignette focused on Queen and Crime Scene
    vig = create_vignette(base.shape, intensity=0.62, start_radius=0.36)
    graded = graded * vig
    
    # 6. Fine archival grain
    graded = add_film_grain(graded, intensity=0.030, seed=101)
    return np.clip(graded, 0.0, 1.0)

# =====================================================================
# PRESET 2: COLD-CASE BLEACH BYPASS (Fincher / Mindhunter / Nordic Noir)
# =====================================================================
def grade_cold_case_bleach_bypass(base):
    # Style: Mindhunter / True Detective / Nordic Noir
    # Gritty silver retention, desaturated cold tones, stark textural clarity
    lum = get_luminance(base)[..., None]
    
    # 1. Desaturation
    desat = adjust_saturation(base, 0.46)
    
    # 2. Bleach bypass silver retention curve (high-contrast luminance overlay)
    high_contrast_lum = np.where(lum < 0.5, 2.0 * (lum ** 1.25), 1.0 - 2.0 * ((1.0 - lum) ** 1.25))
    # Soft light / overlay blend
    bleach = np.where(desat < 0.5, 2.0 * desat * high_contrast_lum, 1.0 - 2.0 * (1.0 - desat) * (1.0 - high_contrast_lum))
    
    # Blend bleach with desat (55% bleach bypass)
    graded = 0.45 * desat + 0.55 * bleach
    
    # 3. Cold slate-cyan cast in shadows and stone
    shadow_mask = np.clip((0.42 - lum) / 0.42, 0.0, 1.0) ** 1.2
    cyan_tint = np.array([0.06, 0.12, 0.18], dtype=np.float32)
    graded = graded * (1.0 - shadow_mask * 0.28) + cyan_tint * shadow_mask * 0.28
    
    # 4. Selective accent: Torch retains a pale, piercing industrial-amber core
    r, g, b = base[..., 0], base[..., 1], base[..., 2]
    flame_mask = np.clip((r - b) * 3.5 * (r > 0.55) * (g > 0.35), 0.0, 1.0)[..., None]
    graded = graded * (1.0 - flame_mask) + (base * np.array([1.08, 0.90, 0.50], dtype=np.float32)) * flame_mask
    
    # 5. Vignette
    vig = create_vignette(base.shape, intensity=0.55, start_radius=0.40)
    graded = graded * vig
    
    # 6. Fine film grain
    graded = add_film_grain(graded, intensity=0.035, seed=202)
    return np.clip(graded, 0.0, 1.0)

# =====================================================================
# PRESET 3: MIDNIGHT INDIGO & AMBER POP (Peaky Blinders / Prestige Noir)
# =====================================================================
def grade_midnight_indigo_amber(base):
    # Style: Peaky Blinders / Taboo / Hey Historically Benchmark
    # High-contrast complementary palette: deep midnight cobalt shadows vs. glowing golden amber
    lum = get_luminance(base)[..., None]
    
    # 1. Midnight blue environmental wash
    indigo_tint = np.array([0.72, 0.86, 1.18], dtype=np.float32)
    cool_pass = base * indigo_tint
    cool_pass = adjust_saturation(cool_pass, 0.82)
    
    # 2. Warm amber spectrum boost (Queen's gown, torch, lantern)
    r, g, b = base[..., 0], base[..., 1], base[..., 2]
    warm_mask = np.clip(((r - b) * 2.2 + (g - b) * 0.8), 0.0, 1.0)[..., None]
    
    t_mask = torch_falloff(base.shape, center=(199, 314), radius=420)
    warm_pop_mask = np.clip(warm_mask * 1.3 + t_mask * 0.35, 0.0, 1.0)
    
    warm_pass = base * np.array([1.22, 0.98, 0.68], dtype=np.float32)
    warm_pass = adjust_saturation(warm_pass, 1.32)
    
    # Combine cool environment + warm pop
    graded = cool_pass * (1.0 - warm_pop_mask) + warm_pass * warm_pop_mask
    
    # Filmic S-curve: deep velvety blacks, gentle shoulder rolloff
    graded = np.where(graded < 0.20, graded * 0.92, graded ** 1.08)
    
    # Vignette
    vig = create_vignette(base.shape, intensity=0.64, start_radius=0.34)
    graded = graded * vig
    
    # Film grain
    graded = add_film_grain(graded, intensity=0.030, seed=303)
    return np.clip(graded, 0.0, 1.0)

# =====================================================================
# PRESET 4: ARCHIVAL VELLUM & SEPIA DOSSIER (17th-Century Court Chronicle)
# =====================================================================
def grade_archival_vellum_dossier(base):
    # Style: Ancient court dossier / illuminated crime record / LEMMiNO folio
    # Rich warm sepia vellum tone with iron-gall ink shadows
    lum = get_luminance(base)[..., None]
    
    # 1. Monochromatic base
    mono = adjust_saturation(base, 0.15)
    
    # 2. Sepia ink transfer
    sepia_r = mono[..., 0] * 1.12 + 0.03
    sepia_g = mono[..., 1] * 0.96 + 0.015
    sepia_b = mono[..., 2] * 0.74 - 0.005
    sepia = np.stack([sepia_r, sepia_g, sepia_b], axis=-1)
    
    # 3. Retain historical pigment swatches (ochre gown, torch flame)
    graded = 0.60 * sepia + 0.40 * base
    
    # 4. Soft archival film curve (slight matte lift in deepest black, rolled highlights)
    graded = np.clip(graded * 0.96 + 0.02, 0.0, 1.0)
    
    # 5. Parchment edge-aging vignette
    H, W = base.shape[:2]
    y, x = np.ogrid[:H, :W]
    edge_dist = np.sqrt(((x - W*0.5)/(W*0.56))**2 + ((y - H*0.48)/(H*0.56))**2)
    edge_stain = np.clip((edge_dist - 0.42) / 0.75, 0.0, 1.0)[..., None]
    graded = graded * (1.0 - edge_stain * 0.38) + edge_stain * 0.38 * np.array([0.15, 0.10, 0.06], dtype=np.float32)
    
    # 6. Fine parchment paper grain
    graded = add_film_grain(graded, intensity=0.038, seed=404)
    return np.clip(graded, 0.0, 1.0)

# =====================================================================
# PRESET 5: GOTHIC MACABRE / SINISTER GASLIGHT (Penny Dreadful / Sleepy Hollow)
# =====================================================================
def grade_gothic_macabre(base):
    # Style: Penny Dreadful / Sleepy Hollow / Gothic Crime Mystery
    # Sickly moss-slate undertones, pale melancholic skin, ominous murder scene shadow
    lum = get_luminance(base)[..., None]
    
    # 1. Sickly moss-slate undertone in shadows & sky (#131B15)
    shadow_mask = np.clip((0.45 - lum) / 0.45, 0.0, 1.0) ** 1.2
    moss_slate = np.array([0.08, 0.13, 0.10], dtype=np.float32)
    
    # 2. Desaturate overall, skewing toward gloomy overcast
    desat = adjust_saturation(base, 0.52)
    graded = desat * (1.0 - shadow_mask * 0.30) + moss_slate * shadow_mask * 0.30
    
    # 3. Atmospheric ground dread: deepen the victim area on the right
    H, W = base.shape[:2]
    y, x = np.ogrid[:H, :W]
    victim_dist = np.sqrt(((x - 730) / 190.0) ** 2 + ((y - 350) / 110.0) ** 2)
    victim_shadow = np.clip(1.0 - victim_dist, 0.0, 1.0)[..., None] ** 2
    graded = graded * (1.0 - victim_shadow * 0.18)
    
    # 4. Sulfurous flame accent
    r, g, b = base[..., 0], base[..., 1], base[..., 2]
    torch_mask = np.clip((r - b) * 3.0 * (r > 0.5), 0.0, 1.0)[..., None]
    graded = graded * (1.0 - torch_mask) + (base * np.array([1.10, 0.94, 0.40], dtype=np.float32)) * torch_mask
    
    # 5. Moody contrast curve
    graded = np.where(graded < 0.25, graded * 0.90, graded ** 1.12)
    
    # 6. Heavy gothic vignette
    vig = create_vignette(base.shape, intensity=0.68, start_radius=0.32)
    graded = graded * vig
    
    # 7. Film grain
    graded = add_film_grain(graded, intensity=0.035, seed=505)
    return np.clip(graded, 0.0, 1.0)

# =====================================================================
# EXECUTION
# =====================================================================
def main():
    print("Loading original image...")
    base = load_image(INPUT_PATH)
    
    save_image(base, os.path.join(OUTPUT_DIR, "00_original.jpg"))
    
    print("\nGrading Preview 1: The Tenebrist Nocturne...")
    p1 = grade_tenebrist_nocturne(base)
    save_image(p1, os.path.join(OUTPUT_DIR, "01_baroque_tenebrism.jpg"))
    
    print("\nGrading Preview 2: Cold-Case Bleach Bypass...")
    p2 = grade_cold_case_bleach_bypass(base)
    save_image(p2, os.path.join(OUTPUT_DIR, "02_cold_case_bleach_bypass.jpg"))
    
    print("\nGrading Preview 3: Midnight Indigo & Amber Pop...")
    p3 = grade_midnight_indigo_amber(base)
    save_image(p3, os.path.join(OUTPUT_DIR, "03_midnight_indigo_amber.jpg"))
    
    print("\nGrading Preview 4: Archival Vellum & Sepia Dossier...")
    p4 = grade_archival_vellum_dossier(base)
    save_image(p4, os.path.join(OUTPUT_DIR, "04_archival_vellum_dossier.jpg"))
    
    print("\nGrading Preview 5: Gothic Macabre / Sinister Gaslight...")
    p5 = grade_gothic_macabre(base)
    save_image(p5, os.path.join(OUTPUT_DIR, "05_gothic_macabre.jpg"))
    
    print("\nAll 5 previews rendered successfully!")

if __name__ == "__main__":
    main()
