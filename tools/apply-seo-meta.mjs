#!/usr/bin/env node
/**
 * Wendet einheitliche SEO-Metadaten auf öffentliche HTML-Seiten an.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const BASE = 'https://kulturverein-woelpinghausen.de';

const PAGES = [
  {
    file: 'index.html',
    title: 'Kulturverein Wölpinghausen | Gemeinschaft & Veranstaltungen',
    description:
      'Gemeinschaft, Veranstaltungen und Dorfleben in Wölpinghausen – Ausflüge, Termine und Kultur im Kulturverein Wölpinghausen.',
    canonical: `${BASE}/`,
    ogType: 'website',
    ogImage: `${BASE}/images/hero-final.png`,
    ogImageAlt: 'Kulturverein Wölpinghausen – Gemeinschaft und Veranstaltungen',
  },
  {
    file: 'eventkalender.html',
    title: 'Veranstaltungen in Wölpinghausen | Kulturverein Wölpinghausen',
    description:
      'Termine und Veranstaltungen in Wölpinghausen – der Eventkalender des Kulturverein Wölpinghausen mit aktuellen Terminen aus dem Dorfleben.',
    canonical: `${BASE}/eventkalender`,
    ogType: 'website',
    ogImage: `${BASE}/images/logo-kulturverein.png`,
    ogImageAlt: 'Eventkalender Kulturverein Wölpinghausen',
  },
  {
    file: 'ausfluege.html',
    title: 'Ausflüge & Rückblicke | Kulturverein Wölpinghausen',
    description:
      'Ausflüge und Rückblicke aus Wölpinghausen – Reiseberichte, Fotos und Videos zu Leipzig, Düsseldorf, Köln und weiteren Touren.',
    canonical: `${BASE}/ausfluege`,
    ogType: 'website',
    ogImage: `${BASE}/images/reisen/duesseldorf-2025/10-gruppenfoto-am-rhein.webp`,
    ogImageAlt: 'Gruppenfoto am Rhein – Ausflüge Kulturverein Wölpinghausen',
  },
  {
    file: 'reisen/koeln-2024.html',
    title: 'Herrentour Köln 2024 | Kulturverein Wölpinghausen',
    description:
      'Rückblick auf die Herrentour nach Köln 2024 – Domstadt, Brauhaus und gemeinsame Momente des Kulturverein Wölpinghausen.',
    canonical: `${BASE}/reisen/koeln-2024`,
    ogType: 'article',
    ogImage: `${BASE}/images/reisen/koeln-2024/dom-koeln.webp`,
    ogImageAlt: 'Kölner Dom – Herrentour Köln 2024',
  },
  {
    file: 'reisen/duesseldorf-2025.html',
    title: 'Herrentour Düsseldorf 2025 | Kulturverein Wölpinghausen',
    description:
      'Rückblick auf die Herrentour nach Düsseldorf 2025 – Altstadt, Altbier und Rheinpromenade mit dem Kulturverein Wölpinghausen.',
    canonical: `${BASE}/reisen/duesseldorf-2025`,
    ogType: 'article',
    ogImage: `${BASE}/images/reisen/duesseldorf-2025/10-gruppenfoto-am-rhein.webp`,
    ogImageAlt: 'Gruppenfoto am Rhein – Herrentour Düsseldorf 2025',
  },
  {
    file: 'reisen/leipzig-2026.html',
    title: 'Leipzig 2026 | Kulturverein Wölpinghausen',
    description:
      'Rückblick auf die Leipzig-Tour 2026 – Innenstadt, Goethe-Denkmal, Nikolaikirche und Passagen mit dem Kulturverein Wölpinghausen.',
    canonical: `${BASE}/reisen/leipzig-2026`,
    ogType: 'article',
    ogImage: `${BASE}/images/reisen/leipzig-2026/06-gruppenfoto-am-goethe-denkmal.webp`,
    ogImageAlt: 'Gruppenfoto am Goethe-Denkmal – Leipzig 2026',
  },
  {
    file: 'partnervereine.html',
    title: 'Partnervereine in Wölpinghausen | Kulturverein Wölpinghausen',
    description:
      'Partnervereine und Vereinsleben in Wölpinghausen – Verbindungen im Dorf mit dem Kulturverein Wölpinghausen.',
    canonical: `${BASE}/partnervereine`,
    ogType: 'website',
    ogImage: `${BASE}/images/hero-final.png`,
    ogImageAlt: 'Partnervereine Kulturverein Wölpinghausen',
  },
  {
    file: 'kontakt.html',
    title: 'Kontakt | Kulturverein Wölpinghausen',
    description:
      'Kontakt zum Kulturverein Wölpinghausen – Fragen zu Terminen, Mitgliedschaft und Kooperationen in Wölpinghausen.',
    canonical: `${BASE}/kontakt`,
    ogType: 'website',
    ogImage: `${BASE}/images/hero-final.png`,
    ogImageAlt: 'Kontakt Kulturverein Wölpinghausen',
  },
  {
    file: 'impressum.html',
    title: 'Impressum | Kulturverein Wölpinghausen',
    description: 'Impressum des Kulturverein Wölpinghausen.',
    canonical: `${BASE}/impressum`,
    ogType: 'website',
    ogImage: `${BASE}/images/hero-final.png`,
    ogImageAlt: 'Impressum Kulturverein Wölpinghausen',
  },
  {
    file: 'datenschutz.html',
    title: 'Datenschutz | Kulturverein Wölpinghausen',
    description: 'Datenschutzerklärung des Kulturverein Wölpinghausen.',
    canonical: `${BASE}/datenschutz`,
    ogType: 'website',
    ogImage: `${BASE}/images/hero-final.png`,
    ogImageAlt: 'Datenschutz Kulturverein Wölpinghausen',
  },
];

function buildHeadBlock(page) {
  return `<meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${page.description}">
  <title>${page.title}</title>
  <link rel="canonical" href="${page.canonical}">
  <meta property="og:title" content="${page.title}">
  <meta property="og:description" content="${page.description}">
  <meta property="og:type" content="${page.ogType}">
  <meta property="og:url" content="${page.canonical}">
  <meta property="og:image" content="${page.ogImage}">
  <meta property="og:image:alt" content="${page.ogImageAlt}">
  <meta property="og:locale" content="de_DE">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${page.title}">
  <meta name="twitter:description" content="${page.description}">
  <meta name="twitter:image" content="${page.ogImage}">`;
}

for (const page of PAGES) {
  const filePath = path.join(root, page.file);
  let html = fs.readFileSync(filePath, 'utf8');
  let headBlock = buildHeadBlock(page);
  if (page.file === 'index.html') {
    headBlock += `
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Kulturverein Wölpinghausen",
    "alternateName": "Kulturverein Wölpinghausen – Interessengemeinschaft",
    "description": "Interessengemeinschaft für Gemeinschaft, Veranstaltungen und Dorfleben in Wölpinghausen.",
    "url": "${BASE}/",
    "logo": "${BASE}/images/logo-kulturverein.png",
    "sameAs": [
      "https://www.instagram.com/kulturverein_woelpinghausen"
    ],
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Wölpinghausen",
      "addressCountry": "DE"
    }
  }
  </script>`;
  }
  html = html.replace(/<head>\s*[\s\S]*?(?=<link rel="stylesheet")/, `<head>\n  ${headBlock}\n  `);
  html = html.replace(/<main(?![^>]*id="main-content")/, '<main id="main-content"');
  const scriptPrefix = page.file.includes('/') ? '../' : '';
  if (
    !html.includes(`${scriptPrefix}js/site-config.js`) &&
    html.includes(`${scriptPrefix}js/script.js`)
  ) {
    html = html.replace(
      new RegExp(`<script src="${scriptPrefix.replace('/', '\\/')}js/script\\.js"><\\/script>`),
      `<script src="${scriptPrefix}js/site-config.js"></script>\n  <script src="${scriptPrefix}js/script.js"></script>`
    );
  }
  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`Updated ${page.file}`);
}

console.log('SEO meta applied to public pages.');
