import os
import sys
import subprocess
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter

LAYERS_DIR = r"C:/Users/HP/.gemini/antigravity/brain/77955d73-2d56-4b41-a672-44749fb0d0ed/layers"
OUTPUT_MP4 = r"c:/Users/HP/Desktop/New folder/videos/crime_scene_2_5d_depth.mp4"
TOTAL_FRAMES = 90
FPS = 30
W, H = 1024, 434

print(f"Loading layers from {LAYERS_DIR}...")
layer_bg = Image.open(os.path.join(LAYERS_DIR, "layer5_clean_background.jpg")).convert("RGBA")
layer_victim = Image.open(os.path.join(LAYERS_DIR, "layer4_victim.png")).convert("RGBA")
layer_guards = Image.open(os.path.join(LAYERS_DIR, "layer3_guards.png")).convert("RGBA")
layer_queen = Image.open(os.path.join(LAYERS_DIR, "layer2_queen.png")).convert("RGBA")
layer_arch = Image.open(os.path.join(LAYERS_DIR, "layer1_archway.png")).convert("RGBA")

# Split archway into left and right halves for true 3D camera push-through
arch_arr = np.array(layer_arch)
arch_left_arr = arch_arr.copy()
arch_left_arr[:, 512:, 3] = 0
arch_right_arr = arch_arr.copy()
arch_right_arr[:, :512, 3] = 0

layer_arch_left = Image.fromarray(arch_left_arr)
layer_arch_right = Image.fromarray(arch_right_arr)

print("Layers loaded successfully. Setting up FFmpeg pipe...")

ffmpeg_cmd = [
    "ffmpeg", "-y",
    "-f", "rawvideo",
    "-vcodec", "rawvideo",
    "-s", f"{W}x{H}",
    "-pix_fmt", "rgb24",
    "-r", str(FPS),
    "-i", "-",
    "-c:v", "libx264",
    "-preset", "medium",
    "-crf", "18",
    "-pix_fmt", "yuv420p",
    "-movflags", "+faststart",
    OUTPUT_MP4
]

proc = subprocess.Popen(ffmpeg_cmd, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)

def cubic_ease_in_out(t):
    # Smooth Hermite S-curve
    return t * t * (3.0 - 2.0 * t)

# Precompute torchlight radial glow coordinates
y_grid, x_grid = np.ogrid[:H, :W]
torch_center = (199, 314)
dist_torch = np.sqrt((x_grid - torch_center[1])**2 + ((y_grid - torch_center[0]) * 1.3)**2)
torch_base_falloff = np.clip(1.0 - dist_torch / 380.0, 0.0, 1.0) ** 2.2
torch_base_falloff = torch_base_falloff[..., None].astype(np.float32)

def scale_and_place(img, scale, origin_x, origin_y, offset_x=0.0, offset_y=0.0):
    new_w = int(round(W * scale))
    new_h = int(round(H * scale))
    scaled = img.resize((new_w, new_h), Image.Resampling.BICUBIC)
    
    # Calculate top-left based on origin
    left = int(round(origin_x - origin_x * scale + offset_x))
    top = int(round(origin_y - origin_y * scale + offset_y))
    
    canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    canvas.paste(scaled, (left, top), scaled)
    return canvas

print("Rendering 90 frames of 2.5D multiplane parallax...")

for frame_idx in range(TOTAL_FRAMES):
    progress = frame_idx / float(TOTAL_FRAMES - 1)
    t = cubic_ease_in_out(progress)
    
    # 1. Background Layer (Parallax: 0.35x)
    # Slow subtle push-in from 1.000 to 1.020
    bg_scale = 1.000 + 0.020 * t
    comp_bg = scale_and_place(layer_bg, bg_scale, 512, 190)
    
    # 2. Midground Right: Murdered Victim & Lantern (Parallax: 1.0x)
    # Scale from 1.000 to 1.035
    vic_scale = 1.000 + 0.035 * t
    comp_vic = scale_and_place(layer_victim, vic_scale, 720, 360)
    
    # 3. Midground Left: Torch Guard & Investigator (Parallax: 1.1x)
    # Scale from 1.000 to 1.045
    guard_scale = 1.000 + 0.045 * t
    comp_guard = scale_and_place(layer_guards, guard_scale, 280, 270)
    
    # 4. Hero Center: The Queen (Parallax: 1.0x with subtle breathing idle)
    # Breathing: subtle 1.2% vertical squash/stretch at 1.4 Hz
    breath = np.sin(2.0 * np.pi * (frame_idx / FPS) * 0.8) * 0.004
    queen_scale_x = 1.000 + 0.040 * t
    queen_scale_y = (1.000 + 0.040 * t) + breath
    
    qw = int(round(W * queen_scale_x))
    qh = int(round(H * queen_scale_y))
    q_scaled = layer_queen.resize((qw, qh), Image.Resampling.BICUBIC)
    q_left = int(round(505 - 505 * queen_scale_x))
    q_top = int(round(240 - 240 * queen_scale_y))
    comp_queen = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    comp_queen.paste(q_scaled, (q_left, q_top), q_scaled)
    
    # 5. Foreground Archway (Parallax: 1.4x)
    # Arch columns move outward as camera pushes through
    arch_scale = 1.000 + 0.085 * t
    left_drift = -14.0 * t
    right_drift = 14.0 * t
    
    comp_arch_l = scale_and_place(layer_arch_left, arch_scale, 0, 217, offset_x=left_drift)
    comp_arch_r = scale_and_place(layer_arch_right, arch_scale, W, 217, offset_x=right_drift)
    
    # Composite all layers from back to front
    frame_canvas = Image.new("RGBA", (W, H), (0, 0, 0, 255))
    frame_canvas.alpha_composite(comp_bg)
    frame_canvas.alpha_composite(comp_vic)
    frame_canvas.alpha_composite(comp_guard)
    frame_canvas.alpha_composite(comp_queen)
    frame_canvas.alpha_composite(comp_arch_l)
    frame_canvas.alpha_composite(comp_arch_r)
    
    frame_rgb = np.array(frame_canvas.convert("RGB"), dtype=np.float32)
    
    # 6. Procedural Torch Flame Flicker & Light Pulse
    # Synchronized 14Hz flicker with organic harmonic variance
    flicker = 1.0 + 0.15 * np.sin(2.0 * np.pi * frame_idx * 0.42) + 0.08 * np.sin(2.0 * np.pi * frame_idx * 0.73)
    torch_glow = torch_base_falloff * flicker * np.array([0.18, 0.11, 0.03], dtype=np.float32) * 255.0
    frame_rgb = np.clip(frame_rgb + torch_glow, 0.0, 255.0)
    
    # Send frame to FFmpeg pipe
    proc.stdin.write(frame_rgb.astype(np.uint8).tobytes())
    
    if (frame_idx + 1) % 15 == 0 or frame_idx == TOTAL_FRAMES - 1:
        print(f"Rendered frame {frame_idx + 1}/{TOTAL_FRAMES}")

proc.stdin.close()
stderr_output = proc.stderr.read()
proc.wait()

if proc.returncode != 0:
    print(f"FFmpeg Error (exit code {proc.returncode}):")
    print(stderr_output.decode('utf-8', errors='ignore'))
    sys.exit(1)

print(f"\nVideo compiled successfully!")
print(f"Output path: {OUTPUT_MP4}")
