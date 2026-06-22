# Cloudflare-Preview für den Event-Admin

Diese Grundlage ergänzt Pages Functions, eine D1-Migration und einen durch Cloudflare Access geschützten Health-Endpunkt. Der öffentliche Eventkalender liest weiterhin `data/events.json`. Import, Kandidatenverwaltung und Veröffentlichung sind in diesem Schritt nicht enthalten.

## Deployment-Modus

Die Preview muss aus einem **Cloudflare Pages-Projekt mit Git-Integration** entstehen. Im Dashboard bleiben **Build command** und **Deploy command** leer; als **Build output directory** wird `.` verwendet. Cloudflare veröffentlicht die Pages-Ausgabe nach einem Push automatisch.

Ein Workers-Deploy-Command ist für diese Struktur nicht geeignet. `wrangler.jsonc` kennzeichnet das Projekt mit `pages_build_output_dir` ausdrücklich als Pages-Projekt.

## Enthaltene Endpunkte

- `GET /api/events` liefert vorerst immer `[]`.
- `GET /api/admin/health` prüft den Access-Schutz und den Admin-Status.

Die Middleware unter `functions/api/admin/_middleware.js` validiert das von Cloudflare Access gesetzte JWT mit der Web-Crypto-API (keine zusätzliche Auth-Dependency). Es gibt keinen lokalen Testnutzer und keinen Auth-Bypass.

**Ohne Access-Konfiguration bleibt der Online-Admin absichtlich deaktiviert:**

| Situation | Antwort |
|-----------|---------|
| `CF_ACCESS_TEAM_DOMAIN` oder `CF_ACCESS_AUD` fehlen | HTTP `503`, Health: `{ ok: false, status: "disabled" }` |
| Access konfiguriert, aber kein Token | HTTP `401`, Health: `{ ok: false, status: "unauthenticated" }` |
| Access konfiguriert, Token ungültig | HTTP `403`, Health: `{ ok: false, status: "forbidden" }` |
| Access konfiguriert und Token gültig | Health: `{ ok: true, status: "ready" }` |

## Lokal testen

```powershell
npm.cmd install
npm.cmd run cf:dev
```

Wrangler startet die lokale Pages-Vorschau unter `http://127.0.0.1:8788`.

```powershell
Invoke-RestMethod http://127.0.0.1:8788/api/events
Invoke-WebRequest http://127.0.0.1:8788/api/admin/health
```

Die erste Anfrage muss eine leere JSON-Liste liefern. Die Admin-Anfrage muss lokal mit `503` und `status: "disabled"` abgelehnt werden, solange keine echte Access-Konfiguration vorhanden ist. Cloudflare Access wird bewusst nicht lokal simuliert.

Konfiguration prüfen:

```powershell
npx.cmd wrangler check
```

## D1-Datenbank anlegen

1. Bei Cloudflare anmelden:

   ```powershell
   npx.cmd wrangler login
   ```

2. Datenbank erstellen:

   ```powershell
   npx.cmd wrangler d1 create kulturverein-events
   ```

3. Die von Wrangler ausgegebene `database_id` in `wrangler.jsonc` eintragen und den Platzhalter `PASTE_D1_DATABASE_ID_HERE` ersetzen. Der Binding-Name muss `DB` lauten.
4. Im Cloudflare-Dashboard beim Pages-Projekt unter **Settings > Bindings** dieselbe D1-Datenbank für Preview und Production als `DB` binden.

Ohne gültige `database_id` schlagen Remote-Migrationen und produktive D1-Zugriffe fehl. Lokale Migrationen mit `--local` funktionieren unabhängig davon.

## Migration ausführen

Nach Ergänzung der echten `database_id`:

```powershell
npm.cmd run cf:d1:migrate:local
npm.cmd run cf:d1:migrate:remote
```

Der Remote-Befehl verändert die Cloudflare-Datenbank und sollte erst nach erfolgreichem lokalen Test ausgeführt werden.

## Cloudflare Access konfigurieren

1. In Cloudflare Zero Trust eine selbst gehostete Access-Anwendung für `/admin/*` anlegen.
2. Eine zweite geschützte Route für `/api/admin/*` konfigurieren.
3. Nur ausdrücklich berechtigte E-Mail-Adressen oder eine passende Access-Gruppe zulassen.
4. Im Pages-Projekt folgende Variablen für Preview und Production setzen:
   - `CF_ACCESS_TEAM_DOMAIN`: zum Beispiel `mein-team.cloudflareaccess.com`
   - `CF_ACCESS_AUD`: Audience-Tag der Access-Anwendung für die Admin-API
5. Für `/api/admin/*` muss der Audience-Wert derjenigen Access-Anwendung verwendet werden, die diese API schützt.

Der Schutz im Access-Dashboard und die JWT-Prüfung in der Function sind beide erforderlich. Ohne diese Variablen antworten alle Admin-Routen kontrolliert mit HTTP `503`.

## Preview prüfen

Nach dem nächsten Cloudflare-Preview-Deployment:

1. `GET /api/events` ohne Anmeldung aufrufen und `[]` erwarten.
2. `/api/admin/health` in einem privaten Browserfenster aufrufen und die Access-Anmeldung erwarten.
3. Mit einer nicht freigegebenen Adresse prüfen, dass der Zugriff abgelehnt wird.
4. Mit einer freigegebenen Adresse anmelden und `{ ok: true, status: "ready" }` erwarten.
5. Prüfen, dass `eventkalender.html` weiterhin ausschließlich `data/events.json` lädt.

Die eigentliche Adminseite, der Online-Import und schreibende D1-Endpunkte sind ausdrücklich nicht Teil dieser Preview-Grundlage.
