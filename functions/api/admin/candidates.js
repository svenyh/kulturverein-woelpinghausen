import { groupEventsByMonth, listActiveCandidateRows } from './_events-db.js';
import { requireAdminAccess } from './_require-access.js';

function jsonResponse(payload, status) {
  return Response.json(payload, {
    status,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}

export async function onRequestGet(context) {
  const denied = requireAdminAccess(context);
  if (denied) return denied;

  const { env } = context;

  if (!env.DB) {
    return jsonResponse({ error: 'D1-Binding DB fehlt.' }, 503);
  }

  try {
    const rows = await listActiveCandidateRows(env.DB);
    const groups = groupEventsByMonth(rows);

    if (!groups.length) {
      return jsonResponse({ groups: [], message: 'Noch keine Kandidaten geladen.' });
    }

    return jsonResponse({ groups });
  } catch (error) {
    return jsonResponse({ error: error.message || 'Kandidaten konnten nicht geladen werden.' }, 500);
  }
}
