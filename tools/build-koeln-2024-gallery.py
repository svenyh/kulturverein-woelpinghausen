#!/usr/bin/env python3
"""Optimize Köln 2024 travel images and emit gallery manifest."""

from __future__ import annotations

import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "images" / "reisen" / "koeln-2024"
MANIFEST = OUT_DIR / "gallery-manifest.json"

SOURCES = [
    {
        "source": ROOT / "images" / "events" / "koeln-2024-cover.webp",
        "filename": "hero-dom-skyline.webp",
        "alt": "Kölner Dom und Skyline bei Abendstimmung – Herrentour Köln 2024",
    },
    {
        "source": ROOT / "images" / "hero-bierkartographen-wide.jpg",
        "filename": "bierkartographen-emblem.webp",
        "alt": "Emblem der Bierkartographen Wölpinghausen – Gemeinsam unterwegs",
    },
    {
        "source": ROOT / "images" / "gallery-biergarten-gruppe.jpg",
        "filename": "brauhaus-gruppe.webp",
        "alt": "Die Gruppe lachend an einem Holztisch im Kölner Brauhaus mit Kölsch",
    },
    {
        "source": ROOT / "images" / "gallery-bierglaeser.jpg",
        "filename": "brauhaus-koelsch.webp",
        "alt": "Kölsch und gesellige Runde im Brauhaus während der Herrentour",
    },
]

MAX_WIDTH = 1600
WEBP_QUALITY = 82


def optimize_image(source: Path, target: Path) -> None:
    with Image.open(source) as img:
        if img.mode == "RGBA":
            background = Image.new("RGB", img.size, (255, 255, 255))
            background.paste(img, mask=img.split()[3])
            img = background
        elif img.mode != "RGB":
            img = img.convert("RGB")

        width, height = img.size
        if width > MAX_WIDTH:
            ratio = MAX_WIDTH / width
            img = img.resize((MAX_WIDTH, int(height * ratio)), Image.Resampling.LANCZOS)

        target.parent.mkdir(parents=True, exist_ok=True)
        img.save(target, "WEBP", quality=WEBP_QUALITY, method=6)


def write_target(source: Path, target: Path) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    if source.suffix.lower() == ".webp":
        target.write_bytes(source.read_bytes())
    else:
        optimize_image(source, target)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    gallery = []

    for item in SOURCES:
        source = item["source"]
        if not source.exists():
            raise FileNotFoundError(f"Missing source image: {source}")

        target = OUT_DIR / item["filename"]
        write_target(source, target)
        gallery.append({"src": f"/images/reisen/koeln-2024/{item['filename']}", "alt": item["alt"]})

    MANIFEST.write_text(
        json.dumps({"title": "Herrentour Köln 2024", "images": gallery}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"Wrote {len(gallery)} images to {OUT_DIR}")


if __name__ == "__main__":
    main()
