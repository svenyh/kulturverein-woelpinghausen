import { requireAdminAccess } from '../_require-access.js';

function jsonResponse(payload, status) {
  return Response.json(payload, {
    status: status || 200,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function onRequestPost(context) {
  const denied = requireAdminAccess(context);
  if (denied) return denied;

  const contentType = context.request.headers.get('content-type') || '';

  if (!contentType.includes('multipart/form-data')) {
    return jsonResponse(
      {
        error:
          'Upload-Endpunkt ist vorbereitet. Bitte PDF lokal nach /downloads/ legen und den Dateinamen im CMS speichern.',
        uploadReady: false,
      },
      501
    );
  }

  return jsonResponse(
    {
      error:
        'Datei-Upload ist noch nicht aktiv. PDF bitte nach /downloads/ legen (Git/Cursor) und Dateinamen verknüpfen.',
      uploadReady: false,
    },
    501
  );
}

export async function onRequestGet(context) {
  const denied = requireAdminAccess(context);
  if (denied) return denied;

  return jsonResponse({
    uploadReady: false,
    downloadsPath: '/downloads/',
    hint: 'PDF-Dateien werden aktuell manuell unter /downloads/ abgelegt. Der Dateiname wird im CMS gespeichert.',
  });
}
