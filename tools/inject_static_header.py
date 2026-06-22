"""Fügt statischen Header in alle HTML-Seiten ein (sichtbar ohne JavaScript)."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

NAV = [
    ("startseite", "Startseite", "index.html"),
    ("termine", "Termine", "termine.html"),
    ("eventkalender", "Eventkalender", "eventkalender.html"),
    ("ausfluege", "Ausflüge", "ausfluege.html"),
    ("galerie", "Galerie", "galerie.html"),
    ("fotos-videos", "Fotos & Videos", "veranstaltungen/"),
    ("partnervereine", "Partnervereine", "partnervereine.html"),
    ("mitglied-werden", "Mitglied werden", "mitglied-werden.html"),
    ("kontakt", "Kontakt", "kontakt.html"),
]

INSTAGRAM_SVG = (
    '<svg viewBox="0 0 24 24" aria-hidden="true">'
    '<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>'
    "</svg>"
)

LOGIN_SVG = (
    '<svg viewBox="0 0 24 24" aria-hidden="true">'
    '<path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>'
    "</svg>"
)

SLOT_RE = re.compile(
    r'<div id="site-header" class="site-header">\s*(?:<header[\s\S]*?</header>\s*)?</div>',
    re.MULTILINE,
)


def render_header(active: str) -> str:
    links = []
    for page_id, label, href in NAV:
        active_cls = " nav__link--active" if page_id == active else ""
        links.append(f'<li><a href="{href}" class="nav__link{active_cls}">{label}</a></li>')
    nav = "\n          ".join(links)

    return f"""<div id="site-header" class="site-header">
    <header class="header" id="header">
      <div class="container header__inner">
        <a href="index.html" class="header__logo" aria-label="Zur Startseite">
          <img src="images/logo-kulturverein.png" alt="Logo Kulturverein Wölpinghausen" class="logo-img header__logo-img" width="52" height="52">
          <span class="header__logo-text">
            <span class="header__logo-name">Kulturverein</span>
            <span class="header__logo-place">Wölpinghausen</span>
          </span>
        </a>
        <button class="burger" id="burger" aria-label="Menü öffnen" aria-expanded="false" aria-controls="nav">
          <span class="burger__line"></span><span class="burger__line"></span><span class="burger__line"></span>
        </button>
        <nav class="nav" id="nav" aria-label="Hauptnavigation">
          <ul class="nav__list">
          {nav}
          </ul>
        </nav>
        <a href="login.html" class="header__login" aria-label="Mitglieder-Login">
          {LOGIN_SVG}
          Login
        </a>
        <a href="https://www.instagram.com/kulturverein_woelpinghausen?igsh=enQyNnpzdjk0ZGs=" class="header__instagram" target="_blank" rel="noopener noreferrer" aria-label="Instagram Kulturverein Wölpinghausen">{INSTAGRAM_SVG}</a>
      </div>
    </header>
  </div>"""


def page_id_from_html(text: str) -> str:
    match = re.search(r'<body[^>]*data-page="([^"]*)"', text)
    return match.group(1) if match else ""


for html in ROOT.glob("*.html"):
    text = html.read_text(encoding="utf-8")
    if 'id="site-header"' not in text:
        continue
    active = page_id_from_html(text)
    new_slot = render_header(active)
    if SLOT_RE.search(text):
        text = SLOT_RE.sub(new_slot, text, count=1)
    else:
        text = text.replace(
            '<div id="site-header" class="site-header"></div>',
            new_slot,
        )
    html.write_text(text, encoding="utf-8")
    print("OK", html.name, f"(active: {active or '-'})")

print("Fertig.")
