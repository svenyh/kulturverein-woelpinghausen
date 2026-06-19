export function onRequestGet(context) {
  return Response.json(
    {
      ok: true,
      service: 'event-admin-preview',
      authenticated: Boolean(context.data.accessUser),
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}
