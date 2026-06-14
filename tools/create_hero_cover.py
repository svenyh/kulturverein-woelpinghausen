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

x = W - target_w - int(W * 0.05)
y = (H - target_h) // 2

bg = Image.new("RGBA", logo.size, (*BORDEAUX, 255))
logo_layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
logo_layer.paste(bg, (x, y))
logo_layer.paste(logo, (x, y), logo)
canvas = Image.alpha_composite(canvas.convert("RGBA"), logo_layer).convert("RGB")

canvas.save(OUT, "JPEG", quality=90, optimize=True)
print("OK", OUT.name)
