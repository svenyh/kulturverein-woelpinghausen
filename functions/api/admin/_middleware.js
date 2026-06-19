import { createRemoteJWKSet, jwtVerify } from 'jose';

const jwksByTeamDomain = new Map();

function jsonResponse(payload, status) {
  return Response.json(payload, {
    status,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}

function normalizeTeamDomain(value) {
  return String(value || '')
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/, '');
}

function remoteJwks(teamDomain) {
  if (!jwksByTeamDomain.has(teamDomain)) {
    const certsUrl = new URL(`https://${teamDomain}/cdn-cgi/access/certs`);
    jwksByTeamDomain.set(teamDomain, createRemoteJWKSet(certsUrl));
  }
  return jwksByTeamDomain.get(teamDomain);
}

export async function onRequest(context) {
  const teamDomain = normalizeTeamDomain(context.env.CF_ACCESS_TEAM_DOMAIN);
  const audience = String(context.env.CF_ACCESS_AUD || '').trim();

  if (!teamDomain || !audience) {
    return jsonResponse({ error: 'Cloudflare Access ist noch nicht konfiguriert.' }, 503);
  }

  const token = context.request.headers.get('Cf-Access-Jwt-Assertion');
  if (!token) {
    return jsonResponse({ error: 'Anmeldung erforderlich.' }, 401);
  }

  try {
    const { payload } = await jwtVerify(token, remoteJwks(teamDomain), {
      issuer: `https://${teamDomain}`,
      audience,
    });

    context.data.accessUser = Object.freeze({
      subject: payload.sub || null,
      email: payload.email || null,
    });
    return context.next();
  } catch {
    return jsonResponse({ error: 'Access-Token ist ungültig oder abgelaufen.' }, 403);
  }
}
