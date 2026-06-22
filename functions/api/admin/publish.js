import { publishSelectedEvents } from './_events-db.js';
import { requireAdminAccess } from './_require-access.js';

function jsonResponse(payload, status) {
  return Response.json(payload, {
    status,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}

export async function onRequestPost(context) {
  const denied = requireAdminAccess(context);
  if (denied) return denied;

  const { env } = context;

  if (!env.DB) {
    return jsonResponse({ error: 'D1-Binding DB fehlt.' }, 503);
  }

  try {
    const publishedCount = await publishSelectedEvents(env.DB);
    return jsonResponse({
      message: `${publishedCount} freigegebene Termine wurden veröffentlicht.`,
      publishedCount,
    });
  } catch (error) {
    return jsonResponse({ error: error.message || 'Veröffentlichung fehlgeschlagen.' }, 500);
  }
}
