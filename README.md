# Kulturverein Wölpinghausen

Offizielle Webseite des **Wölpinghausener Kulturverein** – modern, responsiv und als statische HTML-Seite gehostet. Optisch orientiert am vorhandenen Mockup (Bordeaux, Creme, große Bilder, Kartenlayout).

## Projektbeschreibung

Öffentliche Vereinsseite mit Fokus auf Gemeinschaft, Ausflüge, Tradition, Dorfleben und Partnervereine. Login, Mitgliederbereich und Admin-Dashboard sind **optisch vorbereitet** – die technische Anbindung folgt später.

## Seitenübersicht

| Datei | Inhalt |
|-------|--------|
| `index.html` | Startseite (Hero, Über uns, Termine, Galerie, Partner) |
| `termine.html` | Alle Termine |
| `eventkalender.html` | Jahresübersicht wichtiger Veranstaltungen |
| `ausfluege.html` | Ausflüge & Fahrten |
| `galerie.html` | Fotogalerie mit Lightbox |
| `fotos-videos.html` | Medienübersicht nach Veranstaltungen |
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

## Test: Event-Import

Das isolierte Testskript `tools/fetch-events-test.js` liest den öffentlichen iCalendar-Export der Samtgemeinde Sachsenhagen mit `node-ical` ein. Es ist nicht mit dem Frontend verbunden und veröffentlicht keine Termine.

```bash
npm install
npm run events:test
```

Die nächsten maximal 20 Termine werden nach `Europe/Berlin` umgerechnet, im Terminal ausgegeben und testweise nach `data/events-test.json` geschrieben. Der Import übernimmt den Feed unverändert; eine automatische Filterung auf Wölpinghausen findet nicht statt. Die erzeugte JSON-Datei ist per `.gitignore` von der Veröffentlichung ausgeschlossen.

Zusätzlich erzeugt das Skript `data/events-candidates.json` mit maximal 100 chronologisch sortierten und nach Monat gruppierten Kandidaten. Diese Datei dient ausschließlich der manuellen Prüfung. Jeder Termin startet mit `showOnWebsite: false`; eine spätere Veröffentlichung erfordert, dass dieses Feld bewusst auf `true` gesetzt wird. Auch diese Prüfdatei ist per `.gitignore` ausgeschlossen.

Nach der manuellen Prüfung erzeugt folgender Befehl die öffentliche Datei `data/events.json`:

```bash
npm run events:publish
```

Das Publish-Skript übernimmt ausschließlich Termine mit dem strikt booleschen Wert `showOnWebsite: true`. Nicht freigegebene Termine und interne Prüfhinweise werden nicht in die öffentliche Datei geschrieben.

Optional kann eine andere Export-URL verwendet werden:

```powershell
$env:SACHSENHAGEN_ICAL_URL="https://www.sachsenhagen.de/veranstaltungen/veranstaltungen.ical?..."
npm.cmd run events:test
```

## Lokaler Admin-Prototyp: Eventkalender

Der lokale Admin-Prototyp bündelt Import, manuelle Auswahl und Veröffentlichung in einer Oberfläche. Er läuft ausschließlich auf `127.0.0.1`, besitzt keine Authentifizierung und führt weder Git-Commits noch Pushes aus.

```powershell
npm.cmd install
npm.cmd run admin:events
```

Danach im Browser öffnen: http://127.0.0.1:8787/admin-events.html

Der Ablauf:

1. **Termine neu laden** ruft den vorhandenen iCalendar-Import auf. Die Kandidaten werden neu geschrieben und beginnen aus Sicherheitsgründen alle mit `showOnWebsite: false`.
2. Die Kandidaten lassen sich nach Monat, Verein/Organisation und Serienstatus filtern.
3. Gewünschte Termine mit **Auf Website anzeigen** markieren und **Auswahl speichern** wählen. Dadurch wird nur die lokale, ignorierte Datei `data/events-candidates.json` geändert.
4. **Eventkalender veröffentlichen** ruft das vorhandene Publish-Skript auf. Nur Einträge mit `showOnWebsite: true` werden nach `data/events.json` übernommen.
5. Über **Vorschau** kann der öffentliche Kalender lokal kontrolliert werden.

Ein anderer Port kann bei Bedarf gesetzt werden:

```powershell
$env:EVENT_ADMIN_PORT=8790
npm.cmd run admin:events
```

Der Prototyp ist nicht für einen öffentlichen Server vorgesehen. Ohne spätere Authentifizierung und persistentes Backend darf er nicht als öffentlicher Admin-Bereich eingesetzt werden.
