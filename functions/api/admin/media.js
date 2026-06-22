import { getMediaEventById, listMediaEvents, updateMediaEvent } from './_media-db.js';
import { requireAdminAccess } from './_require-access.js';

const MAX_BODY_BYTES = 128 * 1024;

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

function normalizePath(value, fieldName, { allowEmpty = false } = {}) {
  if (typeof value !== 'string') {
    return { error: `${fieldName} muss ein Text sein.`, status: 400 };
  }

  const trimmed = value.trim();
  if (!trimmed && !allowEmpty) {
    return { error: `${fieldName} darf nicht leer sein.`, status: 400 };
  }

  if (trimmed.includes('..')) {
    return { error: `${fieldName} ist ungueltig.`, status: 400 };
  }

  if (!trimmed) {
    return { value: '' };
  }

  return { value: trimmed.startsWith('/') ? trimmed : `/${trimmed}` };
}

function validateGallery(value) {
  if (!Array.isArray(value)) {
    return { error: 'gallery muss eine Liste sein.', status: 400 };
  }

  const gallery = [];
  for (const item of value) {
    const normalized = normalizePath(item, 'gallery');
    if (normalized.error) {
      return normalized;
    }
    if (normalized.value) {
      gallery.push(normalized.value);
    }
  }

  return { gallery };
}

function validateBoolean(value, fieldName) {
  if (typeof value !== 'boolean') {
    return { error: `${fieldName} muss true oder false sein.`, status: 400 };
  }
  return { value };
}

function validateSaveBody(body) {
  if (!body || typeof body.id !== 'string' || !body.id.trim()) {
    return { error: 'id fehlt.', status: 400 };
  }

  if (typeof body.title !== 'string' || !body.title.trim()) {
    return { error: 'title fehlt.', status: 400 };
  }

  if (typeof body.description !== 'string') {
    return { error: 'description muss ein Text sein.', status: 400 };
  }

  if (typeof body.seoTitle !== 'string') {
    return { error: 'seoTitle muss ein Text sein.', status: 400 };
  }

  if (typeof body.internalNote !== 'string') {
    return { error: 'internalNote muss ein Text sein.', status: 400 };
  }

  const coverPath = normalizePath(body.coverPath, 'coverPath');
  if (coverPath.error) return coverPath;

  const videoPath = normalizePath(body.videoPath, 'videoPath', { allowEmpty: true });
  if (videoPath.error) return videoPath;

  const gallery = validateGallery(body.gallery);
  if (gallery.error) return gallery;

  const showOnWebsite = validateBoolean(body.showOnWebsite, 'showOnWebsite');
  if (showOnWebsite.error) return showOnWebsite;

  const showInArchive = validateBoolean(body.showInArchive, 'showInArchive');
  if (showInArchive.error) return showInArchive;

  return {
    payload: {
      id: body.id.trim(),
      title: body.title.trim(),
      description: body.description.trim(),
      seoTitle: body.seoTitle.trim(),
      internalNote: body.internalNote.trim(),
      coverPath: coverPath.value,
      videoPath: videoPath.value,
      gallery: gallery.gallery,
      showOnWebsite: showOnWebsite.value,
      showInArchive: showInArchive.value,
    },
  };
}

export async function onRequestGet(context) {
  const denied = requireAdminAccess(context);
  if (denied) return denied;

  const { env } = context;

  if (!env.DB) {
    return jsonResponse({ error: 'D1-Binding DB fehlt.' }, 503);
  }

  try {
    const events = await listMediaEvents(env.DB);
    return jsonResponse({ events });
  } catch (error) {
    return jsonResponse({ error: error.message || 'Medien konnten nicht geladen werden.' }, 500);
  }
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

  const validation = validateSaveBody(body);
  if (validation.error) {
    return jsonResponse({ error: validation.error }, validation.status);
  }

  try {
    const existing = await getMediaEventById(env.DB, validation.payload.id);
    if (!existing) {
      return jsonResponse({ error: 'Medienbereich wurde nicht gefunden.' }, 404);
    }

    const saved = await updateMediaEvent(env.DB, validation.payload);
    if (!saved) {
      return jsonResponse({ error: 'Änderungen konnten nicht gespeichert werden.' }, 500);
    }

    const event = await getMediaEventById(env.DB, validation.payload.id);
    return jsonResponse({
      message: 'Änderungen wurden gespeichert.',
      event,
    });
  } catch (error) {
    return jsonResponse({ error: error.message || 'Medien konnten nicht gespeichert werden.' }, 500);
  }
}
