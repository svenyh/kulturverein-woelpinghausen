import { isAccessConfigured } from './_access.js';

export function requireAdminAccess(context) {
  if (context.data?.accessUser) {
    return null;
  }

  const configured = isAccessConfigured(context.env);
  return Response.json(
    {
      error: configured
        ? 'Für diese Aktion ist eine Anmeldung über Cloudflare Access erforderlich.'
        : 'Online-Admin ist deaktiviert.',
    },
    {
      status: configured ? 401 : 503,
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}
