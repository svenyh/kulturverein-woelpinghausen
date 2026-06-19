const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { spawn } = require('node:child_process');

const HOST = '127.0.0.1';
const PORT = Number.parseInt(process.env.EVENT_ADMIN_PORT || '8787', 10);
const ROOT = path.resolve(__dirname, '..');
const CANDIDATES_PATH = path.join(ROOT, 'data', 'events-candidates.json');
const PUBLIC_EVENTS_PATH = path.join(ROOT, 'data', 'events.json');
const MAX_BODY_BYTES = 1024 * 1024;
const LOCAL_ORIGIN = `http://${HOST}:${PORT}`;

const STATIC_FILES = new Map([
  ['/', path.join(__dirname, 'admin-events.html')],
  ['/admin-events.html', path.join(__dirname, 'admin-events.html')],
  ['/tools/admin-events.js', path.join(__dirname, 'admin-events.js')],
  ['/tools/admin-events.css', path.join(__dirname, 'admin-events.css')],
  ['/css/style.css', path.join(ROOT, 'css', 'style.css')],
  ['/images/logo-kulturverein.png', path.join(ROOT, 'images', 'logo-kulturverein.png')],
  ['/eventkalender.html', path.join(ROOT, 'eventkalender.html')],
  ['/js/eventkalender.js', path.join(ROOT, 'js', 'eventkalender.js')],
  ['/js/script.js', path.join(ROOT, 'js', 'script.js')],
  ['/data/events.json', PUBLIC_EVENTS_PATH],
]);

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
};

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  response.end(`${JSON.stringify(payload)}\n`);
}

async function readJsonBody(request) {
  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      throw new Error('Die Anfrage ist zu gross.');
    }
    chunks.push(chunk);
  }

  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

async function readCandidateGroups() {
  const raw = await fs.readFile(CANDIDATES_PATH, 'utf8');
  const groups = JSON.parse(raw);
  if (!Array.isArray(groups)) {
    throw new Error('events-candidates.json hat kein gueltiges Gruppenformat.');
  }
  return groups;
}

function flattenCandidates(groups) {
  return groups.flatMap((group) => (Array.isArray(group.events) ? group.events : []));
}

function runTool(scriptName) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(__dirname, scriptName)], {
      cwd: ROOT,
      env: process.env,
      windowsHide: true,
    });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(stderr.trim() || stdout.trim() || `${scriptName} ist fehlgeschlagen.`));
        return;
      }
      resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
    });
  });
}

async function importEvents(response) {
  const result = await runTool('fetch-events-test.js');
  const groups = await readCandidateGroups();
  const candidates = flattenCandidates(groups);
  sendJson(response, 200, {
    message: `${candidates.length} Kandidaten wurden neu geladen. Alle Freigaben stehen auf Nein.`,
    candidateCount: candidates.length,
    log: result.stdout,
  });
}

async function getCandidates(response) {
  try {
    const groups = await readCandidateGroups();
    sendJson(response, 200, { groups });
  } catch (error) {
    if (error.code === 'ENOENT') {
      sendJson(response, 200, { groups: [], message: 'Noch keine Kandidaten geladen.' });
      return;
    }
    throw error;
  }
}

async function saveSelection(request, response) {
  const body = await readJsonBody(request);
  if (!Array.isArray(body.selections)) {
    sendJson(response, 400, { error: 'selections muss eine Liste sein.' });
    return;
  }

  const groups = await readCandidateGroups();
  const candidates = flattenCandidates(groups);
  const existingIds = new Set(candidates.map((event) => event.rawId));
  const selectionIds = new Set();

  for (const selection of body.selections) {
    if (
      !selection ||
      typeof selection.rawId !== 'string' ||
      typeof selection.showOnWebsite !== 'boolean' ||
      !existingIds.has(selection.rawId) ||
      selectionIds.has(selection.rawId)
    ) {
      sendJson(response, 400, { error: 'Die Auswahl enthaelt ungueltige oder doppelte Termine.' });
      return;
    }
    selectionIds.add(selection.rawId);
  }

  if (selectionIds.size !== existingIds.size || candidates.length !== existingIds.size) {
    sendJson(response, 409, {
      error: 'Die Kandidatenliste hat sich geaendert. Bitte neu laden und erneut auswaehlen.',
    });
    return;
  }

  const selectedById = new Map(
    body.selections.map((selection) => [selection.rawId, selection.showOnWebsite])
  );
  for (const candidate of candidates) {
    candidate.showOnWebsite = selectedById.get(candidate.rawId);
  }

  const temporaryPath = `${CANDIDATES_PATH}.tmp`;
  await fs.writeFile(temporaryPath, `${JSON.stringify(groups, null, 2)}\n`, 'utf8');
  await fs.rename(temporaryPath, CANDIDATES_PATH);

  const approvedCount = candidates.filter((event) => event.showOnWebsite === true).length;
  sendJson(response, 200, {
    message: 'Auswahl wurde lokal gespeichert.',
    candidateCount: candidates.length,
    approvedCount,
  });
}

async function publishEvents(response) {
  const result = await runTool('publish-events.js');
  const raw = await fs.readFile(PUBLIC_EVENTS_PATH, 'utf8');
  const groups = JSON.parse(raw);
  const publishedCount = Array.isArray(groups) ? flattenCandidates(groups).length : 0;

  sendJson(response, 200, {
    message: `${publishedCount} freigegebene Termine wurden in data/events.json veroeffentlicht.`,
    publishedCount,
    log: result.stdout,
  });
}

async function serveStatic(pathname, response) {
  const filePath = STATIC_FILES.get(pathname);
  if (!filePath) return false;

  try {
    const content = await fs.readFile(filePath);
    response.writeHead(200, {
      'Content-Type': MIME_TYPES[path.extname(filePath)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    response.end(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      sendJson(response, 404, { error: 'Datei nicht gefunden.' });
      return true;
    }
    throw error;
  }
  return true;
}

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${HOST}:${PORT}`);

    if (
      request.method === 'POST' &&
      request.headers.origin &&
      request.headers.origin !== LOCAL_ORIGIN
    ) {
      sendJson(response, 403, { error: 'Anfrage von einer fremden Website blockiert.' });
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/import') {
      await importEvents(response);
      return;
    }
    if (request.method === 'GET' && url.pathname === '/api/candidates') {
      await getCandidates(response);
      return;
    }
    if (request.method === 'POST' && url.pathname === '/api/selection') {
      await saveSelection(request, response);
      return;
    }
    if (request.method === 'POST' && url.pathname === '/api/publish') {
      await publishEvents(response);
      return;
    }
    if (request.method === 'GET' && await serveStatic(url.pathname, response)) {
      return;
    }

    sendJson(response, 404, { error: 'Nicht gefunden.' });
  } catch (error) {
    const statusCode = error instanceof SyntaxError ? 400 : 500;
    console.error(`[event-admin] ${error.stack || error.message}`);
    sendJson(response, statusCode, { error: error.message || 'Interner Fehler.' });
  }
});

if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  console.error('[event-admin] EVENT_ADMIN_PORT muss ein gueltiger Port sein.');
  process.exitCode = 1;
} else {
  server.listen(PORT, HOST, () => {
    console.log(`[event-admin] Lokaler Admin: http://${HOST}:${PORT}/admin-events.html`);
    console.log(`[event-admin] Eventkalender: http://${HOST}:${PORT}/eventkalender.html`);
    console.log('[event-admin] Der Server ist nur auf diesem Computer erreichbar.');
  });
}
