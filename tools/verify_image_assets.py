"""Prüft Pfad-Referenzen gegen lokale Bilddateien."""
from pathlib import Path
import re
import urllib.request

ROOT = Path(__file__).resolve().parent.parent
IMAGES = ROOT / "images"

REQUIRED = [
    "hero-final.png",
    "logo-kulturverein.png",
    "gallery-biergarten-gruppe.jpg",
    "gallery-bierglaeser.jpg",
    "gallery-goethe-gruppe.jpg",
    "gallery-leipzig-nacht-1.jpg",
    "gallery-leipzig-nacht-2.jpg",
    "gallery-leipzig-rathaus.jpg",
    "gallery-woodcutter-ankunft.jpg",
    "gallery-woodcutter-banner.jpg",
    "partner-schuetzenverein-woelpinghausen.png",
    "partner-dorfjugend-woelpinghausen.png",
]

refs = set()
for html in ROOT.glob("*.html"):
    refs.update(re.findall(r'(?:src|href)=["\'](images/[^"\']+)["\']', html.read_text(encoding="utf-8")))

css = (ROOT / "css/style.css").read_text(encoding="utf-8")
refs.update(f"images/{name}" for name in re.findall(r'url\(["\']?\.\./images/([^"\')\s]+)', css))

missing_required = [name for name in REQUIRED if not (IMAGES / name).exists()]
missing_refs = sorted(r for r in refs if not (ROOT / r).exists())

print("Erforderliche Dateien:", len(REQUIRED))
if missing_required:
    print("FEHLEND (Pflicht):", missing_required)
    raise SystemExit(1)

print("HTML/CSS-Referenzen:", len(refs))
if missing_refs:
    print("FEHLEND (Referenzen):", missing_refs)
    raise SystemExit(1)

print("Alle Pflicht-Bilder und Referenzen OK.")
