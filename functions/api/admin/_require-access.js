export function requireAdminAccess(context) {
  if (!context.data?.accessUser) {
    return Response.json(
      { error: 'Online-Admin ist deaktiviert.' },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }

  return null;
}
