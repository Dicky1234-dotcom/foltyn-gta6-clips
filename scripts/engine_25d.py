import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage

# ============================================================================
# REUSABLE 2.5D PUPPETRY & COMPOSITING ENGINE (ANIMATION_CONSTRAINTS.md)
# Implements all 5 verified non-regression technical fixes from render_animation.py
# ============================================================================
SCLERA_COLOR = (252, 246, 242, 255)
SKIN_COLOR = (245, 141, 82, 255)
INK_COLOR = (18, 14, 12, 255)
MOUTH_INTERIOR = (92, 22, 18, 255)
TONGUE_COLOR = (220, 68, 45, 255)
ORANGE_BG = np.array([227, 59, 20, 255], dtype=np.uint8)


# --- Easing & Parametric Curves (Section 4) ---
def ease_out_cubic(x: float) -> float:
    x = max(0.0, min(1.0, x))
    return 1.0 - (1.0 - x) ** 3


def ease_in_out_sine(x: float) -> float:
    x = max(0.0, min(1.0, x))
    return -(math.cos(math.pi * x) - 1.0) / 2.0


def damped_spring(t: float, zeta: float = 0.35, omega: float = 12.0) -> float:
    if t <= 0.0:
        return 0.0
    omega_d = omega * math.sqrt(1.0 - zeta * zeta)
    return 1.0 - math.exp(-zeta * omega * t) * math.cos(omega_d * t)


# --- Chroma Key Segmentation with 1px Alpha Erode & Green Despill (Section 3) ---
def chroma_key_extract(img_rgba: Image.Image) -> Image.Image:
    arr = np.array(img_rgba.convert("RGBA"), dtype=np.float32)
    R, G, B, _ = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]
    greenness = G - np.maximum(R, B)
    bg_mask = (greenness > 42) & (G > 135)
    fg_mask = (~bg_mask).astype(np.uint8) * 255
    fg_pil = Image.fromarray(fg_mask, mode="L")
    eroded_pil = fg_pil.filter(ImageFilter.MinFilter(3))
    alpha = np.array(eroded_pil, dtype=np.uint8)
    border_mask = (greenness > 14) & (alpha > 0)
    arr[border_mask, 1] = np.minimum(
        arr[border_mask, 1], np.maximum(arr[border_mask, 0], arr[border_mask, 2])
    )
    arr[:, :, 3] = alpha
    return Image.fromarray(arr.astype(np.uint8), mode="RGBA")


# --- [Fix 1] Flood-Filled & 3px-Dilated Sclera Mask + Original Eye Ring ---
def build_eye_rig(base_arr: np.ndarray, eyes_config: list):
    H, W = base_arr.shape[:2]
    yy, xx = np.indices((H, W))
    base_no_pupils = base_arr.copy()
    eyes = [dict(e) for e in eyes_config]

    for eye in eyes:
        pr_erase = eye.get("pupil_erase_r", 14.5)
        dist_p = np.sqrt((xx - eye["px0"]) ** 2 + (yy - eye["py0"]) ** 2)
        base_no_pupils[dist_p < pr_erase] = SCLERA_COLOR

    for eye in eyes:
        cx_i, cy_i = int(round(eye["cx"])), int(round(eye["cy"]))
        max_search_r = eye.get("search_r", 52.0)
        dist = np.sqrt((xx - eye["cx"]) ** 2 + (yy - eye["cy"]) ** 2)
        not_ink = (
            (base_no_pupils[:, :, 0] > 110)
            & (base_no_pupils[:, :, 1] > 100)
            & (dist < max_search_r)
        )
        labeled, _ = ndimage.label(not_ink)
        interior = labeled == labeled[cy_i, cx_i]
        interior_dil = ndimage.binary_dilation(interior, iterations=3)

        inner_core = ndimage.binary_erosion(interior, iterations=1)
        ring_zone = ndimage.binary_dilation(interior, iterations=6) & (~inner_core)
        is_ink = (
            (base_no_pupils[:, :, 0] < 135)
            & (base_no_pupils[:, :, 1] < 105)
            & ring_zone
        )

        pad = int(eye.get("pad", 60))
        x0 = max(0, int(eye["cx"] - pad))
        y0 = max(0, int(eye["cy"] - pad))
        x1 = min(W, int(eye["cx"] + pad))
        y1 = min(H, int(eye["cy"] + pad))
        eye["bbox"] = (x0, y0, x1, y1)

        ys_e, xs_e = np.where(interior)
        eye["rx"] = (xs_e.max() - xs_e.min()) / 2.0
        eye["ry"] = (ys_e.max() - ys_e.min()) / 2.0
        eye["cx_true"] = (xs_e.min() + xs_e.max()) / 2.0
        eye["cy_true"] = (ys_e.min() + ys_e.max()) / 2.0

        SS = 2
        pw, ph = (x1 - x0) * SS, (y1 - y0) * SS
        mask_crop = Image.fromarray(
            (interior_dil[y0:y1, x0:x1] * 255).astype(np.uint8), mode="L"
        )
        eye["clip_mask_ss"] = mask_crop.resize((pw, ph), Image.Resampling.BILINEAR)

        ring_rgba = np.zeros((y1 - y0, x1 - x0, 4), dtype=np.uint8)
        ring_rgba[is_ink[y0:y1, x0:x1]] = INK_COLOR
        eye["ring_ss"] = Image.fromarray(ring_rgba, mode="RGBA").resize(
            (pw, ph), Image.Resampling.LANCZOS
        )

    return Image.fromarray(base_no_pupils, mode="RGBA"), eyes


def render_eye_overlay(
    canvas_rgba: Image.Image,
    eyes: list,
    pupil_dx: float,
    pupil_dy: float,
    squint_top: float,
    squint_bot: float,
    is_blink: bool = False,
) -> Image.Image:
    overlay = canvas_rgba.copy()
    SS = 2
    for eye in eyes:
        x0, y0, x1, y1 = eye["bbox"]
        pw, ph = (x1 - x0) * SS, (y1 - y0) * SS
        cx, cy = eye["cx_true"], eye["cy_true"]
        rx, ry = eye["rx"], eye["ry"]
        lcx, lcy = (cx - x0) * SS, (cy - y0) * SS
        lrx, lry = rx * SS, ry * SS

        content_ss = Image.new("RGBA", (pw, ph), SCLERA_COLOR)
        d = ImageDraw.Draw(content_ss)

        if is_blink:
            d.rectangle([0, 0, pw, ph], fill=SKIN_COLOR)
            slant_px = eye.get("slant", 0.0) * lrx * 0.5
            d.line(
                [(lcx - lrx * 1.2, lcy - slant_px), (lcx + lrx * 1.2, lcy + slant_px)],
                fill=INK_COLOR,
                width=int(5.0 * SS),
            )
        else:
            max_r = 0.30 * min(rx, ry)
            mag = math.hypot(pupil_dx, pupil_dy)
            dx = pupil_dx * (max_r / mag) if mag > max_r and mag > 0 else pupil_dx
            dy = pupil_dy * (max_r / mag) if mag > max_r and mag > 0 else pupil_dy

            px = (eye["px0"] + dx - x0) * SS
            py = (eye["py0"] + dy - y0) * SS
            pr = eye.get("pupil_r", 6.5) * SS
            d.ellipse([px - pr, py - pr, px + pr, py + pr], fill=INK_COLOR)

            slant_px = eye.get("slant", 0.0) * lrx * min(1.0, squint_top)
            if squint_top > 0.01:
                top_y_left = lcy - lry + (squint_top * lry * 1.15) - slant_px
                top_y_right = lcy - lry + (squint_top * lry * 1.15) + slant_px
                d.polygon(
                    [
                        (0, 0),
                        (pw, 0),
                        (lcx + lrx * 1.3, top_y_right),
                        (lcx - lrx * 1.3, top_y_left),
                    ],
                    fill=SKIN_COLOR,
                )
                d.line(
                    [(lcx - lrx * 1.3, top_y_left), (lcx + lrx * 1.3, top_y_right)],
                    fill=INK_COLOR,
                    width=int(4.8 * SS),
                )

            if squint_bot > 0.01:
                bot_y_left = lcy + lry - (squint_bot * lry * 0.95) - slant_px * 0.5
                bot_y_right = lcy + lry - (squint_bot * lry * 0.95) + slant_px * 0.5
                d.polygon(
                    [
                        (lcx - lrx * 1.3, bot_y_left),
                        (lcx + lrx * 1.3, bot_y_right),
                        (pw, ph),
                        (0, ph),
                    ],
                    fill=SKIN_COLOR,
                )
                d.line(
                    [(lcx - lrx * 1.3, bot_y_left), (lcx + lrx * 1.3, bot_y_right)],
                    fill=INK_COLOR,
                    width=int(4.8 * SS),
                )

        eye_comp = Image.new("RGBA", (pw, ph), (0, 0, 0, 0))
        eye_comp.paste(content_ss, (0, 0), eye["clip_mask_ss"])
        eye_comp.alpha_composite(eye["ring_ss"])

        eye_down = eye_comp.resize((x1 - x0, y1 - y0), Image.Resampling.LANCZOS)
        overlay.alpha_composite(eye_down, (x0, y0))

    return overlay


# --- Discrete 3-State Lip-Sync Overlay (Section 5) ---
def render_mouth_overlay(
    canvas_rgba: Image.Image,
    mcx: float,
    mcy: float,
    mouth_state: int,
    mw: float = 34.0,
    mh: float = 22.0,
) -> Image.Image:
    if mouth_state <= 0:
        return canvas_rgba
    overlay = canvas_rgba.copy()
    SS = 2
    pad = int(max(mw, mh) + 18)
    x0, y0 = int(mcx - pad), int(mcy - pad)
    x1, y1 = int(mcx + pad), int(mcy + pad)
    pw, ph = (x1 - x0) * SS, (y1 - y0) * SS
    lcx, lcy = (mcx - x0) * SS, (mcy - y0) * SS

    m_img = Image.new("RGBA", (pw, ph), (0, 0, 0, 0))
    d = ImageDraw.Draw(m_img)
    lw = int(4.5 * SS)

    if mouth_state == 1:
        rx, ry = mw * 0.42 * SS, mh * 0.36 * SS
        d.ellipse(
            [lcx - rx, lcy - ry, lcx + rx, lcy + ry],
            fill=MOUTH_INTERIOR,
            outline=INK_COLOR,
            width=lw,
        )
    else:
        rx, ry = mw * 0.56 * SS, mh * 0.62 * SS
        d.chord(
            [lcx - rx, lcy - ry * 0.6, lcx + rx, lcy + ry * 1.15],
            start=0,
            end=180,
            fill=MOUTH_INTERIOR,
            outline=INK_COLOR,
            width=lw,
        )
        d.ellipse(
            [lcx - rx * 0.55, lcy + ry * 0.1, lcx + rx * 0.55, lcy + ry * 0.85],
            fill=TONGUE_COLOR,
        )
        d.chord(
            [lcx - rx, lcy - ry * 0.6, lcx + rx, lcy + ry * 1.15],
            start=0,
            end=180,
            fill=None,
            outline=INK_COLOR,
            width=lw,
        )

    m_down = m_img.resize((x1 - x0, y1 - y0), Image.Resampling.LANCZOS)
    overlay.alpha_composite(m_down, (x0, y0))
    return overlay


# --- [Fix 2] Cross-Section Sleeve Extension for Articulated Limbs ---
def build_extended_hand_sprite(hand_raw: Image.Image, h_scale: float = 0.56):
    h_arr = np.array(hand_raw.convert("RGBA"))
    hh, hw, _ = h_arr.shape
    yy_h, xx_h = np.indices((hh, hw))
    ux_s, uy_s = -0.672, 0.740
    s_coord = (xx_h - 140.0) * ux_s + (yy_h - 270.0) * uy_s

    h_trim = h_arr.copy()
    h_trim[s_coord > 92.0] = [0, 0, 0, 0]
    hand_open = Image.fromarray(h_trim, mode="RGBA")

    slice_arr = h_arr.copy()
    slice_arr[(s_coord < 68.0) | (s_coord > 91.0)] = [0, 0, 0, 0]
    slice_arr[xx_h > 185] = [0, 0, 0, 0]
    sleeve_slice = Image.fromarray(slice_arr, mode="RGBA")

    pad_l, pad_b = 260, 280
    ext_w, ext_h = hw + pad_l, hh + pad_b
    hand_extended = Image.new("RGBA", (ext_w, ext_h), (0, 0, 0, 0))
    for dist in range(320, 0, -3):
        dx_ext = int(round(dist * ux_s))
        dy_ext = int(round(dist * uy_s))
        hand_extended.alpha_composite(sleeve_slice, (pad_l + dx_ext, dy_ext))
    hand_extended.alpha_composite(hand_open, (pad_l, 0))

    hand_w = int(round(hand_extended.width * h_scale))
    hand_h = int(round(hand_extended.height * h_scale))
    hand_base = hand_extended.resize((hand_w, hand_h), Image.Resampling.LANCZOS)
    return {
        "sprite": hand_base,
        "pad_l_scaled": pad_l * h_scale,
        "orig_w_scaled": hw * h_scale,
        "orig_h_scaled": hh * h_scale,
    }


# --- [Fix 3] 3/4 Perspective Spinning Wheel Renderer ---
def render_34_wheel(diam_h: int, angle_deg: float, darken: float = 1.0) -> Image.Image:
    SS = 2
    S = diam_h * SS
    cx = cy = S / 2.0
    r_outer = S * 0.46
    r_inner = S * 0.34
    r_hub = S * 0.115
    r_axle = S * 0.045

    wood_main = tuple(int(c * darken) for c in (204, 114, 46)) + (255,)
    wood_side = tuple(int(c * darken) for c in (158, 82, 30)) + (255,)
    ink = (18, 14, 12, 255)
    lw = max(3, int(round(S * 0.026)))

    wheel_2d = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(wheel_2d)

    for k in range(8):
        theta = math.radians(angle_deg + k * 45.0)
        ux, uy = math.cos(theta), math.sin(theta)
        nx, ny = -uy, ux
        sw = S * 0.026
        p1 = (cx + ux * (r_hub * 0.8) + nx * sw, cy + uy * (r_hub * 0.8) + ny * sw)
        p2 = (cx + ux * (r_hub * 0.8) - nx * sw, cy + uy * (r_hub * 0.8) - ny * sw)
        p3 = (cx + ux * (r_inner * 1.03) - nx * sw, cy + uy * (r_inner * 1.03) - ny * sw)
        p4 = (cx + ux * (r_inner * 1.03) + nx * sw, cy + uy * (r_inner * 1.03) + ny * sw)
        d.polygon([p1, p2, p3, p4], fill=wood_main)
        d.line([p1, p4], fill=ink, width=lw)
        d.line([p2, p3], fill=ink, width=lw)

    rim_layer = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    dr = ImageDraw.Draw(rim_layer)
    dr.ellipse([cx - r_outer, cy - r_outer, cx + r_outer, cy + r_outer], fill=wood_main, outline=ink, width=lw)
    hole_mask = Image.new("L", (S, S), 0)
    dh = ImageDraw.Draw(hole_mask)
    dh.ellipse([cx - r_inner, cy - r_inner, cx + r_inner, cy + r_inner], fill=255)
    rim_layer.paste(Image.new("RGBA", (S, S), (0, 0, 0, 0)), (0, 0), hole_mask)
    dr.ellipse([cx - r_inner, cy - r_inner, cx + r_inner, cy + r_inner], outline=ink, width=lw)

    wheel_2d.alpha_composite(rim_layer)
    d = ImageDraw.Draw(wheel_2d)
    d.ellipse([cx - r_hub, cy - r_hub, cx + r_hub, cy + r_hub], fill=wood_main, outline=ink, width=lw)
    d.ellipse([cx - r_axle, cy - r_axle, cx + r_axle, cy + r_axle], fill=ink)

    fw = int(round(S * 0.74))
    foreshortened = wheel_2d.resize((fw, S), Image.Resampling.LANCZOS)

    depth_dx = int(round(S * 0.055))
    canvas_34 = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    x_off = (S - fw) // 2

    side_rim = Image.new("RGBA", (fw, S), (0, 0, 0, 0))
    ds = ImageDraw.Draw(side_rim)
    rx_f = r_outer * 0.74
    fcx = fw / 2.0
    ds.ellipse([fcx - rx_f, cy - r_outer, fcx + rx_f, cy + r_outer], fill=wood_side, outline=ink, width=lw)
    rx_in_f = r_inner * 0.74
    hole_f = Image.new("L", (fw, S), 0)
    dhf = ImageDraw.Draw(hole_f)
    dhf.ellipse([fcx - rx_in_f, cy - r_inner, fcx + rx_in_f, cy + r_inner], fill=255)
    side_rim.paste(Image.new("RGBA", (fw, S), (0, 0, 0, 0)), (0, 0), hole_f)
    ds.ellipse([fcx - rx_in_f, cy - r_inner, fcx + rx_in_f, cy + r_inner], outline=ink, width=lw)

    for step in range(depth_dx, 0, -1):
        canvas_34.alpha_composite(side_rim, (x_off + step, 0))
    canvas_34.alpha_composite(foreshortened, (x_off, 0))
    canvas_34 = canvas_34.rotate(-4.0, resample=Image.Resampling.BICUBIC, expand=False)
    return canvas_34.resize((diam_h, diam_h), Image.Resampling.LANCZOS)


# --- [Fix 4 & Fix 5] Morphological Character Mask & Mirror-Inpainted Background ---
def segment_character_and_clean_bg(bg_arr: np.ndarray, char_roi: tuple = (370, 960, 15, 768)):
    H, W = bg_arr.shape[:2]
    yy, xx = np.indices((H, W))
    x_min, x_max, y_min, y_max = char_roi
    in_box = (xx >= x_min) & (xx <= x_max) & (yy >= y_min) & (yy <= y_max)

    R_ch, G_ch, B_ch = (
        bg_arr[:, :, 0].astype(int),
        bg_arr[:, :, 1].astype(int),
        bg_arr[:, :, 2].astype(int),
    )
    is_skin = (R_ch > 180) & (G_ch > 100) & (B_ch > 55) & in_box & (yy < int(H * 0.82))
    is_sclera = (R_ch > 200) & (G_ch > 200) & (B_ch > 200) & in_box & (yy < int(H * 0.60))
    is_yellow = (R_ch > 180) & (G_ch > 160) & (B_ch < 80) & in_box & (yy > int(H * 0.62))
    is_jacket = (R_ch > 160) & (G_ch > 35) & (G_ch < 90) & (B_ch >= 38) & in_box & (yy > int(H * 0.68))
    is_brown_coat = (
        (R_ch > 90) & (R_ch < 175) & (G_ch > 50) & (G_ch < 120) & (B_ch > 25) & (B_ch < 85) & in_box & (yy > int(H * 0.58))
    )
    is_nose = (R_ch > 180) & (G_ch > 40) & (B_ch >= 35) & in_box & (yy < int(H * 0.65))

    char_seed = is_skin | is_sclera | is_yellow | is_jacket | is_brown_coat | is_nose
    char_body = ndimage.binary_fill_holes(ndimage.binary_closing(char_seed, structure=np.ones((9, 9))))
    is_dark = (R_ch < 75) & (G_ch < 65) & (B_ch < 65)
    hair_roi = is_dark & (xx > x_min + 35) & (xx < x_max - 35) & (yy > y_min) & (yy < int(H * 0.46))
    hair_filled = ndimage.binary_fill_holes(ndimage.binary_closing(hair_roi, structure=np.ones((7, 7))))
    char_core = ndimage.binary_fill_holes(char_body | hair_filled)

    labeled_c, num_features = ndimage.label(char_core)
    if num_features > 0:
        sizes_c = ndimage.sum(char_core, labeled_c, range(1, num_features + 1))
        char_core = labeled_c == (np.argmax(sizes_c) + 1)

    char_outline = ndimage.binary_dilation(char_core, iterations=6) & is_dark
    char_full = ndimage.binary_closing(
        ndimage.binary_fill_holes(char_core | char_outline), structure=np.ones((5, 5))
    )
    char_mask_img = Image.fromarray((char_full * 255).astype(np.uint8), mode="L")

    bg_street_arr = bg_arr.copy()
    dil_char = ndimage.binary_dilation(char_full, iterations=4)
    for y in range(H):
        xs_m = np.where(dil_char[y])[0]
        if len(xs_m) > 0:
            x0, x1 = xs_m[0], xs_m[-1]
            bg_street_arr[y, x0 : x1 + 1] = ORANGE_BG
            span_l = min(28, x0, (x1 - x0) // 2)
            if span_l > 2 and y >= 45:
                bg_street_arr[y, x0 : x0 + span_l] = bg_arr[y, x0 - span_l : x0][::-1]
            span_r = min(28, W - 1 - x1, (x1 - x0) // 2)
            if span_r > 2 and y >= 45:
                bg_street_arr[y, x1 - span_r + 1 : x1 + 1] = bg_arr[y, x1 + 1 : x1 + 1 + span_r][::-1]

    return char_mask_img, Image.fromarray(bg_street_arr, mode="RGBA")
