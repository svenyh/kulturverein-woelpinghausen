# Kulturverein Wölpinghausen

Offizielle Webseite des **Wölpinghausener Kulturverein** – modern, responsiv und als statische HTML-Seite gehostet. Optisch orientiert am vorhandenen Mockup (Bordeaux, Creme, große Bilder, Kartenlayout).

## Projektbeschreibung

Öffentliche Vereinsseite mit Fokus auf Gemeinschaft, Ausflüge, Tradition, Dorfleben und Partnervereine. Auf **Cloudflare Pages** ergänzen Pages Functions und eine **D1-Datenbank** den statischen Auftritt um einen Online-Admin und dynamische Inhalte. Der **Mitgliederbereich** und das **Admin-Dashboard** sind funktional umgesetzt; ein separates Mitglieder-Login folgt noch.

### Architektur auf einen Blick

| Schicht | Technologie | Zweck |
|---------|-------------|-------|
| Frontend | Statisches HTML/CSS/JS | Öffentliche Seiten, Mitgliederbereich, Admin-Oberflächen |
| API | Cloudflare Pages Functions (`functions/`) | Events, Medien, Mitgliederinhalte, Admin-CRUD |
| Datenbank | Cloudflare D1 (`kulturverein-events`) | Termine, Medien-Events, Mitglieder-CMS |
| Auth (Admin) | Cloudflare Access | Schutz von `/admin/*` und `/api/admin/*` |
| Fallback | `data/events.json` | Eventkalender auf GitHub Pages ohne D1 |

Auf **GitHub Pages** funktionieren alle statischen Seiten; dynamische APIs und der Admin-Bereich setzen **Cloudflare Pages** mit D1-Binding voraus.

## Seitenübersicht

| Datei / Pfad | Inhalt | Status |
|--------------|--------|--------|
| `index.html` | Startseite (Hero, Über uns, Termine, Galerie, Partner) | Aktiv |
| `termine.html` | Alle Termine | Aktiv |
| `eventkalender.html` | Jahresübersicht wichtiger Veranstaltungen | Aktiv (D1 oder JSON-Fallback) |
| `ausfluege.html` | Ausflüge & Fahrten | Aktiv |
| `galerie.html` | Fotogalerie mit Lightbox | Aktiv |
| `fotos-videos.html` | Medienübersicht nach Veranstaltungen | Aktiv |
| `veranstaltungen/` | Detailseiten einzelner Veranstaltungen | Aktiv |
| `partnervereine.html` | Partnervereine | Aktiv |
| `mitglied-werden.html` | Mitgliedsanfrage | Aktiv |
| `kontakt.html` | Kontakt | Aktiv |
| `login.html` | Weiterleitung zum Mitgliederbereich | Platzhalter (kein Login) |
| `registrierung.html` | Weiterleitung zu „Mitglied werden" | Platzhalter |
| `mitgliederbereich/` | Mitglieder-Dashboard (News, Dokumente, Termine, Helfer) | Aktiv (öffentlich, D1-gestützt) |
| `admin/` | Admin-Dashboard mit Modulen | Aktiv (Cloudflare Access) |
| `impressum.html` | Impressum (Vorlage) | Vorlage |
| `datenschutz.html` | Datenschutz (Vorlage) | Vorlage |

### Admin-Module (`/admin/`)

| Modul | Pfad | Funktion |
|-------|------|----------|
| Eventkalender | `/admin/events/` | iCal-Import, Kandidatenprüfung, Veröffentlichung |
| Medien | `/admin/media/` | Coverbilder und Videos für Veranstaltungen |
| Mitglieder | `/admin/members/` | News, Dokumente, Termine, Helfer-Einsätze |
| Partnervereine | – | Geplant |
| Einstellungen | – | Geplant |

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

Für die vollständige Cloudflare-Vorschau inklusive Pages Functions und lokaler D1:

```bash
npm install
npm run cf:d1:migrate:local
npm run cf:dev
```

Wrangler startet unter http://127.0.0.1:8788. Details: [`docs/cloudflare-admin-preview.md`](docs/cloudflare-admin-preview.md)

## Deployment

Die Seite ist eine **statische HTML/CSS/JS-Seite ohne Build-Schritt**. Alle Dateien liegen im Repository-Root. Pages Functions und D1-Bindings werden nur auf Cloudflare Pages aktiv.

Details und Custom-Domain-Anleitung: [`docs/deployment.md`](docs/deployment.md)

### GitHub Pages (aktiv)

| | |
|---|---|
| URL | https://svenyh.github.io/kulturverein-woelpinghausen/ |
| Branch | `main` |
| Mechanismus | GitHub Actions (`.github/workflows/pages.yml`) |

Nach jedem Push auf `main` wird automatisch neu deployed (ca. 1–2 Minuten). Der Eventkalender nutzt hier den JSON-Fallback (`data/events.json`); Admin und Mitglieder-APIs sind nicht verfügbar.

### Cloudflare Pages (empfohlen für Produktion)

| | |
|---|---|
| Projektname | `kulturverein-woelpinghausen` |
| URL (nach Einrichtung) | https://kulturverein-woelpinghausen.pages.dev |
| Branch | `main` |
| Build command | *(leer – kein Build nötig)* |
| Build output directory | `.` *(statischer Repository-Root)* |
| Deploy command | *(leer – Pages deployt nach dem Git-Build automatisch)* |

**Einrichtung:** Cloudflare Dashboard → Workers & Pages → Create → Connect to Git → Repository `svenyh/kulturverein-woelpinghausen` → Framework: **None** → Deploy.

Wichtig: Das Repository muss als **Pages-Projekt** verbunden sein. Ein Workers-Deploy-Command ist hier falsch. Wenn das Dashboard zwingend einen Deploy-Command wie `wrangler deploy` verlangt, wurde ein Workers-Build statt eines Pages-Projekts angelegt.

Vollständige Schritte: [`docs/deployment.md`](docs/deployment.md)

### Kontakt- und Mitgliedsformulare

Die Formulare auf `kontakt.html` und `mitglied-werden.html` senden an die
Cloudflare Pages Function `POST /api/forms`. Auf GitHub Pages steht dieser
Endpunkt nicht zur Verfügung.

Vor der Nutzung müssen im Cloudflare-Pages-Projekt folgende Variablen gesetzt
werden; das Repository enthält bewusst keine Empfänger-, Absender- oder
Schlüsselwerte:

- `MAIL_API_KEY` als Secret: API-Schlüssel für Resend
- `CONTACT_EMAIL`: tatsächliche Empfängeradresse
- `FROM_EMAIL`: bei Resend verifizierte Absenderadresse

Fehlt eine Variable, antwortet der Endpunkt mit Status `503` und versendet
nichts. Formulardaten werden nicht in D1 gespeichert.

Der Endpunkt nutzt ein vorhandenes Rate-Limit-Binding namens
`FORM_RATE_LIMITER`. Lokal darf das Binding fehlen. Wrangler 4.103.0 unterstützt
die Konfiguration unter `ratelimits`, verlangt aber eine echte
`namespace_id`; deshalb wurde ohne vorhandene ID kein Platzhalter in
`wrangler.jsonc` eingetragen. Das Binding mit einer echten Namespace-ID im
Cloudflare-Dashboard beziehungsweise in der Wrangler-Konfiguration ergänzen.
Zusätzlich sollte für `/api/forms` im Dashboard eine WAF-Rate-Limit-Regel
eingerichtet werden.

### GitHub Pages vs. Cloudflare Pages

| | GitHub Pages | Cloudflare Pages |
|---|---|---|
| **Kosten** | Kostenlos (öffentliches Repo) | Kostenlos |
| **URL** | `*.github.io/...` | `*.pages.dev` + eigene Domain |
| **CDN/Performance** | Gut | Sehr gut (globales Cloudflare-Netz) |
| **Eigene Domain + SSL** | Möglich, umständlicher | Einfach, automatisches SSL |
| **Setup** | Bereits aktiv | Einmalig im Cloudflare-Dashboard |
| **Auto-Deploy bei Push** | Ja | Ja (nach Git-Verbindung) |
| **D1 / Admin / APIs** | Nein | Ja (nach Binding & Migration) |

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

## Mitgliederbereich & Admin

### Was bereits umgesetzt ist

- **Mitgliederbereich** (`/mitgliederbereich/`) zeigt öffentlich sichtbare Inhalte aus D1: Aktuelles, Dokumente, interne Termine und Helfer-Einsätze
- **Admin-CMS** (`/admin/members/`) ermöglicht CRUD für alle Mitgliederinhalte inkl. Sichtbarkeitssteuerung
- **Event-Admin** (`/admin/events/`) mit iCal-Import, Kandidatenprüfung und Veröffentlichung in D1
- **Medien-Admin** (`/admin/media/`) für Veranstaltungs-Cover und Videos
- **API-Endpunkte** unter `/api/members/*` (öffentlich lesend) und `/api/admin/*` (geschützt)

### D1-Tabellen (Migrationen in `migrations/`)

| Tabelle | Inhalt |
|---------|--------|
| `events` | Öffentliche Termine (iCal-Import, Freigabe-Workflow) |
| `media_events` | Medien-Metadaten für Veranstaltungen |
| `member_news` | Aktuelles im Mitgliederbereich |
| `member_documents` | Interne Dokumente |
| `member_events` | Interne Termine |
| `member_helpers` | Helfer-Einsätze mit Status |

Migrationen lokal und remote ausführen:

```bash
npm run cf:d1:migrate:local    # lokale Entwicklung
npm run cf:d1:migrate:remote   # Cloudflare-Produktion
```

### Was noch folgt

| Feature | Status |
|---------|--------|
| Mitglieder-Login mit Passwort/Session | Geplant |
| Rollen (Mitglied vs. Vorstand) | Geplant |
| Geschützter Mitgliederbereich | Geplant |
| Event-Anmeldungen zu Fahrten | Geplant |
| Partnervereine im Admin | Geplant |
| Benutzerverwaltung (`users`-Tabelle) | Geplant |

Bis dahin ist der Mitgliederbereich bewusst **öffentlich zugänglich** und zeigt nur freigegebene, nicht-sensible Inhalte. Der Admin-Bereich ist über **Cloudflare Access** geschützt.

## Test: Event-Import (lokal)

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

> **Hinweis:** Auf Cloudflare Pages ist der Event-Admin unter `/admin/events/` verfügbar und arbeitet direkt mit D1. Der lokale Prototyp unter `tools/` bleibt als Offline-Alternative für JSON-basierte Workflows erhalten.

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

## Cloudflare Pages Functions

Unter `functions/` liegen die Pages Functions für API und Admin-Schutz:

| Endpunkt | Zugriff | Beschreibung |
|----------|---------|--------------|
| `GET /api/events` | Öffentlich | Veröffentlichte Termine aus D1 (Fallback: `[]`) |
| `GET /api/media` | Öffentlich | Medien-Metadaten für Veranstaltungen |
| `GET /api/members/news` | Öffentlich | Sichtbare News im Mitgliederbereich |
| `GET /api/members/documents` | Öffentlich | Sichtbare Dokumente |
| `GET /api/members/events` | Öffentlich | Sichtbare interne Termine |
| `GET /api/members/helpers` | Öffentlich | Sichtbare Helfer-Einsätze |
| `/api/admin/*` | Cloudflare Access | Import, CRUD, Veröffentlichung, Upload |
| `GET /api/admin/health` | Cloudflare Access | Statusprüfung des Admin-Systems |

Der Eventkalender (`eventkalender.js`, `home-events.js`) versucht zuerst `/api/events` und fällt auf `data/events.json` zurück, wenn keine D1-Daten verfügbar sind.

Die manuelle Einrichtung von D1, Migration, Access und Preview-Test ist hier dokumentiert: [`docs/cloudflare-admin-preview.md`](docs/cloudflare-admin-preview.md)

## npm-Skripte

| Befehl | Beschreibung |
|--------|--------------|
| `npm run cf:dev` | Lokale Pages-Vorschau mit Functions (Port 8788) |
| `npm run cf:d1:migrate:local` | D1-Migrationen lokal anwenden |
| `npm run cf:d1:migrate:remote` | D1-Migrationen auf Cloudflare anwenden |
| `npm run events:test` | iCal-Import testen (lokal, JSON) |
| `npm run events:publish` | Freigegebene Termine nach `data/events.json` schreiben |
| `npm run admin:events` | Lokaler Event-Admin-Prototyp (Port 8787) |
