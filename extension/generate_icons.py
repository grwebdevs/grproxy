import math
import os
from PIL import Image, ImageDraw

def create_shield_bolt_icon(size, is_active=True):
    # Create RGBA image with 4x supersampling for crisp anti-aliasing
    scale = 4
    s = size * scale
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    cx = s / 2.0
    cy = s / 2.0
    pad = s * 0.08
    w = s - 2 * pad
    h = s - 2 * pad

    top = pad
    bottom = s - pad
    left = pad
    right = s - pad

    # Shield points
    # Shield starts at top left, flat or slight curve top, vertical down to mid, then curves to bottom center tip
    shield_pts = [
        (left + w * 0.15, top),
        (cx, top + h * 0.05),
        (right - w * 0.15, top),
        (right, top + h * 0.22),
        (right, top + h * 0.52),
        (cx, bottom),
        (left, top + h * 0.52),
        (left, top + h * 0.22),
    ]

    if is_active:
        # Cyber emerald & cyan palette
        bg_color = (6, 20, 24, 255)       # Solid dark cyan-slate
        border_color = (16, 185, 129, 255) # Vibrant Emerald Green
        glow_color = (6, 182, 212, 160)   # Cyber cyan glow
        bolt_fill = (52, 211, 153, 255)   # Bright emerald bolt
        bolt_highlight = (255, 255, 255, 255)
    else:
        # Inactive muted slate / grayscale palette
        bg_color = (30, 41, 59, 255)      # Muted slate
        border_color = (148, 163, 184, 255) # Light slate gray border for contrast
        glow_color = (71, 85, 105, 80)    # Subdued gray glow
        bolt_fill = (148, 163, 184, 255)  # Muted silver bolt
        bolt_highlight = (226, 232, 240, 255)

    # 1. Subtle Outer Glow only for larger sizes (48 and 128)
    if is_active and size >= 48:
        for offset in range(int(3 * scale), 0, -1):
            alpha = int(35 / offset)
            outer_glow = (6, 182, 212, alpha)
            glow_pts = [
                (p[0] + (p[0] - cx) * 0.05 * offset, p[1] + (p[1] - cy) * 0.05 * offset)
                for p in shield_pts
            ]
            draw.polygon(glow_pts, fill=outer_glow)

    # 2. Draw Shield Body
    draw.polygon(shield_pts, fill=bg_color)

    # 3. Draw Shield Border - ensure solid line width
    border_width = max(2, int(s * (0.08 if size <= 32 else 0.065)))
    draw.line(shield_pts + [shield_pts[0]], fill=border_color, width=border_width, joint="curve")

    # 4. Draw Bolt in Center
    # Bolt vertices centered in shield
    # Lightning bolt coordinates relative to shield center
    bw = w * 0.38
    bh = h * 0.52
    by = cy - h * 0.02

    bolt_pts = [
        (cx + bw * 0.15, by - bh * 0.48),  # top right peak
        (cx - bw * 0.42, by + bh * 0.02),  # left waist notch
        (cx - bw * 0.02, by + bh * 0.02),  # center inward jog
        (cx - bw * 0.28, by + bh * 0.52),  # bottom tip
        (cx + bw * 0.42, by - bh * 0.02),  # right waist notch
        (cx + bw * 0.02, by - bh * 0.02),  # center inward jog
    ]

    draw.polygon(bolt_pts, fill=bolt_fill)

    # Mini highlight on bolt for depth
    if size >= 32:
        inner_bolt = [
            (cx + bw * 0.08, by - bh * 0.38),
            (cx - bw * 0.25, by - bh * 0.02),
            (cx + bw * 0.02, by - bh * 0.02),
        ]
    # Downsample with Lanczos for ultra-crisp output
    return img.resize((size, size), Image.Resampling.LANCZOS)

def create_small_icon(size, is_active=True):
    # size is 16 or 32
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    if is_active:
        bg_col = (5, 30, 25, 255)
        border_col = (16, 185, 129, 255) # emerald
        bolt_col = (52, 211, 153, 255)   # bright green
        bolt_hi = (255, 255, 255, 255)
    else:
        bg_col = (30, 41, 59, 255)
        border_col = (148, 163, 184, 255) # slate
        bolt_col = (148, 163, 184, 255)
        bolt_hi = (203, 213, 225, 255)

    if size == 16:
        # 16x16 crisp shield
        shield = [
            (2, 1), (8, 0), (13, 1),
            (14, 3), (14, 8),
            (8, 15),
            (1, 8), (1, 3)
        ]
        draw.polygon(shield, fill=bg_col)
        draw.line(shield + [shield[0]], fill=border_col, width=1)
        # bolt
        bolt = [
            (9, 2),
            (4, 8),
            (7, 8),
            (6, 13),
            (11, 7),
            (8, 7),
        ]
        draw.polygon(bolt, fill=bolt_col)
        draw.point((8, 5), fill=bolt_hi)
    else: # 32
        shield = [
            (5, 2), (16, 1), (26, 2),
            (29, 6), (29, 17),
            (16, 30),
            (2, 17), (2, 6)
        ]
        draw.polygon(shield, fill=bg_col)
        draw.line(shield + [shield[0]], fill=border_col, width=2)
        bolt = [
            (18, 4),
            (8, 16),
            (15, 16),
            (12, 27),
            (23, 14),
            (17, 14),
        ]
        draw.polygon(bolt, fill=bolt_col)
        draw.line([(17, 6), (10, 15), (15, 15)], fill=bolt_hi, width=1)

    return img

def main():
    icons_dir = "d:/GR WEB DEVS/Cloudflare workers TOOLS BUILDS/New ideas/grproxy/extension/icons"
    os.makedirs(icons_dir, exist_ok=True)

    for sz in [16, 32]:
        create_small_icon(sz, True).save(os.path.join(icons_dir, f"icon-active-{sz}.png"))
        create_small_icon(sz, False).save(os.path.join(icons_dir, f"icon-inactive-{sz}.png"))

    for sz in [48, 128]:
        create_shield_bolt_icon(sz, True).save(os.path.join(icons_dir, f"icon-active-{sz}.png"))
        create_shield_bolt_icon(sz, False).save(os.path.join(icons_dir, f"icon-inactive-{sz}.png"))

    # Default fallback icon files
    create_small_icon(16, False).save(os.path.join(icons_dir, "icon16.png"))
    create_shield_bolt_icon(48, False).save(os.path.join(icons_dir, "icon48.png"))
    create_shield_bolt_icon(128, False).save(os.path.join(icons_dir, "icon128.png"))

    print("Successfully generated all active and inactive icon sets!")

if __name__ == "__main__":
    main()
