"""Erzeugt Hero-Cover: Motiv rechts, dunkler Bereich links (21:9)."""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent / "images"
SRC = ROOT / "hero-bierkartographen.jpg"
OUT = ROOT / "hero-bierkartographen-wide-cover.jpg"

W, H = 2100, 900
BORDEAUX = (91, 15, 27)
BORDEAUX_DARK = (61, 10, 18)

canvas = Image.new("RGB", (W, H), BORDEAUX)
draw = ImageDraw.Draw(canvas)

for x in range(W):
    t = x / max(W - 1, 1)
    if t < 0.42:
        color = BORDEAUX_DARK
    elif t < 0.58:
        u = (t - 0.42) / 0.16
        color = tuple(int(BORDEAUX_DARK[i] + (BORDEAUX[i] - BORDEAUX_DARK[i]) * u) for i in range(3))
    else:
        u = min(1.0, (t - 0.58) / 0.25)
        color = tuple(int(BORDEAUX[i] + (200 - BORDEAUX[i]) * u * 0.35) for i in range(3))
    draw.line([(x, 0), (x, H)], fill=color)

logo = Image.open(SRC).convert("RGBA")
target_h = int(H * 0.82)
target_w = int(logo.width * target_h / logo.height)
logo = logo.resize((target_w, target_h), Image.LANCZOS)

# Weißen Bildhintergrund transparent machen, damit kein harter Rand entsteht
px = logo.load()
for py in range(logo.height):
    for px_x in range(logo.width):
        r, g, b, a = px[px_x, py]
        if a > 0 and r > 210 and g > 210 and b > 210:
            px[px_x, py] = (BORDEAUX[0], BORDEAUX[1], BORDEAUX[2], 0)

x = W - target_w - int(W * 0.05)
y = (H - target_h) // 2

logo_layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
logo_layer.paste(logo, (x, y), logo)
canvas = Image.alpha_composite(canvas.convert("RGBA"), logo_layer).convert("RGB")

canvas.save(OUT, "JPEG", quality=90, optimize=True)
print("OK", OUT.name)
