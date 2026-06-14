# Kulturverein Wölpinghausen

Offizielle Webseite des **Kulturverein Wölpinghausen e.V.** – modern, responsiv und als statische HTML-Seite gehostet. Optisch orientiert am vorhandenen Mockup (Bordeaux, Creme, große Bilder, Kartenlayout).

## Projektbeschreibung

Öffentliche Vereinsseite mit Fokus auf Gemeinschaft, Ausflüge, Tradition, Dorfleben und Partnervereine. Login, Mitgliederbereich und Admin-Dashboard sind **optisch vorbereitet** – die technische Anbindung folgt später.

## Seitenübersicht

| Datei | Inhalt |
|-------|--------|
| `index.html` | Startseite (Hero, Über uns, Termine, Galerie, Partner) |
| `termine.html` | Alle Termine |
| `ausfluege.html` | Ausflüge & Fahrten |
| `galerie.html` | Fotogalerie mit Lightbox |
| `partnervereine.html` | Partnervereine |
| `mitglied-werden.html` | Mitgliedsanfrage |
| `kontakt.html` | Kontakt |
| `login.html` | Login (vorbereitet) |
| `registrierung.html` | Registrierung (vorbereitet) |
| `mitgliederbereich.html` | Mitglieder-Dashboard (vorbereitet) |
| `admin.html` | Admin-Dashboard (vorbereitet) |
| `impressum.html` | Impressum (Vorlage) |
| `datenschutz.html` | Datenschutz (Vorlage) |

## Bildstruktur

Alle Bilder liegen unter `/images/`:

- `hero-gruppe.jpg` – Hero-Gruppenfoto
- `biergarten.jpg`, `bier.jpg`
- `leipzig-nacht.jpg`, `leipzig-rathaus.jpg`, `goethe-denkmal.jpg`
- `woodcutter.jpg`, `woodcutter-banner.jpg`
- `logo-kulturverein.png`

## Lokale Installation

Kein Build-Schritt nötig. Einfach `index.html` im Browser öffnen oder einen lokalen Server starten:

```bash
# Python
python -m http.server 8080

# Node (optional)
npx serve .
```

Dann: http://localhost:8080

## GitHub Pages Deployment

Die Seite wird über **GitHub Pages** aus dem `main`-Branch bereitgestellt (Workflow in `.github/workflows/pages.yml`).

Nach dem Push ist die Seite erreichbar unter:

**https://svenyh.github.io/kulturverein-woelpinghausen/**

## Geplante Erweiterung: Mitgliederlogin

### Rollen

| Rolle | Zugriff |
|-------|---------|
| Besucher | Öffentliche Seiten |
| Mitglied | Profil, Termine, interne Galerie, Dokumente |
| Vorstand/Admin | Verwaltung aller Inhalte |

### Geplante Datenbank-Tabellen

- `users` – Mitglieder, Passwort-Hash, Rolle, Status
- `events` – Termine mit Sichtbarkeit
- `event_registrations` – Anmeldungen zu Fahrten
- `gallery_images` – Galerie mit Sichtbarkeit
- `partner_clubs` – Partnervereine
- `member_documents` – Interne Downloads

### Empfehlung Backend/Datenbank

| Option | Eignung |
|--------|---------|
| **PostgreSQL** | Empfohlen für Produktion – DSGVO-konform self-hosted |
| **Supabase** | Gute Alternative mit eingebautem Auth (EU-Region) |
| **SQLite** | Nur für lokale Entwicklung |

Technologie-Vorschlag: Node.js/Express oder Supabase als Backend, JWT-Sessions, bcrypt für Passwörter.

## Änderungen pushen

```bash
git add .
git commit -m "Beschreibung der Änderung"
git push origin main
```

GitHub Pages aktualisiert die Vorschau automatisch nach dem Push (ca. 1–2 Minuten).
