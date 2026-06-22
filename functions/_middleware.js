import { isAccessConfigured } from './api/admin/_access.js';
import { applyAdminDevBypass } from './api/admin/_auth.js';
import { adminLockedResponse, isAdminPath } from './_admin-gate.js';

export async function onRequest(context) {
  const pathname = new URL(context.request.url).pathname;

  if (!isAdminPath(pathname)) {
    return context.next();
  }

  if (applyAdminDevBypass(context)) {
    return context.next();
  }

  if (!isAccessConfigured(context.env)) {
    return adminLockedResponse(503);
  }

  // Access ist am Edge aktiv: Authentifizierung dort, nicht in Functions.
  return context.next();
}
