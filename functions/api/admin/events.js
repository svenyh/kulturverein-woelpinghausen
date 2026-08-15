import {
  createManualEvent,
  deleteAdminEvent,
  listAdminEvents,
  updateAdminEvent,
} from './_events-db.js';
import { requireAdminAccess } from './_require-access.js';

const MAX_BODY_BYTES = 32 * 1024;
const LIMITS = {
  title: 200,
  description: 5000,
  location: 500,
  category: 100,
  sourceUrl: 2048,
};

function jsonResponse(payload, status = 200) {
  return Response.json(payload, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

async function readJsonBody(request) {
  const declaredLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return { error: 'Die Anfrage ist zu groß.', status: 413 };
  }

  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) {
    return { error: 'Die Anfrage ist zu groß.', status: 413 };
  }

  try {
    return { body: text ? JSON.parse(text) : {} };
  } catch {
    return { error: 'Die Anfrage enthält kein gültiges JSON.', status: 400 };
  }
}

function stringField(body, name, { required = false, max } = {}) {
  if (typeof body?.[name] !== 'string') {
    return { error: `${name} muss ein Text sein.` };
  }
  const value = body[name].trim();
  if (required && !value) return { error: `${name} fehlt.` };
  if (value.length > max) return { error: `${name} ist zu lang.` };
  return { value };
}

function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function validateEvent(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Die Termindaten fehlen.' };
  }

  const fields = {};
  for (const [name, options] of Object.entries({
    title: { required: true, max: LIMITS.title },
    description: { required: true, max: LIMITS.description },
    date: { required: true, max: 10 },
    startTime: { required: true, max: 5 },
    endTime: { max: 5 },
    location: { required: true, max: LIMITS.location },
    category: { max: LIMITS.category },
    sourceUrl: { max: LIMITS.sourceUrl },
  })) {
    const result = stringField(body, name, options);
    if (result.error) return result;
    fields[name] = result.value;
  }

  if (!validDate(fields.date)) {
    return { error: 'date muss ein gültiges Datum im Format JJJJ-MM-TT sein.' };
  }
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(fields.startTime)) {
    return { error: 'startTime muss eine gültige Uhrzeit im Format HH:MM sein.' };
  }
  if (fields.endTime && !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(fields.endTime)) {
    return { error: 'endTime muss eine gültige Uhrzeit im Format HH:MM sein.' };
  }
  if (fields.endTime && fields.endTime <= fields.startTime) {
    return { error: 'endTime muss nach startTime liegen.' };
  }
  if (fields.sourceUrl) {
    try {
      const url = new URL(fields.sourceUrl);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error();
      fields.sourceUrl = url.href;
    } catch {
      return { error: 'sourceUrl muss eine gültige HTTP- oder HTTPS-Adresse sein.' };
    }
  }
  if (body.status !== 'draft' && body.status !== 'published') {
    return { error: 'status muss draft oder published sein.' };
  }

  return {
    event: {
      ...fields,
      published: body.status === 'published' ? 1 : 0,
    },
  };
}

function requireDatabase(context) {
  const denied = requireAdminAccess(context);
  if (denied) return denied;
  if (!context.env.DB) return jsonResponse({ error: 'D1-Binding DB fehlt.' }, 503);
  return null;
}

export async function onRequestGet(context) {
  const denied = requireDatabase(context);
  if (denied) return denied;

  try {
    return jsonResponse({ events: await listAdminEvents(context.env.DB) });
  } catch (error) {
    return jsonResponse({ error: error.message || 'Termine konnten nicht geladen werden.' }, 500);
  }
}

export async function onRequestPost(context) {
  const denied = requireDatabase(context);
  if (denied) return denied;

  const parsed = await readJsonBody(context.request);
  if (parsed.error) return jsonResponse({ error: parsed.error }, parsed.status);
  const validation = validateEvent(parsed.body);
  if (validation.error) return jsonResponse({ error: validation.error }, 400);

  try {
    const event = await createManualEvent(context.env.DB, validation.event);
    return jsonResponse({ message: 'Termin wurde erstellt.', event }, 201);
  } catch (error) {
    return jsonResponse({ error: error.message || 'Termin konnte nicht erstellt werden.' }, 500);
  }
}

export async function onRequestPatch(context) {
  const denied = requireDatabase(context);
  if (denied) return denied;

  const parsed = await readJsonBody(context.request);
  if (parsed.error) return jsonResponse({ error: parsed.error }, parsed.status);
  if (typeof parsed.body?.id !== 'string' || !parsed.body.id.trim()) {
    return jsonResponse({ error: 'id fehlt.' }, 400);
  }
  const validation = validateEvent(parsed.body);
  if (validation.error) return jsonResponse({ error: validation.error }, 400);

  try {
    const event = await updateAdminEvent(
      context.env.DB,
      parsed.body.id.trim(),
      validation.event
    );
    if (!event) return jsonResponse({ error: 'Termin wurde nicht gefunden.' }, 404);
    return jsonResponse({ message: 'Termin wurde gespeichert.', event });
  } catch (error) {
    return jsonResponse({ error: error.message || 'Termin konnte nicht gespeichert werden.' }, 500);
  }
}

export async function onRequestDelete(context) {
  const denied = requireDatabase(context);
  if (denied) return denied;

  const id = new URL(context.request.url).searchParams.get('id')?.trim();
  if (!id) return jsonResponse({ error: 'id fehlt.' }, 400);

  try {
    if (!(await deleteAdminEvent(context.env.DB, id))) {
      return jsonResponse({ error: 'Termin wurde nicht gefunden.' }, 404);
    }
    return jsonResponse({ message: 'Termin wurde gelöscht.' });
  } catch (error) {
    return jsonResponse({ error: error.message || 'Termin konnte nicht gelöscht werden.' }, 500);
  }
}
