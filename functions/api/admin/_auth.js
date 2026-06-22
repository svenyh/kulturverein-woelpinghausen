export function isLocalDevHost(request) {
  const hostname = new URL(request.url).hostname;
  return (
    hostname === '127.0.0.1' ||
    hostname === 'localhost' ||
    hostname === '[::1]' ||
    hostname === '::1'
  );
}

export function isAdminDevBypassActive(env, request) {
  const flag = String(env?.ADMIN_DEV_BYPASS || '')
    .trim()
    .toLowerCase();
  return flag === 'true' && isLocalDevHost(request);
}

export function applyAdminDevBypass(context) {
  if (!isAdminDevBypassActive(context.env, context.request)) {
    return false;
  }

  context.data.accessUser = { devBypass: true };
  return true;
}
