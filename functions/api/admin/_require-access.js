import { isAccessConfigured } from './_access.js';

export function requireAdminAccess(context) {
  if (context.data?.accessUser || isAccessConfigured(context.env)) {
    return null;
  }

  return Response.json(
    {
      error: 'Online-Admin ist deaktiviert.',
    },
    {
      status: 503,
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}
