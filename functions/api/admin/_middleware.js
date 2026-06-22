import { applyAdminDevBypass } from './_auth.js';
import { getAccessToken, isAccessConfigured, verifyAccessToken } from './_access.js';

function jsonResponse(payload, status) {
  return Response.json(payload, {
    status,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}

function isHealthRequest(pathname) {
  return pathname === '/api/admin/health' || pathname.endsWith('/health');
}

export async function onRequest(context) {
  const { request, env, data, next } = context;
  const pathname = new URL(request.url).pathname;
  const healthRequest = isHealthRequest(pathname);

  if (applyAdminDevBypass(context)) {
    return next();
  }

  if (!isAccessConfigured(env)) {
    if (healthRequest) {
      return jsonResponse(
        {
          ok: false,
          status: 'disabled',
          reason: 'Online-Admin ist deaktiviert: Access-Konfiguration fehlt.',
        },
        503
      );
    }

    return jsonResponse({ error: 'Online-Admin ist deaktiviert.' }, 503);
  }

  if (!getAccessToken(request)) {
    if (healthRequest) {
      return jsonResponse(
        {
          ok: false,
          status: 'unauthenticated',
          reason: 'Cloudflare-Access-Token fehlt.',
        },
        401
      );
    }

    return jsonResponse({ error: 'Nicht authentifiziert.' }, 401);
  }

  const accessPayload = await verifyAccessToken(request, env);
  if (!accessPayload) {
    if (healthRequest) {
      return jsonResponse(
        {
          ok: false,
          status: 'forbidden',
          reason: 'Cloudflare-Access-Token ist ungueltig.',
        },
        403
      );
    }

    return jsonResponse({ error: 'Zugriff verweigert.' }, 403);
  }

  data.accessUser = { authenticated: true };
  return next();
}
