"""Lädt passende Stock-Fotos für die Vereinswebseite herunter (Unsplash, frei nutzbar)."""
import urllib.request
from pathlib import Path

IMAGES = Path(__file__).resolve().parent.parent / "images"
IMAGES.mkdir(exist_ok=True)

# Themenpassende Unsplash-Fotos – sichtbare echte Bilder statt Farbverläufe
PHOTOS = {
    "hero-gruppe.jpg": "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1600&h=900&q=85",
    "biergarten.jpg": "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&h=800&q=85",
    "bier.jpg": "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?auto=format&fit=crop&w=800&h=800&q=85",
    "leipzig-nacht.jpg": "https://images.unsplash.com/photo-1549924231-f129b911e442?auto=format&fit=crop&w=900&h=700&q=85",
    "leipzig-rathaus.jpg": "https://images.unsplash.com/photo-1516550893923-42d28e5677af?auto=format&fit=crop&w=900&h=700&q=85",
    "goethe-denkmal.jpg": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=900&h=700&q=85",
    "woodcutter.jpg": "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=900&h=700&q=85",
    "woodcutter-banner.jpg": "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&h=600&q=85",
}

UA = "Kulturverein-Woelpinghausen/1.0 (local asset download)"


def download(name: str, url: str) -> None:
    dest = IMAGES / name
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as resp:
        dest.write_bytes(resp.read())
    print("OK", name, f"({dest.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    for filename, source in PHOTOS.items():
        download(filename, source)
    print("Fertig – echte Fotos gespeichert.")
