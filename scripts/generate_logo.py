#!/usr/bin/env python3
"""Generate all ShareNPlay logo assets from brand geometry.

Outputs (frontend/public/): logo.svg (hand-authored), logo512.png,
logo192.png, apple-touch-icon.png (180), favicon.ico (16/32/48),
plus ../og-image.png (1200x630) for GitHub / Hugging Face cards.
Run from repo root:  python scripts/generate_logo.py
"""
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PUB = os.path.join(ROOT, "frontend", "public")

CYAN = (34, 211, 238)
INDIGO = (129, 140, 248)
PINK = (244, 114, 182)
TOP = (11, 16, 36)
BOT = (5, 7, 15)

S = 2048  # supersample canvas
R = 448   # corner radius at 2048 (= 112 @ 512)


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def hex_pts(cx, cy, r):
    import math
    return [(cx + r * math.sin(math.radians(a)), cy - r * math.cos(math.radians(a)))
            for a in range(0, 360, 60)]


def grad_node(canvas, cx, cy, r, ca=CYAN, cb=PINK):
    mask = Image.new("L", canvas.size, 0)
    ImageDraw.Draw(mask).ellipse([cx - r, cy - r, cx + r, cy + r], fill=255)
    layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    ld = ImageDraw.Draw(layer)
    steps = 48
    for i in range(steps):
        col = lerp(ca, cb, (i + 0.5) / steps)
        y0 = cy - r + (2 * r) * i / steps
        y1 = cy - r + (2 * r) * (i + 1) / steps + 1
        ld.rectangle([cx - r, y0, cx + r, y1], fill=col + (255,))
    canvas.alpha_composite(Image.composite(layer, Image.new("RGBA", canvas.size, (0, 0, 0, 0)), mask))


def build(rounded=True):
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # dark stage gradient
    for y in range(S):
        d.line([(0, y), (S, y)], fill=lerp(TOP, BOT, y / (S - 1)) + (255,))

    # aurora glows (radial falloff, composited)
    def glow(color, cx, cy, rad, amax):
        g = Image.radial_gradient("L").resize((rad * 2, rad * 2))
        a = g.point(lambda v: max(0, int((255 - v) / 255 * amax)))
        layer = Image.new("RGBA", (S, S), (0, 0, 0, 0))
        layer.paste(Image.new("RGB", (rad * 2, rad * 2), color), (cx - rad, cy - rad), a)
        img.alpha_composite(layer)

    glow(CYAN, int(S * 0.16), int(S * 0.10), int(S * 0.75), 92)
    glow((167, 139, 250), int(S * 0.88), int(S * 0.94), int(S * 0.75), 84)

    # neon hexagon frame
    pts = hex_pts(S / 2, S / 2, S * 0.373)
    d.line(pts + [pts[0]], fill=INDIGO + (255,), width=int(S * 0.039), joint="curve")
    for p in pts + [pts[0]]:
        d.ellipse([p[0] - S * 0.0195, p[1] - S * 0.0195,
                   p[0] + S * 0.0195, p[1] + S * 0.0195], fill=INDIGO + (255,))

    # share edges (hub -> two nodes)
    hub = (S * 0.363, S * 0.500)
    n1 = (S * 0.645, S * 0.336)
    n2 = (S * 0.645, S * 0.664)
    d.line([hub, n1], fill=INDIGO + (255,), width=int(S * 0.031))
    d.line([hub, n2], fill=INDIGO + (255,), width=int(S * 0.031))

    # gradient nodes
    grad_node(img, hub[0], hub[1], S * 0.0703)
    grad_node(img, n1[0], n1[1], S * 0.0566)
    grad_node(img, n2[0], n2[1], S * 0.0566)
    d = ImageDraw.Draw(img)
    d.ellipse([hub[0] - S * 0.0273, hub[1] - S * 0.0273,
               hub[0] + S * 0.0273, hub[1] + S * 0.0273], fill=(11, 16, 36, 140))

    # corner mask
    mask = Image.new("L", (S, S), 0)
    if rounded:
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, S - 1, S - 1], radius=R, fill=255)
    else:
        ImageDraw.Draw(mask).rectangle([0, 0, S - 1, S - 1], fill=255)
    out = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    out.paste(img, (0, 0), mask)
    return out


def save(img, name, size):
    img.resize((size, size), Image.LANCZOS).save(os.path.join(PUB, name))


full = build(rounded=False)
rounded = build(rounded=True)

save(rounded, "logo512.png", 512)
save(rounded, "logo192.png", 192)
save(full, "apple-touch-icon.png", 180)
rounded.resize((512, 512), Image.LANCZOS).save(
    os.path.join(PUB, "favicon.ico"), sizes=[(16, 16), (32, 32), (48, 48)])

# --- social preview card 1200x630 ---
W, H = 1200, 630
card = Image.new("RGB", (W, H))
cd = ImageDraw.Draw(card)
for y in range(H):
    cd.line([(0, y), (W, y)], fill=lerp((11, 16, 36), (5, 7, 15), y / (H - 1)))
g = Image.radial_gradient("L").resize((900, 900))
a = g.point(lambda v: max(0, int((255 - v) / 255 * 70)))
gl = Image.new("RGB", (900, 900), (34, 211, 238))
card.paste(gl, (-260, -330), a)
gl2 = Image.new("RGB", (900, 900), (167, 139, 250))
card.paste(gl2, (620, 120), g.point(lambda v: max(0, int((255 - v) / 255 * 60))))
logo = rounded.resize((420, 420), Image.LANCZOS)
card.paste(logo, (95, 105), logo)

try:
    fb = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 104)
    fs = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 40)
    ff = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 30)
except Exception:
    fb = fs = ff = ImageFont.load_default()
cd.text((575, 200), "ShareNPlay", font=fb, fill=(245, 248, 255))
cd.text((580, 330), "Share a file. Play a duel. Dare the loser.", font=fs, fill=(34, 211, 238))
cd.text((580, 500), "a RAJKETHA PROJECT", font=ff, fill=(148, 160, 190))
card.save(os.path.join(ROOT, "og-image.png"))

print("assets:", sorted(os.listdir(PUB)))
print("og-image:", os.path.getsize(os.path.join(ROOT, "og-image.png")), "bytes")
