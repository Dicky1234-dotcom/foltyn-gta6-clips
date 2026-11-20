import os
import time
import numpy as np
from PIL import Image

def create_ground_shadow(width, height, color=(25, 45, 20), max_alpha=120):
    shadow = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    arr = np.zeros((height, width, 4), dtype=np.uint8)
    y_idx, x_idx = np.indices((height, width))
    cx, cy = width / 2.0, height / 2.0
    rx, ry = width / 2.2, height / 2.2
    dist_sq = ((x_idx - cx) / rx) ** 2 + ((y_idx - cy) / ry) ** 2
    mask = np.clip(1.0 - dist_sq, 0.0, 1.0) ** 1.8
    arr[..., 0] = color[0]
    arr[..., 1] = color[1]
    arr[..., 2] = color[2]
    arr[..., 3] = (mask * max_alpha).astype(np.uint8)
    return Image.fromarray(arr)

def main():
    print("[Cutout Engine] Initializing Pose-Swap Multiplane Animation Engine...")
    start_time = time.time()
    
    cutouts_dir = "assets/generated_images/cutouts"
    out_dir = "assets/generated_images"
    os.makedirs(out_dir, exist_ok=True)
    
    # 1. Load Background Plate
    bg_plate = Image.open(os.path.join(cutouts_dir, "yarnhub_meadow_empty_plate.jpg")).convert("RGBA")
    W, H = bg_plate.size
    print(f"[Cutout Engine] Background Plate loaded: {W}x{H}")
    
    # 2. Load the 4 Troffea Dance Poses
    dance_poses = []
    for i in range(1, 5):
        p_path = os.path.join(cutouts_dir, f"troffea_pose_{i}.png")
        dance_poses.append(Image.open(p_path).convert("RGBA"))
    print(f"[Cutout Engine] Loaded {len(dance_poses)} Troffea cutout dance poses")
    
    # 3. Load Foreground Flower Sway Poses
    flower_poses = {
        "left": Image.open(os.path.join(cutouts_dir, "fg_flower_sway_left.png")).convert("RGBA"),
        "center": Image.open(os.path.join(cutouts_dir, "fg_flower_sway_center.png")).convert("RGBA"),
        "right": Image.open(os.path.join(cutouts_dir, "fg_flower_sway_right.png")).convert("RGBA"),
    }
    print("[Cutout Engine] Loaded 3 foreground flower sway slots")
    
    # 48 frames @ 24 FPS = 2.0s seamless dance loop
    # 4 dance poses -> 12 frames per pose swap
    total_frames = 48
    fps = 24
    duration_per_frame_ms = int(1000 / fps)
    
    # Target grounded footline on meadow (Y = 675)
    ground_y = 675
    center_x = 720
    
    frames_full = []
    frames_closeup = []
    
    print("[Cutout Engine] Rendering 48 pose-swap animation frames...")
    
    for f in range(total_frames):
        # --- A. DETERMINE ACTIVE POSE SLOTS ---
        # Dance pose index: 0, 1, 2, or 3
        pose_idx = (f // 12) % 4
        active_troffea_pose = dance_poses[pose_idx]
        
        # Flower sway pose slot:
        # 0..11: left | 12..23: center | 24..35: right | 36..47: center
        if f < 12:
            active_flower = flower_poses["left"]
        elif f < 24:
            active_flower = flower_poses["center"]
        elif f < 36:
            active_flower = flower_poses["right"]
        else:
            active_flower = flower_poses["center"]
            
        # Relative progress inside the current 12-frame pose step (0.0 to 1.0)
        rel_t = (f % 12) / 12.0
        
        # --- B. KINEMATIC STEP BOUNCE & TILT ---
        # Footstep vertical spring bob: rises and lands on beat
        step_bounce_y = -np.sin(rel_t * np.pi) * 7.0
        # Subtle dance tilt oscillation: +/- 1.8 degrees
        tilt_dir = 1.0 if pose_idx % 2 == 0 else -1.0
        step_tilt_deg = np.sin(rel_t * np.pi) * 1.8 * tilt_dir
        
        # Camera subtle multiplane drift:
        cam_drift_x = int(np.sin((f / float(total_frames)) * 2 * np.pi) * 3.5)
        
        # --- C. COMPOSITE LAYERS ---
        # Layer 1: Background Plate with subtle parallax offset
        frame = Image.new("RGBA", (W, H))
        frame.paste(bg_plate, (cam_drift_x, 0))
        
        # Layer 2: Dynamic Contact Shadow on Meadow
        shadow_w = int(230 + np.sin(rel_t * np.pi) * 25)
        shadow_h = int(32 + np.sin(rel_t * np.pi) * 8)
        shadow_sprite = create_ground_shadow(shadow_w, shadow_h, max_alpha=110)
        shadow_x = center_x - shadow_w // 2
        shadow_y = ground_y - shadow_h // 2
        frame.alpha_composite(shadow_sprite, (shadow_x, shadow_y))
        
        # Layer 3: Frau Troffea Cutout Puppet
        pw, ph = active_troffea_pose.size
        # Apply subtle tilt
        rotated_pose = active_troffea_pose.rotate(step_tilt_deg, resample=Image.BICUBIC, expand=True)
        rw, rh = rotated_pose.size
        
        # Position anchored at feet on the ground line:
        pose_x = center_x - rw // 2
        pose_y = int(ground_y - rh + step_bounce_y)
        frame.alpha_composite(rotated_pose, (pose_x, pose_y))
        
        # Layer 4: Foreground Flowers Cutout Sway
        frame.alpha_composite(active_flower, (0, 0))
        
        # Convert to RGB
        final_frame = frame.convert("RGB")
        frames_full.append(final_frame)
        
        # Character & Flower Focus Close-Up Crop (520x660)
        closeup_crop = final_frame.crop((440, 60, 980, 720))
        frames_closeup.append(closeup_crop)
        
        if (f + 1) % 12 == 0:
            print(f"[Cutout Engine] Processed Pose-Swap Block {pose_idx + 1}/4 (Frame {f+1}/48)...")

    # 4. Save Optimized GIF Outputs
    full_gif_path = os.path.join(out_dir, "yarnhub_troffea_cutout_pose_swap.gif")
    closeup_gif_path = os.path.join(out_dir, "yarnhub_troffea_cutout_closeup.gif")
    
    print("[Cutout Engine] Saving and quantizing animated GIFs...")
    
    # Full 16:9 GIF (720x402, 128 colors adaptive palette for smooth, low-bandwidth playback)
    opt_full = []
    for img in frames_full:
        resized = img.resize((720, 402), Image.LANCZOS)
        opt_full.append(resized.convert("P", palette=Image.ADAPTIVE, colors=128))
        
    opt_full[0].save(
        full_gif_path,
        save_all=True,
        append_images=opt_full[1:],
        duration=duration_per_frame_ms,
        loop=0,
        optimize=True
    )
    
    # Close-up GIF (460x580)
    opt_closeup = []
    for img in frames_closeup:
        resized = img.resize((460, 580), Image.LANCZOS)
        opt_closeup.append(resized.convert("P", palette=Image.ADAPTIVE, colors=128))
        
    opt_closeup[0].save(
        closeup_gif_path,
        save_all=True,
        append_images=opt_closeup[1:],
        duration=duration_per_frame_ms,
        loop=0,
        optimize=True
    )
    
    # 5. Create 4-Pose Storyboard Sheet
    sheet_w, sheet_h = 460, 580
    sheet = Image.new("RGB", (sheet_w * 2, sheet_h * 2), (255, 255, 255))
    key_frames = [0, 12, 24, 36]
    sheet.paste(frames_closeup[0].resize((sheet_w, sheet_h), Image.LANCZOS), (0, 0))
    sheet.paste(frames_closeup[12].resize((sheet_w, sheet_h), Image.LANCZOS), (sheet_w, 0))
    sheet.paste(frames_closeup[24].resize((sheet_w, sheet_h), Image.LANCZOS), (0, sheet_h))
    sheet.paste(frames_closeup[36].resize((sheet_w, sheet_h), Image.LANCZOS), (sheet_w, sheet_h))
    
    storyboard_path = os.path.join(out_dir, "yarnhub_troffea_cutout_storyboard.jpg")
    sheet.save(storyboard_path, quality=92)
    
    elapsed = time.time() - start_time
    print(f"[Cutout Engine] Completed in {elapsed:.1f}s!")
    print(f"Full 16:9 Pose-Swap GIF: {full_gif_path} ({os.path.getsize(full_gif_path)/1024:.1f} KB)")
    print(f"Close-Up Pose-Swap GIF: {closeup_gif_path} ({os.path.getsize(closeup_gif_path)/1024:.1f} KB)")
    print(f"Storyboard Sheet: {storyboard_path} ({os.path.getsize(storyboard_path)/1024:.1f} KB)")

if __name__ == "__main__":
    main()
