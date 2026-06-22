import { listActiveRawIds, updateSelections } from './_events-db.js';
import { requireAdminAccess } from './_require-access.js';

const MAX_BODY_BYTES = 1024 * 1024;

function jsonResponse(payload, status) {
  return Response.json(payload, {
    status,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}

async function readJsonBody(request) {
  const text = await request.text();
  if (!text) return {};

  if (text.length > MAX_BODY_BYTES) {
    throw new Error('Die Anfrage ist zu gross.');
  }

  return JSON.parse(text);
}

function validateSelections(body, existingIds) {
  if (!Array.isArray(body.selections)) {
    return { error: 'selections muss eine Liste sein.', status: 400 };
  }

  const selectionIds = new Set();

  for (const selection of body.selections) {
    if (
      !selection ||
      typeof selection.rawId !== 'string' ||
      typeof selection.showOnWebsite !== 'boolean' ||
      !existingIds.has(selection.rawId) ||
      selectionIds.has(selection.rawId)
    ) {
      return { error: 'Die Auswahl enthaelt ungueltige oder doppelte Termine.', status: 400 };
    }

    selectionIds.add(selection.rawId);
  }

  if (selectionIds.size !== existingIds.size || body.selections.length !== existingIds.size) {
    return {
      error: 'Die Kandidatenliste hat sich geaendert. Bitte neu laden und erneut auswaehlen.',
      status: 409,
    };
  }

  return {
    selections: body.selections.map((selection) => ({
      rawId: selection.rawId,
      showOnWebsite: selection.showOnWebsite,
    })),
  };
}

export async function onRequestPost(context) {
  const denied = requireAdminAccess(context);
  if (denied) return denied;

  const { env, request } = context;

  if (!env.DB) {
    return jsonResponse({ error: 'D1-Binding DB fehlt.' }, 503);
  }

  let body;
  try {
    body = await readJsonBody(request);
  } catch (error) {
    const status = error instanceof SyntaxError ? 400 : 500;
    return jsonResponse({ error: error.message || 'Ungueltige Anfrage.' }, status);
  }

  try {
    const existingIds = new Set(await listActiveRawIds(env.DB));
    const validation = validateSelections(body, existingIds);

    if (validation.error) {
      return jsonResponse({ error: validation.error }, validation.status);
    }

    await updateSelections(env.DB, validation.selections);

    const approvedCount = validation.selections.filter((selection) => selection.showOnWebsite).length;
    return jsonResponse({
      message: 'Auswahl wurde gespeichert.',
      approvedCount,
    });
  } catch (error) {
    return jsonResponse({ error: error.message || 'Auswahl konnte nicht gespeichert werden.' }, 500);
  }
}
