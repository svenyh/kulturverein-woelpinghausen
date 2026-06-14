"""Erzeugt neutrale Bilddateien ohne sichtbaren Text – nur Farbverläufe."""
from pathlib import Path
from PIL import Image, ImageDraw
import random

IMAGES = Path(__file__).resolve().parent.parent / "images"
IMAGES.mkdir(exist_ok=True)

SPECS = {
    "hero-gruppe.jpg": ((1600, 900), ((45, 12, 18), (91, 15, 27), (61, 10, 18))),
    "biergarten.jpg": ((1200, 800), ((40, 55, 35), (70, 45, 30), (50, 35, 25))),
    "bier.jpg": ((800, 800), ((112, 29, 42), (80, 25, 35), (60, 18, 28))),
    "leipzig-nacht.jpg": ((900, 700), ((25, 18, 45), (45, 25, 60), (30, 15, 35))),
    "leipzig-rathaus.jpg": ((900, 700), ((70, 55, 45), (100, 75, 60), (55, 40, 35))),
    "goethe-denkmal.jpg": ((900, 700), ((35, 50, 38), (55, 70, 50), (28, 38, 30))),
    "woodcutter.jpg": ((900, 700), ((75, 45, 28), (95, 60, 35), (55, 32, 20))),
    "woodcutter-banner.jpg": ((1200, 600), ((91, 15, 27), (61, 10, 18), (112, 29, 42))),
}


def gradient(size, colors):
    w, h = size
    img = Image.new("RGB", size)
    draw = ImageDraw.Draw(img)
    c1, c2, c3 = colors
    for y in range(h):
        t = y / max(h - 1, 1)
        if t < 0.5:
            u = t * 2
            color = tuple(int(c1[i] + (c2[i] - c1[i]) * u) for i in range(3))
        else:
            u = (t - 0.5) * 2
            color = tuple(int(c2[i] + (c3[i] - c2[i]) * u) for i in range(3))
        draw.line([(0, y), (w, y)], fill=color)
    # dezente Textur
    px = img.load()
    rng = random.Random(42)
    for _ in range(w * h // 120):
        x, y = rng.randint(0, w - 1), rng.randint(0, h - 1)
        r, g, b = px[x, y]
        d = rng.randint(-8, 8)
        px[x, y] = (max(0, min(255, r + d)), max(0, min(255, g + d)), max(0, min(255, b + d)))
    return img


for name, (size, colors) in SPECS.items():
    gradient(size, colors).save(IMAGES / name, "JPEG", quality=88, optimize=True)
    print("OK", name)

print("Fertig – keine Text-Overlays.")
