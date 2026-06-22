export function onRequestGet() {
  return Response.json(
    {
      ok: true,
      status: 'ready',
      service: 'event-admin',
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}
