import { isAccessConfigured } from './api/admin/_access.js';
import { applyAdminDevBypass } from './api/admin/_auth.js';
import { adminLockedResponse, isAdminPath } from './_admin-gate.js';

const CANONICAL_HOST = 'kulturverein-woelpinghausen.de';

/** Nur Produktions-Hosts – Preview-Deployments (*.pages.dev) bleiben erreichbar. */
const HOSTS_TO_CANONICALIZE = new Set([
  'www.kulturverein-woelpinghausen.de',
  'kulturverein-woelpinghausen.pages.dev',
]);

const PATH_REDIRECTS = [
  [/^\/galerie\/?$/, '/ausfluege'],
  [/^\/galerie\.html$/, '/ausfluege'],
  [/^\/reisen\/?$/, '/ausfluege'],
  [/^\/reisen\/index\.html$/, '/ausfluege'],
  [/^\/fotos-videos\/?$/, '/ausfluege'],
  [/^\/fotos-videos\.html$/, '/ausfluege'],
  [/^\/mitgliederbereich\.html$/, '/mitgliederbereich/'],
  [/^\/termine\/?$/, '/eventkalender'],
  [/^\/termine\.html$/, '/eventkalender'],
  [/^\/registrierung\/?$/, '/mitglied-werden'],
  [/^\/registrierung\.html$/, '/mitglied-werden'],
  [/^\/veranstaltungen\/?$/, '/ausfluege'],
  [/^\/veranstaltungen\/index\.html$/, '/ausfluege'],
  [/^\/veranstaltungen\/koeln-2024\/?$/, '/reisen/koeln-2024'],
  [/^\/veranstaltungen\/duesseldorf-2025\/?$/, '/reisen/duesseldorf-2025'],
  [/^\/veranstaltungen\/leipzig-2026\/?$/, '/reisen/leipzig-2026'],
];

function redirectResponse(location) {
  return new Response(null, {
    status: 301,
    headers: {
      Location: location,
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

function canonicalizeHost(request) {
  const url = new URL(request.url);
  if (!HOSTS_TO_CANONICALIZE.has(url.hostname)) {
    return null;
  }

  url.protocol = 'https:';
  url.hostname = CANONICAL_HOST;
  url.port = '';
  return redirectResponse(url.toString());
}

function redirectLegacyPath(request) {
  const url = new URL(request.url);
  for (const [pattern, targetPath] of PATH_REDIRECTS) {
    if (!pattern.test(url.pathname)) continue;
    url.protocol = 'https:';
    url.hostname = CANONICAL_HOST;
    url.port = '';
    url.pathname = targetPath;
    return redirectResponse(url.toString());
  }
  return null;
}

export async function onRequest(context) {
  const hostRedirect = canonicalizeHost(context.request);
  if (hostRedirect) return hostRedirect;

  const pathRedirect = redirectLegacyPath(context.request);
  if (pathRedirect) return pathRedirect;

  const pathname = new URL(context.request.url).pathname;

  if (!isAdminPath(pathname)) {
    return context.next();
  }

  if (applyAdminDevBypass(context)) {
    return context.next();
  }

  if (!isAccessConfigured(context.env)) {
    return adminLockedResponse(503);
  }

  // Access ist am Edge aktiv: Authentifizierung dort, nicht in Functions.
  return context.next();
}
