# Deployment – Kulturverein Wölpinghausen

Diese Webseite ist eine **statische HTML/CSS/JS-Seite** ohne Build-Schritt. Alle Dateien liegen im Repository-Root.

---

## GitHub Pages (aktiv)

| Einstellung | Wert |
|-------------|------|
| Repository | https://github.com/svenyh/kulturverein-woelpinghausen |
| Branch | `main` |
| Deployment | GitHub Actions (`.github/workflows/pages.yml`) |
| URL | https://svenyh.github.io/kulturverein-woelpinghausen/ |

GitHub Pages wird automatisch nach jedem Push auf `main` neu deployed.

---

## Cloudflare Pages (Einrichtung)

### Voraussetzungen

- Cloudflare-Account (kostenlos): https://dash.cloudflare.com/sign-up
- GitHub-Repository ist öffentlich und auf dem neuesten Stand

### Schritt 1: Projekt anlegen

1. Cloudflare Dashboard öffnen: https://dash.cloudflare.com/
2. **Workers & Pages** → **Create**
3. Tab **Pages** → **Connect to Git**
4. **GitHub** autorisieren und Repository **`svenyh/kulturverein-woelpinghausen`** auswählen
5. **Begin setup**

### Schritt 2: Build-Einstellungen (statische Seite)

| Feld | Wert |
|------|------|
| Project name | `kulturverein-woelpinghausen` |
| Production branch | `main` |
| Framework preset | **None** |
| Build command | *(leer lassen)* |
| Build output directory | `.` |
| Deploy command | *(leer lassen)* |

> Bei reinem HTML/CSS/JS im Root-Verzeichnis ist kein Build nötig. Cloudflare Pages veröffentlicht den Repository-Root nach dem Git-Build automatisch.

### Pages statt Workers Builds

Für dieses Repository darf kein Workers-Deploy-Command konfiguriert sein. Insbesondere `wrangler deploy` erwartet einen Worker-Einstiegspunkt und passt nicht zur vorhandenen Pages-Functions-Struktur.

Falls im Cloudflare-Dashboard ein Pflichtfeld **Deploy command** mit einem Workers-Befehl erscheint, ist das Projekt als Workers-Build angelegt. In diesem Fall ein neues Projekt über **Workers & Pages → Create → Pages → Connect to Git** erstellen. Bei einem Git-integrierten Pages-Projekt bleiben sowohl **Build command** als auch **Deploy command** leer; der Ausgabeordner ist `.`.

### Schritt 3: Deploy starten

1. **Save and Deploy** klicken
2. Erster Build dauert ca. 1–2 Minuten
3. Production-URL erscheint unter **View details**, z. B.:  
   **https://kulturverein-woelpinghausen.pages.dev**

### Schritt 4: Automatische Deployments

Jeder Push auf `main` startet automatisch ein neues Cloudflare-Pages-Deployment.

```bash
git add .
git commit -m "Update website"
git push origin main
```

---

## Alternative: Deploy per Wrangler CLI (ohne Git-Verbindung)

Falls du lokal deployen willst, ohne GitHub in Cloudflare zu verbinden:

```bash
npx wrangler login
npx wrangler pages project create kulturverein-woelpinghausen --production-branch main
npx wrangler pages deploy . --project-name=kulturverein-woelpinghausen --branch=main
```

Dieser manuelle Pages-Upload ist nur eine Alternative zur Git-Integration. Nicht beide Deployment-Wege gleichzeitig konfigurieren.

---

## Eigene Domain verbinden (später)

Empfohlen über **Cloudflare Pages** (nicht GitHub Pages), weil DNS und SSL zentral verwaltet werden.

### 1. Domain zu Cloudflare hinzufügen

1. Cloudflare Dashboard → **Add a site**
2. Domain eingeben (z. B. `kulturverein-woelpinghausen.de`)
3. Tarif **Free** wählen
4. Nameserver beim Domain-Registrar auf die Cloudflare-Nameserver umstellen (Anweisungen im Dashboard)

### 2. DNS prüfen

Unter **DNS → Records** sicherstellen:

- Keine widersprüchlichen A/CNAME-Einträge für `@` oder `www`
- Nach Domain-Umzug: DNS-Propagierung kann bis zu 48 Stunden dauern (meist schneller)

### 3. Custom Domain in Pages verbinden

1. **Workers & Pages** → Projekt **`kulturverein-woelpinghausen`**
2. Tab **Custom domains** → **Set up a custom domain**
3. Domain eingeben, z. B.:
   - `kulturverein-woelpinghausen.de` (Root)
   - optional `www.kulturverein-woelpinghausen.de`
4. Cloudflare legt die nötigen DNS-Einträge automatisch an (CNAME zu Pages)

### 4. SSL

- Cloudflare stellt **automatisch** ein TLS-Zertifikat aus (Universal SSL)
- Unter **SSL/TLS → Overview**: Modus **Full** oder **Full (strict)** empfohlen
- Zertifikat ist in der Regel nach wenigen Minuten aktiv

### 5. GitHub Pages bei eigener Domain

Wenn die Produktions-Domain über Cloudflare läuft, kann GitHub Pages als Backup/Preview bleiben oder deaktiviert werden (Repository → Settings → Pages).

---

## Build-Einstellungen für spätere Frameworks

Falls später z. B. Vite, Astro oder Eleventy genutzt wird:

| Framework | Build command | Output directory |
|-----------|---------------|------------------|
| Vite | `npm run build` | `dist` |
| Astro | `npm run build` | `dist` |
| Eleventy | `npx @11ty/eleventy` | `_site` |
| Next.js (Static Export) | `npm run build` | `out` |

Dann in Cloudflare Pages die Werte entsprechend anpassen.
