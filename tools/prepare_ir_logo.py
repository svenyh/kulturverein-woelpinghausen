"""Logo IR Graf Wilhelm: weißen Hintergrund entfernen und zuschneiden."""
from pathlib import Path
import urllib.request
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent / "images"
SRC_URL = "https://www.ir-graf-wilhelm.de/images/Projektbilder/Logo/Logo-Schrift1.jpg"
TMP = ROOT / "_tmp-ir-logo.jpg"
OUT = ROOT / "partner-ir-graf-wilhelm.png"


def remove_white_background(im: Image.Image, threshold: int = 242) -> Image.Image:
    rgba = im.convert("RGBA")
    px = rgba.load()
    w, h = rgba.size
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y][:3]
            if r >= threshold and g >= threshold and b >= threshold:
                px[x, y] = (r, g, b, 0)
    return rgba


def trim_transparent(im: Image.Image, padding: int = 6) -> Image.Image:
    bbox = im.getbbox()
    if not bbox:
        return im
    cropped = im.crop(bbox)
    w, h = cropped.size
    canvas = Image.new("RGBA", (w + padding * 2, h + padding * 2), (255, 255, 255, 0))
    canvas.paste(cropped, (padding, padding), cropped)
    return canvas


def main() -> None:
    urllib.request.urlretrieve(SRC_URL, TMP)
    src = Image.open(TMP)
    processed = trim_transparent(remove_white_background(src))
    processed.save(OUT, optimize=True)
    TMP.unlink(missing_ok=True)
    print(f"Saved {OUT} ({processed.size[0]}x{processed.size[1]})")


if __name__ == "__main__":
    main()
