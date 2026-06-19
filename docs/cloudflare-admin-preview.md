# Cloudflare-Preview für den Event-Admin

Diese Grundlage ergänzt Pages Functions, eine D1-Migration und einen durch Cloudflare Access prüfbaren Health-Endpunkt. Der öffentliche Eventkalender liest weiterhin `data/events.json`. Import, Kandidatenverwaltung und Veröffentlichung bleiben in diesem Schritt lokal.

## Enthaltene Endpunkte

- `GET /api/events` liefert vorerst immer `[]`.
- `GET /api/admin/health` ist für den Test des Access-Schutzes vorgesehen.

Die Middleware unter `functions/api/admin/_middleware.js` validiert das von Cloudflare Access gesetzte JWT. Es gibt keinen lokalen Testnutzer und keinen Auth-Bypass. Ohne Access-Konfiguration antwortet die Route mit HTTP `503`, ohne Token mit `401` und bei ungültigem Token mit `403`.

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

Die erste Anfrage muss eine leere JSON-Liste liefern. Die Admin-Anfrage muss lokal mit `503` abgelehnt werden, solange keine echte Access-Konfiguration vorhanden ist. Cloudflare Access wird bewusst nicht lokal simuliert.

## D1-Datenbank anlegen

1. Bei Cloudflare anmelden:

   ```powershell
   npx.cmd wrangler login
   ```

2. Datenbank erstellen:

   ```powershell
   npx.cmd wrangler d1 create kulturverein-events
   ```

3. Den von Wrangler ausgegebenen Block `d1_databases` in `wrangler.jsonc` ergänzen. Der Binding-Name muss `DB` lauten.
4. Im Cloudflare-Dashboard beim Pages-Projekt unter **Settings > Bindings** dieselbe D1-Datenbank für Preview und Production als `DB` binden.

## Migration ausführen

Nach Ergänzung des D1-Bindings:

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

Der Schutz im Access-Dashboard und die JWT-Prüfung in der Function sind beide erforderlich.

## Preview prüfen

Nach dem nächsten Cloudflare-Preview-Deployment:

1. `GET /api/events` ohne Anmeldung aufrufen und `[]` erwarten.
2. `/api/admin/health` in einem privaten Browserfenster aufrufen und die Access-Anmeldung erwarten.
3. Mit einer nicht freigegebenen Adresse prüfen, dass der Zugriff abgelehnt wird.
4. Mit einer freigegebenen Adresse anmelden und eine Antwort mit `ok: true` erwarten.
5. Prüfen, dass `eventkalender.html` weiterhin ausschließlich `data/events.json` lädt.

Die eigentliche Adminseite, der Online-Import und schreibende D1-Endpunkte sind ausdrücklich nicht Teil dieser Preview-Grundlage.
