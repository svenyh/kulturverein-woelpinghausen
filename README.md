# Kulturverein Wölpinghausen

Offizielle Webseite des **Wölpinghausener Kulturverein** – modern, responsiv und als statische HTML-Seite gehostet. Optisch orientiert am vorhandenen Mockup (Bordeaux, Creme, große Bilder, Kartenlayout).

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

## Deployment

Die Seite ist eine **statische HTML/CSS/JS-Seite ohne Build-Schritt**. Alle Dateien liegen im Repository-Root.

Details und Custom-Domain-Anleitung: [`docs/deployment.md`](docs/deployment.md)

### GitHub Pages (aktiv)

| | |
|---|---|
| URL | https://svenyh.github.io/kulturverein-woelpinghausen/ |
| Branch | `main` |
| Mechanismus | GitHub Actions (`.github/workflows/pages.yml`) |

Nach jedem Push auf `main` wird automatisch neu deployed (ca. 1–2 Minuten).

### Cloudflare Pages (empfohlen für Produktion)

| | |
|---|---|
| Projektname | `kulturverein-woelpinghausen` |
| URL (nach Einrichtung) | https://kulturverein-woelpinghausen.pages.dev |
| Branch | `main` |
| Build command | *(leer – kein Build nötig)* |
| Output directory | *(leer – Root `/`)* |

**Einrichtung:** Cloudflare Dashboard → Workers & Pages → Create → Connect to Git → Repository `svenyh/kulturverein-woelpinghausen` → Framework: **None** → Deploy.

Vollständige Schritte: [`docs/deployment.md`](docs/deployment.md)

### GitHub Pages vs. Cloudflare Pages

| | GitHub Pages | Cloudflare Pages |
|---|---|---|
| **Kosten** | Kostenlos (öffentliches Repo) | Kostenlos |
| **URL** | `*.github.io/...` | `*.pages.dev` + eigene Domain |
| **CDN/Performance** | Gut | Sehr gut (globales Cloudflare-Netz) |
| **Eigene Domain + SSL** | Möglich, umständlicher | Einfach, automatisches SSL |
| **Setup** | Bereits aktiv | Einmalig im Cloudflare-Dashboard |
| **Auto-Deploy bei Push** | Ja | Ja (nach Git-Verbindung) |

**Empfehlung:**

- **GitHub Pages** – gut für Preview, Backup und schnellen Start (bereits aktiv)
- **Cloudflare Pages** – empfohlen für **Produktion**, besonders wenn später eine **eigene Domain** (z. B. `kulturverein-woelpinghausen.de`) angebunden werden soll

Beide können parallel laufen. Für die öffentliche Vereins-Domain später Cloudflare Pages nutzen.

### Änderungen deployen

Ein Push auf `main` aktualisiert **beide** Plattformen (sofern Cloudflare Pages mit GitHub verbunden ist):

```bash
git add .
git commit -m "Update website"
git push origin main
```

GitHub Pages: ca. 1–2 Minuten. Cloudflare Pages: ca. 1–2 Minuten.

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
