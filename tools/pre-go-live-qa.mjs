#!/usr/bin/env node
/**
 * Pre-Go-Live QA: Link-Check, Lighthouse (optional), Playwright-Smoke.
 * Usage:
 *   node tools/pre-go-live-qa.mjs --base http://127.0.0.1:8788
 *   node tools/pre-go-live-qa.mjs --base https://kulturverein-woelpinghausen.de --lighthouse
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const PUBLIC_PAGES = [
  '/',
  '/eventkalender',
  '/ausfluege',
  '/reisen/koeln-2024',
  '/reisen/duesseldorf-2025',
  '/reisen/leipzig-2026',
  '/partnervereine',
  '/kontakt',
  '/impressum',
  '/datenschutz',
];

const VIEWPORTS = [320, 375, 390, 430, 768, 1024, 1280, 1440, 1920];

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { base: 'http://127.0.0.1:8788', lighthouse: false, out: 'reports/pre-go-live' };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--base') opts.base = args[++i];
    else if (args[i] === '--lighthouse') opts.lighthouse = true;
    else if (args[i] === '--out') opts.out = args[++i];
  }
  return opts;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

async function fetchText(url, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { redirect: 'follow', signal: controller.signal });
    return { url: res.url, status: res.status, text: res.ok ? await res.text() : '' };
  } finally {
    clearTimeout(timer);
  }
}

function extractLinks(html, pageUrl) {
  const links = new Set();
  const re = /(?:href|src)=["']([^"']+)["']/gi;
  let match;
  while ((match = re.exec(html))) {
    const raw = match[1].trim();
    if (!raw || raw.startsWith('#') || raw.startsWith('mailto:') || raw.startsWith('tel:') || raw.startsWith('javascript:')) continue;
    try {
      links.add(new URL(raw, pageUrl).href);
    } catch {
      /* ignore invalid */
    }
  }
  return [...links];
}

async function checkLinks(base) {
  const broken = [];
  const checked = new Set();
  const queue = PUBLIC_PAGES.map((p) => new URL(p, base).href);

  while (queue.length) {
    const url = queue.shift();
    if (checked.has(url)) continue;
    checked.add(url);

    let result;
    try {
      result = await fetchText(url);
    } catch (error) {
      broken.push({ url, status: 0, reason: String(error) });
      continue;
    }

    if (result.status >= 400) {
      broken.push({ url, status: result.status, reason: 'HTTP error' });
      continue;
    }

    if (!result.text) continue;
    for (const link of extractLinks(result.text, result.url)) {
      if (!link.startsWith(base)) continue;
      if (!/\.html(?:$|[?#])|\/$/.test(link) && !link.endsWith(base) && link !== `${base}/`) continue;
      if (link.includes('/admin/') || link.includes('/api/')) continue;
      if (checked.has(link) || queue.includes(link)) continue;
      queue.push(link);
    }
  }

  return { checked: [...checked], broken };
}

function runLighthouse(base, outDir) {
  const lighthousePages = [
    '/',
    '/eventkalender.html',
    '/ausfluege.html',
    '/reisen/koeln-2024.html',
    '/reisen/duesseldorf-2025.html',
    '/reisen/leipzig-2026.html',
    '/kontakt.html',
  ];
  const scores = [];

  for (const page of lighthousePages) {
    const url = new URL(page, base).href;
    const slug = page.replace(/\//g, '_').replace(/^_/, '') || 'home';
    const reportPath = path.join(outDir, `lighthouse-${slug}.json`);
    const args = [
      url,
      '--quiet',
      '--chrome-flags=--headless --no-sandbox',
      '--only-categories=performance,accessibility,best-practices,seo',
      '--output=json',
      `--output-path=${reportPath}`,
    ];
    const proc = spawnSync('npx', ['lighthouse', ...args], { stdio: 'inherit', shell: true });
    if (proc.status !== 0) {
      scores.push({ page, error: 'lighthouse failed' });
      continue;
    }
    try {
      const json = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
      scores.push({
        page,
        performance: Math.round((json.categories.performance?.score || 0) * 100),
        accessibility: Math.round((json.categories.accessibility?.score || 0) * 100),
        bestPractices: Math.round((json.categories['best-practices']?.score || 0) * 100),
        seo: Math.round((json.categories.seo?.score || 0) * 100),
      });
    } catch (error) {
      scores.push({ page, error: String(error) });
    }
  }

  return scores;
}

async function runPlaywrightSmoke(base, outDir) {
  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    return { skipped: true, reason: 'playwright not installed' };
  }

  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const pagePath of PUBLIC_PAGES) {
    const page = await browser.newPage();
    const url = new URL(pagePath, base).href;
    const entry = { page: pagePath, viewports: [] };

    try {
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      entry.status = response?.status() || 0;
      entry.title = await page.title();

      for (const width of VIEWPORTS) {
        await page.setViewportSize({ width, height: 900 });
        const overflow = await page.evaluate(() => {
          const doc = document.documentElement;
          return doc.scrollWidth > doc.clientWidth + 1;
        });
        entry.viewports.push({ width, horizontalScroll: overflow });
      }

      const consoleErrors = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });
      entry.consoleErrors = consoleErrors.slice(0, 5);
    } catch (error) {
      entry.error = String(error);
    }

    results.push(entry);
    await page.close();
  }

  await browser.close();
  fs.writeFileSync(path.join(outDir, 'playwright-smoke.json'), JSON.stringify(results, null, 2));
  return { skipped: false, results };
}

async function main() {
  const opts = parseArgs();
  const outDir = path.resolve(root, opts.out);
  ensureDir(outDir);

  console.log(`QA base: ${opts.base}`);
  const linkReport = await checkLinks(opts.base);
  fs.writeFileSync(path.join(outDir, 'link-check.json'), JSON.stringify(linkReport, null, 2));
  console.log(`Links checked: ${linkReport.checked.length}, broken: ${linkReport.broken.length}`);

  const playwrightReport = await runPlaywrightSmoke(opts.base, outDir);
  if (playwrightReport.skipped) {
    console.log(`Playwright skipped: ${playwrightReport.reason}`);
  } else {
    console.log(`Playwright smoke: ${playwrightReport.results.length} pages`);
  }

  let lighthouseReport = null;
  if (opts.lighthouse) {
    lighthouseReport = runLighthouse(opts.base, outDir);
    fs.writeFileSync(path.join(outDir, 'lighthouse-scores.json'), JSON.stringify(lighthouseReport, null, 2));
    console.log('Lighthouse complete');
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    base: opts.base,
    links: { checked: linkReport.checked.length, broken: linkReport.broken.length },
    brokenLinks: linkReport.broken,
    playwright: playwrightReport.skipped ? playwrightReport : { pages: playwrightReport.results.length },
    lighthouse: lighthouseReport,
  };
  fs.writeFileSync(path.join(outDir, 'summary.json'), JSON.stringify(summary, null, 2));
  console.log(`Report written to ${outDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
