export function isAdminPath(pathname) {
  return (
    pathname === '/admin.html' ||
    pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    pathname === '/tools/admin-events.html' ||
    pathname === '/tools/admin-events.js' ||
    pathname === '/tools/admin-events.css'
  );
}

export function adminLockedResponse(status) {
  const html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin nicht freigeschaltet</title>
  <link rel="stylesheet" href="/css/style.css">
  <link rel="icon" href="/images/logo-kulturverein.png" type="image/png">
</head>
<body class="app-page">
  <div class="app-banner"><strong>Admin</strong> – noch nicht freigeschaltet</div>
  <main class="app-content" style="max-width: 720px; margin-inline: auto;">
    <h1 class="app-content__title">Admin noch nicht freigeschaltet</h1>
    <p class="app-content__lead">Der Verwaltungsbereich ist vorbereitet, aber ohne Cloudflare Access noch nicht öffentlich erreichbar.</p>
    <p><a href="/">Zur Startseite</a></p>
  </main>
</body>
</html>`;

  return new Response(html, {
    status: status || 503,
    headers: {
      'Content-Type': 'text/html; charset=UTF-8',
      'Cache-Control': 'no-store',
    },
  });
}

