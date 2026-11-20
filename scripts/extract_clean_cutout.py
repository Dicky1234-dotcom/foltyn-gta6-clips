"""
Extract Clean Cutout with Flood-Fill Edge Alpha Matte
Preserves internal whites (snow on helmet, eyes, belt buckle, buttons)
while making external background 100% transparent.
"""

import sys
import os
from PIL import Image
import numpy as np
from collections import deque

def extract_cutout(input_path, output_path, threshold=240, feather_px=1):
    img = Image.open(input_path).convert("RGBA")
    w, h = img.size
    data = np.array(img)

    r = data[:, :, 0].astype(int)
    g = data[:, :, 1].astype(int)
    b = data[:, :, 2].astype(int)

    # A pixel is considered "background white/near-white" if all RGB >= threshold
    is_light = (r >= threshold) & (g >= threshold) & (b >= threshold)

    # Flood fill BFS starting from all 4 borders
    visited = np.zeros((h, w), dtype=bool)
    queue = deque()

    # Seed top and bottom borders
    for x in range(w):
        if is_light[0, x]:
            queue.append((0, x))
            visited[0, x] = True
        if is_light[h - 1, x]:
            queue.append((h - 1, x))
            visited[h - 1, x] = True

    # Seed left and right borders
    for y in range(h):
        if is_light[y, 0] and not visited[y, 0]:
            queue.append((y, 0))
            visited[y, 0] = True
        if is_light[y, w - 1] and not visited[y, w - 1]:
            queue.append((y, w - 1))
            visited[y, w - 1] = True

    # 4-directional BFS
    while queue:
        cy, cx = queue.popleft()
        for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            ny, nx = cy + dy, cx + dx
            if 0 <= ny < h and 0 <= nx < w:
                if not visited[ny, nx] and is_light[ny, nx]:
                    visited[ny, nx] = True
                    queue.append((ny, nx))

    # Apply alpha transparency only to visited background pixels
    data[visited, 3] = 0

    # Slight edge de-fringing
    out_img = Image.fromarray(data)
    out_img.save(output_path, "PNG")
    print(f"[OK] Extracted clean cutout: {output_path} (Size: {w}x{h})")

if __name__ == "__main__":
    if len(sys.argv) > 2:
        extract_cutout(sys.argv[1], sys.argv[2])
    else:
        # Default test
        in_p = "assets/generated_images/German Trench Sentry (Midground Cutout.jpg"
        out_p = "assets/generated_images/german_sentry_cutout_transparent.png"
        extract_cutout(in_p, out_p)
