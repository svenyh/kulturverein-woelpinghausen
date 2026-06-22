import { isAccessConfigured } from './_access.js';

export function requireAdminAccess(context) {
  if (isAccessConfigured(context.env)) {
    return null;
  }

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
