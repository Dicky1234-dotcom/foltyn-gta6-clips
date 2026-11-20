import numpy as np
from PIL import Image
from scipy.ndimage import map_coordinates
import os
import time

def main():
    print("[Animator] Starting Gritty Graphic Novel Animation Generator...")
    start_time = time.time()
    
    src_path = "assets/generated_images/gritty_noir_colored_handdrawn_character.jpg"
    full_img = Image.open(src_path).convert("RGB")
    arr = np.array(full_img, dtype=np.float32)
    H, W, C = arr.shape
    
    # Coordinates in full image (848 x 1264):
    # Both eyes box in full image: x in [365, 470], y in [120, 160]
    # Eye centers in full image:
    eye_lx, eye_ly = 395.0, 145.0  # character's right, viewer's left
    eye_rx, eye_ry = 437.0, 144.0  # character's left, viewer's right
    
    total_frames = 84  # 3.5 seconds at 24 fps (or ~42ms per frame)
    fps = 24
    duration_per_frame_ms = int(1000 / fps)
    
    frames_full = []
    frames_portrait = []
    
    # Precompute smooth easing curves:
    # 1. Breathing curve (2 full gentle breath cycles over 84 frames)
    # 84 frames / 2 cycles = 42 frames per cycle (~1.75s / breath = 17 BPM)
    breath_phases = np.sin(np.linspace(0, 4 * np.pi, total_frames, endpoint=False))
    
    # 2. Blink curve: occurs around frame 20..27 (duration ~ 8 frames = 330ms)
    # Bell-shaped curve peaking at 1.0 at frame 23-24
    blink_curve = np.zeros(total_frames, dtype=np.float32)
    for i in range(total_frames):
        if 18 <= i <= 28:
            # smooth sine pulse
            p = (i - 18) / 10.0
            blink_curve[i] = np.sin(p * np.pi) ** 1.8
            
    # 3. Squint curve: ramps up at frame 42..56, holds 56..72, eases out 72..83
    squint_curve = np.zeros(total_frames, dtype=np.float32)
    for i in range(total_frames):
        if i < 42:
            squint_curve[i] = 0.0
        elif 42 <= i < 56:
            # ease in (smoothstep)
            t = (i - 42) / 14.0
            squint_curve[i] = t * t * (3.0 - 2.0 * t) * 0.85
        elif 56 <= i < 72:
            # hold squint with subtle micro-intensity
            squint_curve[i] = 0.85 + 0.05 * np.sin((i - 56) / 16.0 * np.pi)
        elif 72 <= i < 84:
            # ease back to 0
            t = (84 - i) / 12.0
            squint_curve[i] = t * t * (3.0 - 2.0 * t) * 0.85
            
    print("[Animator] Curves initialized. Generating 84 cinematic frames...")
    
    # Coordinate grids
    base_y_idx, base_x_idx = np.indices((H, W), dtype=np.float32)
    h_norm = np.clip((H - base_y_idx) / float(H), 0.0, 1.0)
    chest_weight = np.exp(-((base_y_idx - 480.0) / 160.0)**2)
    
    for f in range(total_frames):
        b_phase = breath_phases[f]
        blink_val = float(blink_curve[f])
        squint_val = float(squint_curve[f])
        
        # 1. Calculate breathing grid displacement:
        # Feet are stationary (h_norm=0 at y=H)
        y_shift_breath = -2.5 * (h_norm ** 1.35) * b_phase
        x_shift_breath = 0.7 * ((base_x_idx - 424.0) / 250.0) * chest_weight * b_phase
        
        y_grid = base_y_idx + y_shift_breath
        x_grid = base_x_idx - x_shift_breath
        
        # Current eye positions after breathing lift:
        head_lift = -2.5 * (((H - eye_ly) / float(H)) ** 1.35) * b_phase
        cur_ely = eye_ly + head_lift
        cur_ery = eye_ry + head_lift
        cur_elx = eye_lx
        cur_erx = eye_rx
        
        # 2. Eye transforms (Squint & Blink) applied around head
        # We apply squint warp on the grid
        if squint_val > 0.01:
            for cx, cy in [(cur_elx, cur_ely), (cur_erx, cur_ery)]:
                dx = x_grid - cx
                dy = y_grid - cy
                rx, ry = 17.0, 6.0
                r_sq = (dx / rx)**2 + (dy / ry)**2
                mask_squint = np.exp(-r_sq * 1.3)
                
                # Narrowing aperture
                y_shift_squint = np.sign(dy) * np.minimum(np.abs(dy), 1.8) * squint_val * mask_squint
                y_grid += y_shift_squint
                
                # Eyebrow subtle furrow down
                brow_mask = np.exp(-((dx/17.0)**2 + ((dy + 12.0)/6.5)**2)*1.2)
                y_grid += -1.3 * squint_val * brow_mask

        # Warp the base frame with high-fidelity spline interpolation
        warped = np.zeros_like(arr)
        for c in range(C):
            warped[..., c] = map_coordinates(arr[..., c], [y_grid, x_grid], order=3, mode='reflect')
            
        # 3. Apply Hand-Drawn Eyelid Descent (Blink)
        if blink_val > 0.02:
            for cx, cy, rx, ry in [(cur_elx, cur_ely, 13.5, 4.2), (cur_erx, cur_ery, 14.5, 4.0)]:
                for x_off in range(int(-rx), int(rx) + 1):
                    x = int(round(cx + x_off))
                    if not (0 <= x < W): continue
                    
                    x_ratio = x_off / rx
                    if abs(x_ratio) >= 1.0: continue
                    
                    span_y = ry * np.sqrt(1.0 - x_ratio**2)
                    top_y = cy - span_y
                    bot_y = cy + span_y
                    cur_y = top_y + (bot_y - top_y) * blink_val
                    
                    skin_base = np.array([232.0, 206.0, 185.0])
                    
                    for y in range(int(np.floor(top_y)), int(np.ceil(cur_y)) + 1):
                        if top_y <= y <= bot_y and 0 <= y < H:
                            depth = (y - top_y) / max(0.1, (cur_y - top_y))
                            tone = skin_base * (1.0 - 0.08 * depth)
                            
                            # Hand-drawn crosshatching texture
                            if blink_val > 0.6 and ((x + y) % 4 == 0) and depth < 0.7:
                                tone *= 0.84
                            warped[y, x] = tone
                            
                    # Lash line
                    ly = int(np.round(cur_y))
                    if 0 <= ly < H:
                        warped[ly, x] = np.array([45, 36, 30])
                        if ly + 1 < H and blink_val > 0.35:
                            warped[ly + 1, x] = warped[ly + 1, x] * 0.5 + np.array([75, 60, 50]) * 0.5
                            
                # Eyelid crease line when closed
                if blink_val > 0.7:
                    factor = (blink_val - 0.7) / 0.3
                    for x_off in range(-9, 10):
                        px = int(round(cx + x_off))
                        py = int(round(cy - 2.5 + 0.015 * (x_off**2)))
                        if 0 <= py < H and 0 <= px < W:
                            warped[py, px] = warped[py, px] * (1.0 - 0.35 * factor) + np.array([85, 70, 60]) * (0.35 * factor)

        frame_img = Image.fromarray(np.clip(warped, 0, 255).astype(np.uint8))
        frames_full.append(frame_img)
        
        # Also extract portrait close-up for maximum detail inspection (chest up: 480x580)
        # Head is around x=415, y=180
        portrait_crop = frame_img.crop((184, 15, 664, 595))
        frames_portrait.append(portrait_crop)
        
        if (f + 1) % 20 == 0 or f == total_frames - 1:
            print(f"[Animator] Rendered frame {f+1}/{total_frames}...")

    # Save outputs
    out_dir = "assets/generated_images"
    os.makedirs(out_dir, exist_ok=True)
    
    full_gif_path = os.path.join(out_dir, "gritty_noir_character_breathing_blink_squint.gif")
    portrait_gif_path = os.path.join(out_dir, "gritty_noir_character_portrait_preview.gif")
    
    print("[Animator] Saving Full-Body animated GIF...")
    # Resize full body slightly (530 x 790) for silky smooth browser playback and efficient size
    optimized_full = [img.resize((530, 790), Image.LANCZOS) for img in frames_full]
    optimized_full[0].save(
        full_gif_path,
        save_all=True,
        append_images=optimized_full[1:],
        duration=duration_per_frame_ms,
        loop=0,
        optimize=True
    )
    
    print("[Animator] Saving High-Detail Portrait animated GIF...")
    optimized_portrait = [img.resize((480, 580), Image.LANCZOS) for img in frames_portrait]
    optimized_portrait[0].save(
        portrait_gif_path,
        save_all=True,
        append_images=optimized_portrait[1:],
        duration=duration_per_frame_ms,
        loop=0,
        optimize=True
    )
    
    elapsed = time.time() - start_time
    print(f"[Animator] Complete! Rendered in {elapsed:.1f}s.")
    print(f"Full Body GIF: {full_gif_path} ({os.path.getsize(full_gif_path)/1024:.1f} KB)")
    print(f"Portrait GIF: {portrait_gif_path} ({os.path.getsize(portrait_gif_path)/1024:.1f} KB)")

if __name__ == "__main__":
    main()
