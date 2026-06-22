import { groupPublishedEventsByMonth, listPublishedEventRows } from './admin/_events-db.js';

function jsonResponse(payload, status) {
  return Response.json(payload, {
    status: status || 200,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}

export async function onRequestGet(context) {
  const { env } = context;

  if (!env.DB) {
    return jsonResponse([]);
  }

  try {
    const rows = await listPublishedEventRows(env.DB);
    if (!rows.length) {
      return jsonResponse([]);
    }

    return jsonResponse(groupPublishedEventsByMonth(rows));
  } catch {
    return jsonResponse([]);
  }
}
