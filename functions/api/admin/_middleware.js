function jsonResponse(payload, status) {
  return Response.json(payload, {
    status,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}

export function onRequest() {
  return jsonResponse({ error: 'Online-Admin ist derzeit deaktiviert.' }, 503);
}
