import { getPublicMediaEventBySlug, listPublicMediaEvents } from './admin/_media-db.js';

function jsonResponse(payload, status) {
  return Response.json(payload, {
    status: status || 200,
    headers: {
      'Cache-Control': 'public, max-age=60',
    },
  });
}

export async function onRequestGet(context) {
  const { env, request } = context;

  if (!env.DB) {
    return jsonResponse({ events: [] });
  }

  const slug = new URL(request.url).searchParams.get('slug');

  try {
    if (slug) {
      const event = await getPublicMediaEventBySlug(env.DB, slug);
      if (!event) {
        return jsonResponse({ error: 'Veranstaltung nicht gefunden.' }, 404);
      }
      return jsonResponse({ event });
    }

    const events = await listPublicMediaEvents(env.DB);
    return jsonResponse({ events });
  } catch {
    return jsonResponse({ events: [] });
  }
}
