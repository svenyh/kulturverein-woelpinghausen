import { upsertImportedEvents } from './_events-db.js';
import { loadImportCandidates } from './_ical-import.js';
import { requireAdminAccess } from './_require-access.js';

function jsonResponse(payload, status) {
  return Response.json(payload, {
    status,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}

export async function onRequestPost(context) {
  const denied = requireAdminAccess(context);
  if (denied) return denied;

  const { env } = context;

  if (!env.DB) {
    return jsonResponse({ error: 'D1-Binding DB fehlt.' }, 503);
  }

  try {
    const candidates = await loadImportCandidates(env);
    const result = await upsertImportedEvents(env.DB, candidates);

    return jsonResponse({
      message: `${result.candidateCount} Kandidaten wurden importiert.`,
      importedCount: result.importedCount,
      updatedCount: result.updatedCount,
      candidateCount: result.candidateCount,
    });
  } catch (error) {
    const message =
      error.name === 'AbortError'
        ? 'iCalendar-Abruf hat zu lange gedauert.'
        : error.message || 'Import fehlgeschlagen.';
    return jsonResponse({ error: message }, 500);
  }
}
