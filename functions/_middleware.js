import {
  getAccessToken,
  isAccessConfigured,
  verifyAccessToken,
} from './api/admin/_access.js';
import { applyAdminDevBypass } from './api/admin/_auth.js';
import {
  adminAuthRequiredResponse,
  adminLockedResponse,
  isAdminPath,
} from './_admin-gate.js';

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

  if (!getAccessToken(context.request)) {
    return adminAuthRequiredResponse(401);
  }

  const accessPayload = await verifyAccessToken(context.request, context.env);
  if (!accessPayload) {
    return adminAuthRequiredResponse(403);
  }

  return context.next();
}
