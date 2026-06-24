import { listMemberEventsInternal } from '../admin/_members-db.js';

function jsonResponse(payload, status) {
  return Response.json(payload, {
    status: status || 200,
    headers: { 'Cache-Control': 'public, max-age=60' },
  });
}

export async function onRequestGet(context) {
  const { env } = context;
  if (!env.DB) return jsonResponse({ events: [] });

  try {
    const events = await listMemberEventsInternal(env.DB, { visibleOnly: true });
    return jsonResponse({ events });
  } catch {
    return jsonResponse({ events: [] });
  }
}
