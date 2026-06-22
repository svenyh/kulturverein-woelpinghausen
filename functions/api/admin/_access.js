const CERTS_CACHE = new Map();

function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  const binary = atob(normalized + padding);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function parseJsonSegment(segment) {
  return JSON.parse(new TextDecoder().decode(decodeBase64Url(segment)));
}

export function isAccessConfigured(env) {
  return Boolean(env?.CF_ACCESS_TEAM_DOMAIN && env?.CF_ACCESS_AUD);
}

export function getAccessToken(request) {
  const headerToken = request.headers.get('Cf-Access-Jwt-Assertion');
  if (headerToken) {
    return headerToken;
  }

  const cookieHeader = request.headers.get('Cookie') || '';
  const match = cookieHeader.match(/(?:^|;\s*)CF_Authorization=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function getAccessPublicKeys(teamDomain) {
  const cached = CERTS_CACHE.get(teamDomain);
  if (cached) {
    return cached;
  }

  const response = await fetch(`https://${teamDomain}/cdn-cgi/access/certs`);
  if (!response.ok) {
    throw new Error('Access-Zertifikate konnten nicht geladen werden.');
  }

  const payload = await response.json();
  const keys = payload.keys || [];
  CERTS_CACHE.set(teamDomain, keys);
  return keys;
}

async function importPublicKey(jwk) {
  return crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  );
}

function audienceMatches(payload, expectedAudience) {
  const audience = payload.aud;
  if (Array.isArray(audience)) {
    return audience.includes(expectedAudience);
  }
  return audience === expectedAudience;
}

function claimsAreValid(payload, teamDomain, expectedAudience) {
  const issuer = `https://${teamDomain}`;
  if (payload.iss !== issuer) {
    return false;
  }
  if (!audienceMatches(payload, expectedAudience)) {
    return false;
  }

  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp === 'number' && payload.exp < now) {
    return false;
  }
  if (typeof payload.nbf === 'number' && payload.nbf > now) {
    return false;
  }

  return true;
}

async function verifySignature(token, publicKey) {
  const [encodedHeader, encodedPayload, encodedSignature] = token.split('.');
  if (!encodedHeader || !encodedPayload || !encodedSignature) {
    return false;
  }

  const data = new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`);
  const signature = decodeBase64Url(encodedSignature);

  return crypto.subtle.verify(
    { name: 'RSASSA-PKCS1-v1_5' },
    publicKey,
    signature,
    data
  );
}

export async function verifyAccessToken(request, env) {
  if (!isAccessConfigured(env)) {
    return null;
  }

  const token = getAccessToken(request);
  if (!token) {
    return null;
  }

  let header;
  let payload;
  try {
    const [encodedHeader, encodedPayload] = token.split('.');
    header = parseJsonSegment(encodedHeader);
    payload = parseJsonSegment(encodedPayload);
  } catch {
    return null;
  }

  if (!claimsAreValid(payload, env.CF_ACCESS_TEAM_DOMAIN, env.CF_ACCESS_AUD)) {
    return null;
  }

  let keys;
  try {
    keys = await getAccessPublicKeys(env.CF_ACCESS_TEAM_DOMAIN);
  } catch {
    return null;
  }

  const matchingKey = keys.find((key) => key.kid === header.kid);
  if (!matchingKey) {
    return null;
  }

  try {
    const publicKey = await importPublicKey(matchingKey);
    const valid = await verifySignature(token, publicKey);
    return valid ? payload : null;
  } catch {
    return null;
  }
}
