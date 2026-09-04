#!/usr/bin/env node
/**
 * Erzeugt sitemap.xml für die produktive Domain aus öffentlichen Seiten.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const BASE = 'https://kulturverein-woelpinghausen.de';

const ENTRIES = [
  { file: 'index.html', loc: `${BASE}/` },
  { file: 'eventkalender.html', loc: `${BASE}/eventkalender` },
  { file: 'ausfluege.html', loc: `${BASE}/ausfluege` },
  { file: 'reisen/koeln-2024.html', loc: `${BASE}/reisen/koeln-2024` },
  { file: 'reisen/duesseldorf-2025.html', loc: `${BASE}/reisen/duesseldorf-2025` },
  { file: 'reisen/leipzig-2026.html', loc: `${BASE}/reisen/leipzig-2026` },
  { file: 'partnervereine.html', loc: `${BASE}/partnervereine` },
  { file: 'mitglied-werden.html', loc: `${BASE}/mitglied-werden` },
  { file: 'kontakt.html', loc: `${BASE}/kontakt` },
  { file: 'impressum.html', loc: `${BASE}/impressum` },
  { file: 'datenschutz.html', loc: `${BASE}/datenschutz` },
];

function lastmodFor(file) {
  try {
    const iso = execFileSync('git', ['log', '-1', '--format=%cI', '--', file], {
      cwd: root,
      encoding: 'utf8',
    }).trim();
    if (!iso) return null;
    return iso.slice(0, 10);
  } catch {
    return null;
  }
}

const urls = ENTRIES.map(({ file, loc }) => {
  const lastmod = lastmodFor(file);
  return lastmod
    ? `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`
    : `  <url>\n    <loc>${loc}</loc>\n  </url>`;
}).join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

fs.writeFileSync(path.join(root, 'sitemap.xml'), xml, 'utf8');
console.log('Wrote sitemap.xml');
