#!/usr/bin/env python3
"""Optimize Köln 2024 travel images and emit gallery manifest."""

from __future__ import annotations

import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "images" / "reisen" / "koeln-2024"
MANIFEST = OUT_DIR / "gallery-manifest.json"
IMAGES = ROOT / "images"

# Gallery order for Herrentour Köln 2024
SOURCES = [
    {
        "source": IMAGES / "gallery-woodcutter-ankunft.jpg",
        "filename": "anreise-bahnhof.webp",
        "alt": "Anreise in Köln – die Gruppe trifft sich mit Koffern vor dem Woodcutter",
    },
    {
        "source": IMAGES / "gallery-woodcutter-banner.jpg",
        "filename": "erste-eindruecke.webp",
        "alt": "Erste Eindrücke in der Kölner Altstadt am Woodcutter",
    },
    {
        "source": IMAGES / "gallery-bierglaeser.jpg",
        "filename": "koelsch-empfang.webp",
        "alt": "Das erste Kölsch wird eingeschenkt – Empfang in Köln",
    },
    {
        "source": IMAGES / "hero-bierkartographen-wide-cover.jpg",
        "filename": "gruppenfoto.webp",
        "alt": "Gruppenfoto der Bierkartographen auf der Herrentour",
    },
    {
        "source": IMAGES / "events" / "koeln-2024-cover.webp",
        "filename": "dom-koeln.webp",
        "alt": "Der Kölner Dom bei Abendstimmung über dem Rhein",
    },
    {
        "source": IMAGES / "gallery-woodcutter-ankunft.jpg",
        "filename": "altstadt.webp",
        "alt": "Altstadtflair in Köln – Kopfsteinpflaster und historische Fassaden",
        "crop": (0.35, 0.0, 1.0, 1.0),
    },
    {
        "source": IMAGES / "hero-bierkartographen-wide.jpg",
        "filename": "spaziergang.webp",
        "alt": "Gemeinsamer Spaziergang der Bierkartographen – unterwegs in Köln",
    },
    {
        "source": IMAGES / "biergarten.jpg",
        "filename": "brauhaus.webp",
        "alt": "Gemütliches Brauhaus-Interieur mit Zapfanlage und Holztresen",
    },
    {
        "source": IMAGES / "gallery-biergarten-gruppe.jpg",
        "filename": "brauhaus-koelsch.webp",
        "alt": "Kölsch am Tisch – gesellige Runde im Brauhaus",
    },
    {
        "source": IMAGES / "woodcutter-banner.jpg",
        "filename": "gemeinsamer-abend.webp",
        "alt": "Gemeinsamer Abend in Köln – Feierstimmung mit Konfetti und Lichtshow",
    },
    {
        "source": IMAGES / "events" / "koeln-2024-cover.webp",
        "filename": "stadtmotiv-rhein.webp",
        "alt": "Stadtmotiv am Rhein mit Kölner Dom und Skyline",
    },
    {
        "source": IMAGES / "woodcutter.jpg",
        "filename": "heimreise.webp",
        "alt": "Ausklang der Tour – gemeinsam unterwegs auf dem Heimweg",
    },
]

LEGACY_FILENAMES = [
    "hero-dom-skyline.webp",
    "bierkartographen-emblem.webp",
    "brauhaus-gruppe.webp",
]

MAX_WIDTH = 1600
WEBP_QUALITY = 82


def optimize_image(source: Path, target: Path, crop: tuple[float, float, float, float] | None = None) -> None:
    with Image.open(source) as img:
        if img.mode == "RGBA":
            background = Image.new("RGB", img.size, (255, 255, 255))
            background.paste(img, mask=img.split()[3])
            img = background
        elif img.mode != "RGB":
            img = img.convert("RGB")

        if crop:
            width, height = img.size
            left = int(width * crop[0])
            top = int(height * crop[1])
            right = int(width * crop[2])
            bottom = int(height * crop[3])
            img = img.crop((left, top, right, bottom))

        width, height = img.size
        if width > MAX_WIDTH:
            ratio = MAX_WIDTH / width
            img = img.resize((MAX_WIDTH, int(height * ratio)), Image.Resampling.LANCZOS)

        target.parent.mkdir(parents=True, exist_ok=True)
        img.save(target, "WEBP", quality=WEBP_QUALITY, method=6)


def write_target(source: Path, target: Path, crop: tuple[float, float, float, float] | None = None) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    if source.suffix.lower() == ".webp" and source.resolve() != target.resolve() and not crop:
        if target.exists():
            target.unlink()
        target.write_bytes(source.read_bytes())
        return

    if source.resolve() == target.resolve():
        return

    optimize_image(source, target, crop=crop)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    expected = {item["filename"] for item in SOURCES}
    for legacy in LEGACY_FILENAMES:
        legacy_path = OUT_DIR / legacy
        if legacy_path.exists() and legacy not in expected:
            legacy_path.unlink()

    gallery = []
    for item in SOURCES:
        source = item["source"]
        if not source.exists():
            raise FileNotFoundError(f"Missing source image: {source}")

        target = OUT_DIR / item["filename"]
        write_target(source, target, crop=item.get("crop"))
        gallery.append({"src": f"/images/reisen/koeln-2024/{item['filename']}", "alt": item["alt"]})

    MANIFEST.write_text(
        json.dumps({"title": "Herrentour Köln 2024", "images": gallery}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"Wrote {len(gallery)} images to {OUT_DIR}")


if __name__ == "__main__":
    main()
